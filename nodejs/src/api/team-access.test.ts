import { Server } from 'http'
import supertest from 'supertest'
import express from 'ultimate-express'

import { PostgresRouter } from '~/utils/db/postgres'

import { TestIam, startTestIam } from './_tests/iam'
import { createPrincipalMiddleware } from './principal'
import { TeamOrgs, requireTeamAccess } from './team-access'

/**
 * The reproduced defect was not that the API had no gate — it was that the team
 * came out of the URL and nothing ever asked whether the caller owned it. These
 * cases are the answer to that: a verified principal is necessary and not
 * sufficient, and a path segment never decides tenancy.
 */
describe('team access', () => {
    let iam: TestIam
    let app: express.Application
    let brokenDb: express.Application
    const listening: Server[] = []

    // team 1 belongs to hanzo, team 2 to another tenant.
    const orgOfTeam: Record<number, string> = { 1: 'hanzo', 2: 'acme' }
    let queries = 0

    const postgres = {
        query: (_use: unknown, _sql: string, params: unknown[]) => {
            queries++
            const slug = orgOfTeam[params[0] as number]
            return Promise.resolve({ rows: slug ? [{ slug }] : [] })
        },
    } as unknown as PostgresRouter

    const build = (router: PostgresRouter): express.Application => {
        const application = express()
        application.use(createPrincipalMiddleware(iam.iam))
        application.delete(
            '/api/projects/:team_id/recordings/:session_id',
            requireTeamAccess(new TeamOrgs(router)),
            (req, res) => {
                res.status(200).json({ deleted: req.params.session_id })
            }
        )
        listening.push(application.listen(0, () => {}))
        return application
    }

    beforeAll(async () => {
        iam = await startTestIam()
        app = build(postgres)
        brokenDb = build({ query: () => Promise.reject(new Error('connection refused')) } as unknown as PostgresRouter)
    })

    afterAll(async () => {
        // close() without awaiting its callback: ultimate-express sits on
        // uWebSockets, whose close does not invoke the node-style callback, so
        // awaiting it hangs the suite rather than tearing it down.
        listening.forEach((server) => server.close())
        await iam.close()
    })

    beforeEach(() => {
        queries = 0
    })

    const del = (teamId: string, token?: string) => {
        const request = supertest(app).delete(`/api/projects/${teamId}/recordings/abc`)
        return token ? request.set('authorization', `Bearer ${token}`) : request
    }

    it('refuses the unauthenticated delete that was reproduced in the cluster', async () => {
        await del('1').expect(401)
    })

    it('refuses a verified principal naming another org’s team', async () => {
        // The whole point: hanzo is authenticated, and still may not touch acme.
        await del('2', iam.token('hanzo')).expect(403)
    })

    it('refuses a team that does not exist', async () => {
        await del('9999', iam.token('hanzo')).expect(403)
    })

    it('refuses a non-numeric team id before it can reach the database', async () => {
        await del('1%20or%201=1', iam.token('hanzo')).expect(403)
        await del('0', iam.token('hanzo')).expect(403)
        expect(queries).toBe(0)
    })

    it('allows a principal to act on its own org’s team', async () => {
        const response = await del('1', iam.token('hanzo')).expect(200)
        expect(response.body).toEqual({ deleted: 'abc' })
    })

    it('matches the org exactly — no case folding, no prefixes', async () => {
        // Folding would collapse distinct owners into one bucket, which is
        // itself a cross-org break.
        await del('1', iam.token('HANZO')).expect(403)
        await del('1', iam.token('hanz')).expect(403)
        await del('1', iam.token('hanzo-staging')).expect(403)
    })

    it('refuses when the database cannot say who owns the team', async () => {
        await supertest(brokenDb)
            .delete('/api/projects/1/recordings/abc')
            .set('authorization', `Bearer ${iam.token('hanzo')}`)
            .expect(403)
    })

    it('caches the team’s org instead of querying per block fetch', async () => {
        const teams = new TeamOrgs(postgres)
        expect(await teams.orgOf(1)).toBe('hanzo')
        expect(await teams.orgOf(1)).toBe('hanzo')
        expect(await teams.orgOf(1)).toBe('hanzo')
        expect(queries).toBe(1)
    })
})
