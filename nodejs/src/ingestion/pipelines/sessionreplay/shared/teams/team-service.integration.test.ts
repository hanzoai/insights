import { defaultConfig } from '~/common/config/config'
import { PostgresRouter, PostgresUse } from '~/common/utils/db/postgres'
import { ValidRetentionPeriods } from '~/ingestion/pipelines/sessionreplay/shared/constants'
import { getFirstTeam, resetTestDatabase } from '~/tests/helpers/sql'

import { TeamService } from './team-service'

describe('TeamService (integration)', () => {
    let postgres: PostgresRouter
    let teamId: number
    let orgSlug: string

    beforeEach(async () => {
        await resetTestDatabase()
        postgres = new PostgresRouter(defaultConfig)
        const team = await getFirstTeam(postgres)
        teamId = team.id
        const slugResult = await postgres.query<{ slug: string }>(
            PostgresUse.COMMON_READ,
            `SELECT o.slug FROM insights_organization o JOIN insights_team t ON t.organization_id = o.id WHERE t.id = $1`,
            [teamId],
            'test-get-org-slug'
        )
        orgSlug = slugResult.rows[0].slug
    })

    afterEach(async () => {
        await postgres.end()
    })

    // Driven off the authoritative allowed set: every period Postgres is allowed to hold must store
    // and deserialize, and a newly added period is covered here automatically.
    it.each([...ValidRetentionPeriods])(
        'stores and deserializes retention period %s from a real Postgres row',
        async (period) => {
            await postgres.query(
                PostgresUse.COMMON_WRITE,
                `UPDATE insights_team SET session_recording_retention_period = $1 WHERE id = $2`,
                [period, teamId],
                'test-set-retention'
            )
            const teamService = new TeamService(postgres)

            expect(await teamService.getRetentionPeriodByTeamId(teamId)).toBe(period)
        }
    )

    it('resolves the org to its project', async () => {
        const teamService = new TeamService(postgres)
        expect(await teamService.getTeamByOrg(orgSlug)).toMatchObject({ teamId })
    })
})
