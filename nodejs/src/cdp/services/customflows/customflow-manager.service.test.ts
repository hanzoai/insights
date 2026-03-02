import '~/tests/helpers/mocks/date.mock'

import { FixtureCustomFlowBuilder } from '~/cdp/_tests/builders/customflow.builder'
import { CustomFlow } from '~/schema/customflow'
import { forSnapshot } from '~/tests/helpers/snapshots'
import { createTeam, getTeam, resetTestDatabase } from '~/tests/helpers/sql'
import { Hub } from '~/types'
import { closeHub, createHub } from '~/utils/db/hub'
import { PostgresUse } from '~/utils/db/postgres'

import { insertCustomFlow } from '../../_tests/fixtures-customflows'
import { CustomFlowManagerService } from './customflow-manager.service'

describe('CustomFlowManager', () => {
    jest.setTimeout(2000)
    let hub: Hub
    let manager: CustomFlowManagerService

    let customFlows: CustomFlow[]

    let teamId1: number
    let teamId2: number

    beforeEach(async () => {
        hub = await createHub()
        await resetTestDatabase()
        manager = new CustomFlowManagerService(hub.postgres, hub.pubSub)

        const team = await getTeam(hub, 2)

        teamId1 = await createTeam(hub.postgres, team!.organization_id)
        teamId2 = await createTeam(hub.postgres, team!.organization_id)

        customFlows = []

        customFlows.push(
            await insertCustomFlow(
                hub.postgres,
                new FixtureCustomFlowBuilder()
                    .withName('Test Custom Flow team 1')
                    .withTeamId(teamId1)
                    .withStatus('active')
                    .build()
            )
        )

        customFlows.push(
            await insertCustomFlow(
                hub.postgres,
                new FixtureCustomFlowBuilder()
                    .withName('Test Custom Flow team 1 - other')
                    .withTeamId(teamId1)
                    .withStatus('active')
                    .build()
            )
        )

        customFlows.push(
            await insertCustomFlow(
                hub.postgres,
                new FixtureCustomFlowBuilder()
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
        let items = await manager.getCustomFlowsForTeam(teamId1)
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
            `UPDATE posthog_customflow SET name='Test Custom Flow team 1 updated', updated_at = NOW() WHERE id = $1`,
            [customFlows[0].id],
            'testKey'
        )

        // This is normally dispatched by django
        manager['onCustomFlowsReloaded'](teamId1, [customFlows[0].id])

        items = await manager.getCustomFlowsForTeam(teamId1)

        expect(items.find((item) => item.id === customFlows[0].id)).toMatchObject({
            id: customFlows[0].id,
            name: 'Test Custom Flow team 1 updated',
        })
    })

    describe('getCustomFlowIdsForTeam', () => {
        it('returns function IDs', async () => {
            const result = await manager.getCustomFlowIdsForTeams([teamId1, teamId2])

            expect(result[teamId1]).toHaveLength(2)
            expect(result[teamId1]).toContain(customFlows[0].id)
            expect(result[teamId1]).toContain(customFlows[1].id)

            expect(result[teamId2]).toHaveLength(1)
            expect(result[teamId2]).toContain(customFlows[2].id)
        })

        it('returns empty arrays for teams with no matching functions', async () => {
            const nonExistentTeamId = teamId2 + 1
            const result = await manager.getCustomFlowIdsForTeams([nonExistentTeamId])
            expect(result[nonExistentTeamId]).toEqual([])
        })

        it('handles archived custom flows', async () => {
            const originalResult = await manager.getCustomFlowIdsForTeams([teamId1, teamId2])
            expect(originalResult[teamId1]).toHaveLength(2)

            await hub.postgres.query(
                PostgresUse.COMMON_WRITE,
                `UPDATE posthog_customflow SET status='archived', updated_at = NOW() WHERE id = $1`,
                [customFlows[0].id],
                'testKey'
            )

            manager['onCustomFlowsReloaded'](teamId1, [customFlows[0].id])

            const result = await manager.getCustomFlowIdsForTeams([teamId1])
            expect(result[teamId1]).toHaveLength(1)
            expect(result[teamId1]).not.toContain(customFlows[0].id)
        })
    })
})
