import { KeyObject, createPublicKey, verify as verifySignature } from 'crypto'
import { NextFunction, Request, Response } from 'ultimate-express'

import { parseJSON } from '~/utils/json-parse'
import { logger } from '~/utils/logger'
import { internalFetch } from '~/utils/request'

/**
 * The ONE place a request becomes an identity on this server.
 *
 * WHY IAM AND NOT A SHARED SECRET. What stood here was INTERNAL_API_SECRET: one
 * static string, held by both insights-web and this process, compared per
 * request. A password is not an identity. It answers "does the caller know the
 * string" and nothing else — not WHO is calling, not WHICH org they may touch —
 * so it could not have stopped org A from deleting org B's recordings even on
 * the day it worked. It also cannot expire, cannot be revoked for one caller,
 * and cannot be attributed in an audit trail.
 *
 * A token minted by Hanzo IAM answers all of those. It names a principal, it
 * carries the org that principal belongs to (`owner`), it expires, and IAM can
 * revoke it. This module verifies one against IAM's published keys and hands
 * back the two facts a gate turns on: WHO, and WHICH ORG.
 *
 * SAME MECHANISM AS THE REST OF THE ESTATE, not a second one. cloud's data plane
 * gates on principal.ValidatedFrom(ctx) — a validated principal must exist, and
 * the org is read off it, never off the request the caller controls. This is
 * that rule on this server: the org comes from a signature-verified claim, so a
 * caller cannot assert its own tenancy.
 *
 * NOTHING CLIENT-SUPPLIED IS EVER AN IDENTITY. The principal is attached under a
 * module-private symbol, so a request body, query string or header named
 * "principal" cannot become one. There is no header form of the org for the same
 * reason — an off-gateway caller sending `X-Org-Id: victim` is precisely the
 * forge this is here to refuse.
 *
 * FAIL CLOSED, ALWAYS. No token, an expired token, an unknown signing key, an
 * unreachable JWKS, a claim that is missing or oversized: every one of those is
 * 401. An outage of IAM makes this server refuse, never serve. That direction is
 * deliberate — the endpoint behind it DELETES data.
 */

/** A verified caller. Both fields come from claims IAM signed. */
export interface Principal {
    /** The IAM subject (`<owner>/<name>`) — who to attribute an action to. */
    user: string
    /** The IAM `owner` claim: the org this principal belongs to. The tenant key. */
    org: string
}

export interface IamOptions {
    /** Expected `iss`. A token from any other issuer is refused. */
    issuer: string
    /** Where IAM publishes its signing keys. */
    jwksUrl: string
}

const AUTH_SCHEME = 'bearer '

/**
 * What serves without a principal, split by the shape each one actually is.
 *
 * Kubelet probes and prometheus scrapes arrive without credentials, and they are
 * exactly four PATHS — so they are matched exactly. Prefix-matching them (which
 * is what this did, inherited from the middleware it replaces) quietly makes
 * every future path that merely STARTS with one of them public: `/metrics` would
 * exempt `/metricsExport`, and nothing about adding that route would say so. No
 * such route exists today, so this closes a trap rather than a hole — but a trap
 * in the one file that decides who gets in is worth closing while it is still
 * only a trap.
 *
 * /public/ is genuinely a SUBTREE — the webhook surface, public by contract, with
 * `:webhook_id` under it — so it stays a prefix.
 */
const PUBLIC_PATHS = ['/healthz', '/_ready', '/_metrics', '/metrics']
const PUBLIC_PATH_PREFIXES = ['/public/']

/**
 * The org is an IAM owner claim — a short label. Anything longer is malformed or
 * hostile before it can ever become a comparison key. Same bound as cloud's
 * principal.MaxOrgLen, for the same reason.
 */
const MAX_ORG_LEN = 128

/**
 * Refusals are indistinguishable to the caller. The reason goes to the log so an
 * operator can separate "no token" from "bad signature" without handing a prober
 * an oracle for which one it hit.
 */
const DENIED = { error: 'Unauthorized' }

/** Symbol, not a string key: a caller cannot spoof what it cannot name. */
const PRINCIPAL = Symbol('principal')

