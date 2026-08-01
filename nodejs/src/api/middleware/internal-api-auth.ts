import crypto from 'crypto'
import { NextFunction, Request, Response } from 'ultimate-express'

import { logger } from '~/utils/logger'

/**
 * Internal API authentication middleware.
 *
 * This is the ONLY gate in front of the internal HTTP surface — the recording API
 * (block reads, recording deletion, bulk deletion) and the CDP API. Network
 * placement is NOT a second gate: a ClusterIP service, or no service at all, still
 * leaves the pod IP routable by every other workload in the cluster.
 *
 * Therefore an unconfigured secret DENIES. An empty secret is a misconfiguration,
 * never permission — previously it called next(), which served and deleted any
 * team's recordings to any in-cluster caller with zero credentials.
 *
 * One principal: presenting the secret proves "a trusted internal service", not
 * "a user of team N". Per-team authorization belongs to the caller — Django's
 * session_recording_api.py resolves team_id from the authenticated user, never
 * from user input. An HMAC over team_id keyed by this same shared secret would add
 * nothing, since anyone holding the secret could mint one.
 */

const HEADER_NAME = 'X-Internal-Api-Secret'

// Paths that never require authentication: kubelet probes and prometheus scrapes,
// which arrive without credentials, plus the public webhook surface.
const PUBLIC_PATH_PREFIXES = ['/public/', '/healthz', '/_ready', '/_metrics', '/metrics']

// Denials are indistinguishable to the client. The reason goes to the log, so an
// operator can tell "no secret deployed" from "wrong secret" without handing a
// caller an oracle for which of the two it is hitting.
const DENIED = { error: 'Unauthorized' }

export interface InternalApiAuthOptions {
    secret: string
    excludedPathPrefixes?: string[]
}

/**
 * Compare in time independent of content AND of length. timingSafeEqual throws on
 * unequal lengths, so comparing raw values forces a length short-circuit that leaks
 * the secret's length. Digests are always 32 bytes, so the comparison is total.
 */
function secretsMatch(configured: string, provided: string): boolean {
    const a = crypto.createHash('sha256').update(configured, 'utf8').digest()
    const b = crypto.createHash('sha256').update(provided, 'utf8').digest()
    return crypto.timingSafeEqual(a, b)
}

export function createInternalApiAuthMiddleware(options: InternalApiAuthOptions) {
    const { secret, excludedPathPrefixes = [] } = options
    const allExcludedPrefixes = [...PUBLIC_PATH_PREFIXES, ...excludedPathPrefixes]

    if (!secret) {
        // Announced once at wiring time, not per request: without this line the
        // refusals below look like a routing fault rather than a missing secret.
        logger.warn(
            'INTERNAL_API_SECRET is not configured — the internal HTTP API will refuse every authenticated route'
        )
    }

    return (req: Request, res: Response, next: NextFunction): void => {
        if (allExcludedPrefixes.some((prefix) => req.path.startsWith(prefix))) {
            next()
            return
        }

        if (!secret) {
            logger.warn('Internal API request refused: no secret is configured', {
                path: req.path,
                method: req.method,
            })
            res.status(401).json(DENIED)
            return
        }

        const providedSecret =
            req.headers[HEADER_NAME] || req.headers[HEADER_NAME.toLowerCase()] || req.headers[HEADER_NAME.toUpperCase()]

        if (!providedSecret || typeof providedSecret !== 'string') {
            logger.warn('Internal API request missing authentication header', {
                path: req.path,
                method: req.method,
            })
            res.status(401).json(DENIED)
            return
        }

        if (!secretsMatch(secret, providedSecret)) {
            logger.warn('Internal API request with invalid secret', {
                path: req.path,
                method: req.method,
            })
            res.status(401).json(DENIED)
            return
        }

        next()
    }
}
