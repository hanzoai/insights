import '~/tests/helpers/mocks/date.mock'

import { FixtureInsightsFlowBuilder } from '~/cdp/_tests/builders/insightsflow.builder'
import { InsightsFlow } from '~/schema/insightsflow'
import { forSnapshot } from '~/tests/helpers/snapshots'
import { createTeam, getTeam, resetTestDatabase } from '~/tests/helpers/sql'
import { Hub } from '~/types'
import { closeHub, createHub } from '~/utils/db/hub'
import { PostgresUse } from '~/utils/db/postgres'

import { insertInsightsFlow } from '../../_tests/fixtures-insightsflows'
import { InsightsFlowManagerService } from './insightsflow-manager.service'

describe('InsightsFlowManager', () => {
    jest.setTimeout(2000)
    let hub: Hub
    let manager: InsightsFlowManagerService

    let insightsFlows: InsightsFlow[]

    let teamId1: number
    let teamId2: number

    beforeEach(async () => {
        hub = await createHub()
        await resetTestDatabase()
        manager = new InsightsFlowManagerService(hub.postgres, hub.pubSub)

        const team = await getTeam(hub, 2)

        teamId1 = await createTeam(hub.postgres, team!.organization_id)
        teamId2 = await createTeam(hub.postgres, team!.organization_id)

        insightsFlows = []

        insightsFlows.push(
            await insertInsightsFlow(
                hub.postgres,
                new FixtureInsightsFlowBuilder()
                    .withName('Test Custom Flow team 1')
                    .withTeamId(teamId1)
                    .withStatus('active')
                    .build()
            )
        )

        insightsFlows.push(
            await insertInsightsFlow(
                hub.postgres,
                new FixtureInsightsFlowBuilder()
                    .withName('Test Custom Flow team 1 - other')
                    .withTeamId(teamId1)
                    .withStatus('active')
                    .build()
            )
        )

        insightsFlows.push(
            await insertInsightsFlow(
                hub.postgres,
                new FixtureInsightsFlowBuilder()
                    .withName('Test Custom Flow team 2')
                    .withTeamId(teamId2)
                    .withStatus('active')
                    .build()
            )
        )
    })

    afterEach(async () => {
        await closeHub(hub)
    })

    it('returns the custom flow', async () => {
        let items = await manager.getInsightsFlowsForTeam(teamId1)
        expect(items.map((item) => item.team_id)).toEqual([teamId1, teamId1])

        expect(
            forSnapshot(items, {
                overrides: {
                    team_id: 'TEAM_ID',
                    created_at: 'CREATED_AT',
                    updated_at: 'UPDATED_AT',
                },
            })
        ).toMatchSnapshot()

        await hub.postgres.query(
            PostgresUse.COMMON_WRITE,
            `UPDATE insights_flow SET name='Test Custom Flow team 1 updated', updated_at = NOW() WHERE id = $1`,
            [insightsFlows[0].id],
            'testKey'
        )

        // This is normally dispatched by django
        manager['onInsightsFlowsReloaded'](teamId1, [insightsFlows[0].id])

        items = await manager.getInsightsFlowsForTeam(teamId1)

        expect(items.find((item) => item.id === insightsFlows[0].id)).toMatchObject({
            id: insightsFlows[0].id,
            name: 'Test Custom Flow team 1 updated',
        })
    })

    describe('getInsightsFlowIdsForTeam', () => {
        it('returns function IDs', async () => {
            const result = await manager.getInsightsFlowIdsForTeams([teamId1, teamId2])

            expect(result[teamId1]).toHaveLength(2)
            expect(result[teamId1]).toContain(insightsFlows[0].id)
            expect(result[teamId1]).toContain(insightsFlows[1].id)

            expect(result[teamId2]).toHaveLength(1)
            expect(result[teamId2]).toContain(insightsFlows[2].id)
        })

        it('returns empty arrays for teams with no matching functions', async () => {
            const nonExistentTeamId = teamId2 + 1
            const result = await manager.getInsightsFlowIdsForTeams([nonExistentTeamId])
            expect(result[nonExistentTeamId]).toEqual([])
        })

        it('handles archived custom flows', async () => {
            const originalResult = await manager.getInsightsFlowIdsForTeams([teamId1, teamId2])
            expect(originalResult[teamId1]).toHaveLength(2)

            await hub.postgres.query(
                PostgresUse.COMMON_WRITE,
                `UPDATE insights_flow SET status='archived', updated_at = NOW() WHERE id = $1`,
                [insightsFlows[0].id],
                'testKey'
            )

            manager['onInsightsFlowsReloaded'](teamId1, [insightsFlows[0].id])

            const result = await manager.getInsightsFlowIdsForTeams([teamId1])
            expect(result[teamId1]).toHaveLength(1)
            expect(result[teamId1]).not.toContain(insightsFlows[0].id)
        })
    })
})