/** The verified caller, or null on a route that never required one. */
export function principalOf(req: Request): Principal | null {
    return (req as unknown as Record<symbol, Principal | undefined>)[PRINCIPAL] ?? null
}

interface Jwk {
    kid?: string
    kty?: string
    alg?: string
    use?: string
}

/**
 * IAM's signing keys, cached by `kid`.
 *
 * IAM signs with a per-org certificate (cert-hanzo, cert-lux, …), so the key set
 * grows as orgs are added and a `kid` this process has never seen is NORMAL, not
 * an attack. It is also the obvious way to make us hammer IAM: present junk kids
 * in a loop. So an unknown kid triggers at most one refetch per REFETCH_INTERVAL
 * — new keys are picked up within a minute, and a flood costs one request.
 *
 * Only RS256 keys are admitted. Restricting the algorithm at the KEY, before any
 * signature check, is what makes "alg: none" and the HMAC-with-the-public-key
 * confusion unreachable rather than merely unlikely.
 */
class KeyStore {
    private keys = new Map<string, KeyObject>()
    private lastFetch = 0
    private inFlight: Promise<void> | null = null

    private static readonly REFETCH_INTERVAL_MS = 60_000
    private static readonly FETCH_TIMEOUT_MS = 5_000

    constructor(private jwksUrl: string) {}

    async get(kid: string): Promise<KeyObject | null> {
        const cached = this.keys.get(kid)
        if (cached) {
            return cached
        }
        await this.refresh()
        return this.keys.get(kid) ?? null
    }

    private async refresh(): Promise<void> {
        if (Date.now() - this.lastFetch < KeyStore.REFETCH_INTERVAL_MS) {
            return
        }
        // Collapse concurrent misses onto one fetch: a burst of parallel block
        // reads after a key rotation must not become a burst of JWKS requests.
        this.inFlight ??= this.fetch().finally(() => (this.inFlight = null))
        await this.inFlight
    }

    private async fetch(): Promise<void> {
        try {
            // internalFetch, not fetch: the SSRF-guarded agent exists for
            // caller-supplied URLs and refuses private addresses, and this URL
            // is operator configuration that may legitimately name IAM's
            // in-cluster address rather than its public one.
            const response = await internalFetch(this.jwksUrl, { timeoutMs: KeyStore.FETCH_TIMEOUT_MS })
            if (response.status !== 200) {
                throw new Error(`JWKS responded ${response.status}`)
            }
            const body = (await response.json()) as { keys?: Jwk[] }
            const fetched = new Map<string, KeyObject>()
            for (const jwk of body.keys ?? []) {
                if (!jwk.kid || jwk.kty !== 'RSA' || (jwk.alg && jwk.alg !== 'RS256')) {
                    continue
                }
                try {
                    fetched.set(jwk.kid, createPublicKey({ key: jwk as any, format: 'jwk' }))
                } catch (error) {
                    logger.warn('Skipping unusable IAM signing key', { kid: jwk.kid, error })
                }
            }
            if (fetched.size === 0) {
                throw new Error('JWKS contained no usable RS256 keys')
            }
            // Replace wholesale rather than merge, so a key IAM has retired stops
            // verifying here too.
            this.keys = fetched
            this.lastFetch = Date.now()
        } catch (error) {
            // Keep whatever we already hold and let the caller refuse. Clearing
            // the cache on a transient IAM blip would turn it into an outage.
            this.lastFetch = Date.now()
            logger.error('Could not refresh IAM signing keys', { jwksUrl: this.jwksUrl, error })
        }
    }
}

/** Reads a claim that must be a non-empty, bounded string. */
function claim(payload: Record<string, unknown>, name: string, maxLen: number): string | null {
    const value = payload[name]
    if (typeof value !== 'string') {
        return null
    }
    // Trimmed but NEVER lowercased or truncated: folding collapses distinct
    // owners ("acme", "ACME", a 128-char prefix) into one bucket, which is itself
    // a cross-org break.
    const trimmed = value.trim()
    return trimmed && trimmed.length <= maxLen ? trimmed : null
}

export class Iam {
    private keys: KeyStore

