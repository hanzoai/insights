import { Server } from 'http'
import supertest from 'supertest'
import express from 'ultimate-express'

import { TestIam, startTestIam } from './_tests/iam'
import { Iam, createPrincipalMiddleware, principalOf } from './principal'

/**
 * What this gate is for is REFUSAL, so that is what is asserted. Every way a
 * caller can arrive without a verified IAM principal has a case here, because
 * the endpoints behind it delete other tenants' session recordings and the
 * previous gate — a shared static string, absent in production — refused none of
 * them.
 */
describe('principal gate', () => {
    let iam: TestIam
    let gated: express.Application
    let unconfigured: express.Application
    const listening: Server[] = []

    const build = (instance: Iam | null): express.Application => {
        const app = express()
        app.use(createPrincipalMiddleware(instance))
        app.get('/api/projects/1/recordings/abc/block', (req, res) => {
            res.status(200).json({ org: principalOf(req)?.org ?? null })
        })
        app.get('/healthz', (_req, res) => {
            res.status(200).json({ status: 'ok' })
        })
        app.get('/public/webhooks/x', (_req, res) => {
            res.status(200).json({ ok: true })
        })
        listening.push(app.listen(0, () => {}))
        return app
    }

    beforeAll(async () => {
        iam = await startTestIam()
        gated = build(iam.iam)
        unconfigured = build(null)
    })

    afterAll(async () => {
        // close() without awaiting its callback: ultimate-express sits on
        // uWebSockets, whose close does not invoke the node-style callback, so
        // awaiting it hangs the suite rather than tearing it down.
        listening.forEach((server) => server.close())
        await iam.close()
    })

    const path = '/api/projects/1/recordings/abc/block'

    it('refuses a caller presenting nothing at all — the reproduced hole', async () => {
        await supertest(gated).get(path).expect(401)
    })

    it('refuses when IAM is not configured, rather than serving', async () => {
        // An unconfigured gate is a misconfiguration, never permission. The
        // shared-secret middleware this replaces called next() here, which is
        // what left production open.
        await supertest(unconfigured).get(path).expect(401)
    })

    it('refuses a token signed by a key IAM never published', async () => {
        await supertest(gated)
            .get(path)
            .set('authorization', `Bearer ${iam.tokenFromForeignKey('hanzo')}`)
            .expect(401)
    })

    it('refuses a token from another issuer', async () => {
        await supertest(gated)
            .get(path)
            .set('authorization', `Bearer ${iam.token('hanzo', { iss: 'https://evil.example' })}`)
            .expect(401)
    })

    it('refuses an expired token', async () => {
        await supertest(gated)
            .get(path)
            .set('authorization', `Bearer ${iam.token('hanzo', { exp: Math.floor(Date.now() / 1000) - 1 })}`)
            .expect(401)
    })

    it('refuses a token with no expiry — a password with extra steps', async () => {
        await supertest(gated)
            .get(path)
            .set('authorization', `Bearer ${iam.token('hanzo', { exp: undefined })}`)
            .expect(401)
    })

    it('refuses a token that carries no org', async () => {
        await supertest(gated)
            .get(path)
            .set('authorization', `Bearer ${iam.token('hanzo', { owner: '' })}`)
            .expect(401)
    })

    it('refuses an unsigned "alg: none" token', async () => {
        const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT', kid: 'cert-test' })).toString('base64url')
        const payload = Buffer.from(
            JSON.stringify({ iss: iam.issuer, sub: 'x', owner: 'hanzo', exp: Math.floor(Date.now() / 1000) + 300 })
        ).toString('base64url')
        await supertest(gated).get(path).set('authorization', `Bearer ${header}.${payload}.`).expect(401)
    })

    it('refuses garbage in the header', async () => {
        for (const value of ['Bearer', 'Bearer ', 'Basic abc', 'Bearer not.a.jwt', 'Bearer a.b']) {
            await supertest(gated).get(path).set('authorization', value).expect(401)
        }
    })

    it('cannot be satisfied by a header or query claiming an org', async () => {
        // The org is a signed claim or it is nothing. There is deliberately no
        // header form of it, because an off-gateway caller sending one is the
        // exact forge this exists to refuse.
        await supertest(gated)
            .get(`${path}?org=hanzo&principal=hanzo`)
            .set('x-org-id', 'hanzo')
            .set('x-user-id', 'someone')
            .expect(401)
    })

    it('admits a valid token and reports the org from the signed claim', async () => {
        const response = await supertest(gated)
            .get(path)
            .set('authorization', `Bearer ${iam.token('hanzo')}`)
            .expect(200)
        expect(response.body).toEqual({ org: 'hanzo' })
    })

    it('serves probes and the public webhook surface without a principal', async () => {
        await supertest(gated).get('/healthz').expect(200)
        await supertest(gated).get('/public/webhooks/x').expect(200)
    })
})
