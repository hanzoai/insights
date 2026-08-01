import { KeyObject, createSign, generateKeyPairSync } from 'crypto'
import { Server, createServer } from 'http'
import { AddressInfo } from 'net'

import { Iam } from '../principal'

/**
 * A stand-in for Hanzo IAM: a real keypair, a real JWKS over real HTTP, real
 * RS256 signatures.
 *
 * Not a mock of Iam. The whole value of the gate is what it REFUSES, and a mock
 * that returns a principal proves nothing about signature checking, issuer
 * pinning or expiry. Serving an actual JWKS means the tests exercise the same
 * fetch-verify path production takes, so a token signed by the wrong key really
 * is rejected rather than rejected-by-arrangement.
 */
export interface TestIam {
    iam: Iam
    issuer: string
    /** A valid bearer for `org`. Overrides let a test bend exactly one thing. */
    token: (org: string, overrides?: Record<string, unknown>) => string
    /** Sign with a key IAM never published — the forgery case. */
    tokenFromForeignKey: (org: string) => string
    close: () => Promise<void>
}

const ISSUER = 'https://iam.test'
const KID = 'cert-test'

function base64url(value: object | Buffer): string {
    const buffer = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value))
    return buffer.toString('base64url')
}

function sign(privateKey: KeyObject, kid: string, payload: Record<string, unknown>): string {
    const signed = `${base64url({ alg: 'RS256', typ: 'JWT', kid })}.${base64url(payload)}`
    const signer = createSign('RSA-SHA256')
    signer.update(signed)
    return `${signed}.${signer.sign(privateKey).toString('base64url')}`
}

export async function startTestIam(): Promise<TestIam> {
    const real = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const foreign = generateKeyPairSync('rsa', { modulusLength: 2048 })

    const jwks = {
        keys: [{ ...real.publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' }],
    }

    const server: Server = createServer((req, res) => {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify(jwks))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo
    const jwksUrl = `http://127.0.0.1:${port}/jwks`

    const claims = (org: string): Record<string, unknown> => ({
        iss: ISSUER,
        sub: `admin/${org}-caller`,
        owner: org,
        exp: Math.floor(Date.now() / 1000) + 300,
        iat: Math.floor(Date.now() / 1000),
    })

    return {
        iam: new Iam({ issuer: ISSUER, jwksUrl }),
        issuer: ISSUER,
        token: (org, overrides = {}) => sign(real.privateKey, KID, { ...claims(org), ...overrides }),
        tokenFromForeignKey: (org) => sign(foreign.privateKey, KID, claims(org)),
        close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    }
}