    constructor(private options: IamOptions) {
        this.keys = new KeyStore(options.jwksUrl)
    }

    /**
     * Verify a compact JWS and return its principal, or null.
     *
     * Order matters: the header is parsed only far enough to select a key, the
     * SIGNATURE is checked next, and no claim is read — let alone trusted —
     * until it has been. Reading `owner` from an unverified payload would be the
     * same bug in a new costume.
     */
    async verify(token: string): Promise<Principal | null> {
        const parts = token.split('.')
        if (parts.length !== 3) {
            return null
        }
        const [rawHeader, rawPayload, rawSignature] = parts

        let header: { alg?: string; kid?: string }
        try {
            header = parseJSON(Buffer.from(rawHeader, 'base64url').toString('utf8'))
        } catch {
            return null
        }
        // The token does not get to choose the algorithm. RS256 or nothing.
        if (header.alg !== 'RS256' || !header.kid) {
            return null
        }

        const key = await this.keys.get(header.kid)
        if (!key) {
            return null
        }

        const signed = Buffer.from(`${rawHeader}.${rawPayload}`)
        const signature = Buffer.from(rawSignature, 'base64url')
        if (!verifySignature('RSA-SHA256', signed, key, signature)) {
            return null
        }

        let payload: Record<string, unknown>
        try {
            payload = parseJSON(Buffer.from(rawPayload, 'base64url').toString('utf8'))
        } catch {
            return null
        }

        if (payload.iss !== this.options.issuer) {
            return null
        }

        // Lifetime. `exp` is REQUIRED: a token that never expires is a password
        // with extra steps, which is the thing being removed here.
        const now = Date.now() / 1000
        if (typeof payload.exp !== 'number' || payload.exp <= now) {
            return null
        }
        if (typeof payload.nbf === 'number' && payload.nbf > now) {
            return null
        }

        const user = claim(payload, 'sub', 256)
        const org = claim(payload, 'owner', MAX_ORG_LEN)
        if (!user || !org) {
            return null
        }

        return { user, org }
    }
}

export interface PrincipalMiddlewareOptions {
    /** Routes that serve without a principal, beyond probes and /public/. */
    excludedPathPrefixes?: string[]
}

/**
 * The gate. Every route that is not explicitly public needs a verified IAM
 * principal, and handlers downstream read the org off that principal — never off
 * the path, the body or a header.
 */
export function createPrincipalMiddleware(iam: Iam | null, options: PrincipalMiddlewareOptions = {}) {
    const excludedPrefixes = [...PUBLIC_PATH_PREFIXES, ...(options.excludedPathPrefixes ?? [])]
    const isPublic = (path: string): boolean =>
        PUBLIC_PATHS.includes(path) || excludedPrefixes.some((prefix) => path.startsWith(prefix))

    if (!iam) {
        // Said once at wiring time, not per request: without this the refusals
        // below read like a routing fault instead of missing configuration.
        logger.warn('IAM is not configured — the internal HTTP API will refuse every authenticated route')
    }

    return (req: Request, res: Response, next: NextFunction): void => {
        if (isPublic(req.path)) {
            next()
            return
        }

        if (!iam) {
            logger.warn('Request refused: IAM is not configured', { path: req.path, method: req.method })
            res.status(401).json(DENIED)
            return
        }

        const authorization = req.headers['authorization']
        if (typeof authorization !== 'string' || !authorization.toLowerCase().startsWith(AUTH_SCHEME)) {
            logger.warn('Request refused: no bearer token', { path: req.path, method: req.method })
            res.status(401).json(DENIED)
            return
        }

        iam.verify(authorization.slice(AUTH_SCHEME.length).trim())
            .then((principal) => {
                if (!principal) {
                    logger.warn('Request refused: token did not verify', { path: req.path, method: req.method })
                    res.status(401).json(DENIED)
                    return
                }
                ;(req as unknown as Record<symbol, Principal>)[PRINCIPAL] = principal
                next()
            })
            .catch((error) => {
                // An exception is not permission.
                logger.error('Request refused: principal verification threw', {
                    path: req.path,
                    method: req.method,
                    error,
                })
                res.status(401).json(DENIED)
            })
    }
}
