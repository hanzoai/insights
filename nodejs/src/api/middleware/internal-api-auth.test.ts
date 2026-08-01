import supertest from 'supertest'
import { Request, Response } from 'ultimate-express'

import { setupCommonRoutes, setupExpressApp } from '~/api/router'

import { createInternalApiAuthMiddleware } from './internal-api-auth'

describe('createInternalApiAuthMiddleware', () => {
    const mockResponse = () => {
        const res = {} as Response
        res.status = jest.fn().mockReturnValue(res)
        res.json = jest.fn().mockReturnValue(res)
        return res
    }

    const mockRequest = (path: string, headers: Record<string, string> = {}) => {
        return {
            headers,
            path,
            method: 'GET',
        } as unknown as Request
    }

    describe('when no secret configured', () => {
        it('should refuse the request rather than fall open', () => {
            const middleware = createInternalApiAuthMiddleware({ secret: '' })
            const req = mockRequest('/api/test')
            const res = mockResponse()
            const next = jest.fn()

            middleware(req, res, next)

            expect(next).not.toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
        })

        it('should refuse even when the caller presents a secret', () => {
            const middleware = createInternalApiAuthMiddleware({ secret: '' })
            const req = mockRequest('/api/test', { 'x-internal-api-secret': 'anything' })
            const res = mockResponse()
            const next = jest.fn()

            middleware(req, res, next)

            expect(next).not.toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(401)
        })

        // The live exposure: INTERNAL_API_SECRET was '' on insights-plugin, so an
        // uncredentialed caller at the pod IP read one team's recording block and
        // reached the deletion handlers. Every recording-api route must refuse.
        it.each([
            ['GET', '/api/projects/1/recordings/some-session/block'],
            ['DELETE', '/api/projects/1/recordings/some-session'],
            ['POST', '/api/projects/1/recordings/bulk_delete'],
        ])('should refuse uncredentialed %s %s', (method, path) => {
            const middleware = createInternalApiAuthMiddleware({ secret: '' })
            const req = { headers: {}, path, method } as unknown as Request
            const res = mockResponse()
            const next = jest.fn()

            middleware(req, res, next)

            expect(next).not.toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(401)
        })

        it('should still serve probes and metrics, so an unconfigured pod stays alive', () => {
            const middleware = createInternalApiAuthMiddleware({ secret: '' })
            for (const path of ['/healthz', '/_ready', '/_metrics', '/metrics', '/public/webhooks/1']) {
                const req = mockRequest(path)
                const res = mockResponse()
                const next = jest.fn()

                middleware(req, res, next)

                expect(next).toHaveBeenCalled()
                expect(res.status).not.toHaveBeenCalled()
            }
        })
    })

    describe('when secret configured', () => {
        it('should reject request when header is missing', () => {
            const middleware = createInternalApiAuthMiddleware({ secret: 'test-secret' })
            const req = mockRequest('/api/test', {})
            const res = mockResponse()
            const next = jest.fn()

            middleware(req, res, next)

            expect(next).not.toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
        })

        it('should reject request when secret does not match', () => {
            const middleware = createInternalApiAuthMiddleware({ secret: 'correct-secret' })
            const req = mockRequest('/api/test', { 'x-internal-api-secret': 'wrong-secret' })
            const res = mockResponse()
            const next = jest.fn()

            middleware(req, res, next)

            expect(next).not.toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
        })

        it('should not tell the caller which denial arm it hit', () => {
            const middleware = createInternalApiAuthMiddleware({ secret: 'correct-secret' })
            const bodies: unknown[] = []
            const cases: Record<string, string>[] = [{}, { 'x-internal-api-secret': 'wrong-secret' }]
            for (const headers of cases) {
                const res = mockResponse()
                middleware(mockRequest('/api/test', headers), res, jest.fn())
                bodies.push((res.json as jest.Mock).mock.calls[0][0])
            }
            expect(bodies[0]).toEqual(bodies[1])
        })

        it.each([['x-internal-api-secret'], ['X-Internal-Api-Secret'], ['X-INTERNAL-API-SECRET']])(
            'should allow request when secret matches with %s header',
            (headerName) => {
                const middleware = createInternalApiAuthMiddleware({ secret: 'correct-secret' })
                const req = mockRequest('/api/test', { [headerName]: 'correct-secret' })
                const res = mockResponse()
                const next = jest.fn()

                middleware(req, res, next)

                expect(next).toHaveBeenCalled()
                expect(res.status).not.toHaveBeenCalled()
            }
        )

        // Digest-then-compare: raw timingSafeEqual throws on unequal lengths, which
        // forces a short-circuit that leaks how long the configured secret is.
        it('should reject when secrets have different lengths', () => {
            const middleware = createInternalApiAuthMiddleware({ secret: 'short' })
            const req = mockRequest('/api/test', { 'x-internal-api-secret': 'much-longer-secret' })
            const res = mockResponse()
            const next = jest.fn()

            middleware(req, res, next)

            expect(next).not.toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(401)
        })

        it('should reject when header value is not a string', () => {
            const middleware = createInternalApiAuthMiddleware({ secret: 'test-secret' })
            const req = {
                headers: { 'x-internal-api-secret': ['array', 'of', 'values'] },
                path: '/api/test',
                method: 'GET',
            } as unknown as Request
            const res = mockResponse()
            const next = jest.fn()

            middleware(req, res, next)

            expect(next).not.toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(401)
            expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' })
        })
    })

    describe('path exclusions', () => {
        it.each([
            ['/public/webhooks/123', 'public path'],
            ['/healthz', 'health check'],
            ['/_ready', 'ready check'],
            ['/_metrics', 'metrics'],
            ['/metrics', 'prometheus metrics'],
        ])('should skip auth for %s (%s)', (path) => {
            const middleware = createInternalApiAuthMiddleware({ secret: 'test-secret' })
            const req = mockRequest(path, {})
            const res = mockResponse()
            const next = jest.fn()

            middleware(req, res, next)

            expect(next).toHaveBeenCalled()
            expect(res.status).not.toHaveBeenCalled()
        })

        it('should allow custom excluded path prefixes', () => {
            const middleware = createInternalApiAuthMiddleware({
                secret: 'test-secret',
                excludedPathPrefixes: ['/custom/'],
            })
            const req = mockRequest('/custom/endpoint', {})
            const res = mockResponse()
            const next = jest.fn()

            middleware(req, res, next)

            expect(next).toHaveBeenCalled()
            expect(res.status).not.toHaveBeenCalled()
        })

        it('should still require auth for non-excluded paths', () => {
            const middleware = createInternalApiAuthMiddleware({ secret: 'test-secret' })
            const req = mockRequest('/api/some/endpoint', {})
            const res = mockResponse()
            const next = jest.fn()

            middleware(req, res, next)

            expect(next).not.toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(401)
        })
    })

    // Wiring, not just the function: setupExpressApp is the composition root every
    // internal route is mounted on, so the gate has to hold there. The routes below
    // are the ones RecordingApi.router() registers.
    describe('as wired by setupExpressApp', () => {
        const BLOCK = '/api/projects/1/recordings/a-session/block?key=k&start=0&end=1'
        const RECORDING = '/api/projects/1/recordings/a-session'
        const BULK_DELETE = '/api/projects/1/recordings/bulk_delete'

        const servers: { close: () => void }[] = []

        afterAll(() => servers.forEach((s) => s.close()))

        const withRoutes = (secret: string) => {
            const app = setupExpressApp({ internalApiSecret: secret })
            app.get('/api/projects/:t/recordings/:s/block', (_req: Request, res: Response) => res.send('BLOCK-BYTES'))
            app.delete('/api/projects/:t/recordings/:s', (_req: Request, res: Response) => res.json({ ok: true }))
            app.post('/api/projects/:t/recordings/bulk_delete', (_req: Request, res: Response) =>
                res.json({ ok: true })
            )
            setupCommonRoutes(app, [])
            servers.push(app.listen(0, () => {}))
            return app
        }

        it('refuses uncredentialed reads and deletes when no secret is deployed', async () => {
            const app = withRoutes('')

            const block = await supertest(app).get(BLOCK)
            expect(block.status).toEqual(401)
            expect(block.text).not.toContain('BLOCK-BYTES')

            expect((await supertest(app).delete(RECORDING)).status).toEqual(401)
            expect(
                (
                    await supertest(app)
                        .post(BULK_DELETE)
                        .send({ session_ids: ['a-session'] })
                ).status
            ).toEqual(401)
        })

        it('refuses a wrong secret and admits the right one', async () => {
            const app = withRoutes('the-deployed-secret')

            expect((await supertest(app).get(BLOCK)).status).toEqual(401)
            expect((await supertest(app).get(BLOCK).set('x-internal-api-secret', 'guess')).status).toEqual(401)

            const ok = await supertest(app).get(BLOCK).set('x-internal-api-secret', 'the-deployed-secret')
            expect(ok.status).toEqual(200)
            expect(ok.text).toEqual('BLOCK-BYTES')
        })

        it('keeps probes and metrics open so an unconfigured pod stays alive', async () => {
            const app = withRoutes('')
            expect((await supertest(app).get('/healthz')).status).toEqual(200)
            expect((await supertest(app).get('/_ready')).status).toEqual(200)
        })
    })
})
