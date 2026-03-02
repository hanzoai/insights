import { DateTime } from 'luxon'

import { CustomFlow } from '~/schema/customflow'
import { createTeam, getFirstTeam, getTeam, resetTestDatabase } from '~/tests/helpers/sql'
import { PostgresUse } from '~/utils/db/postgres'
import { UUIDT } from '~/utils/utils'
import { PostgresPersonRepository } from '~/worker/ingestion/persons/repositories/postgres-person-repository'

import { Hub, InternalPerson, Team } from '../../types'
import { closeHub, createHub } from '../../utils/db/hub'
import { FixtureCustomFlowBuilder } from '../_tests/builders/customflow.builder'
import { createCustomFlowInvocationContext, insertCustomFlow } from '../_tests/fixtures-customflows'
import {
    CyclotronJobInvocation,
    CyclotronJobInvocationCustomFlow,
    CyclotronJobInvocationResult,
    CustomFlowInvocationContext,
} from '../types'
import { CdpCyclotronWorkerCustomFlow } from './cdp-cyclotron-worker-customflow.consumer'

jest.setTimeout(1000)

describe('CdpCyclotronWorkerCustomFlow', () => {
    let processor: CdpCyclotronWorkerCustomFlow
    let hub: Hub
    let personRepository: PostgresPersonRepository
    let team: Team
    let team2: Team
    let customFlows: CustomFlow[]

    const createSerializedCustomFlowInvocation = (
        customFlow: CustomFlow,
        _context: Partial<CustomFlowInvocationContext> = {}
    ): CyclotronJobInvocation => {
        // Add the source of the trigger to the globals

        const context = createCustomFlowInvocationContext(_context)

        return {
            id: new UUIDT().toString(),
            state: {
                ...context,
            },
            teamId: customFlow.team_id,
            functionId: customFlow.id,
            queue: 'customflow',
            queuePriority: 0,
        }
    }

    const createPerson = async (
        teamId: number,
        uuid: string,
        distinctId: string,
        properties: any
    ): Promise<InternalPerson> => {
        const TIMESTAMP = DateTime.fromISO('2000-10-14T11:42:06.502Z').toUTC()
        const result = await personRepository.createPerson(TIMESTAMP, properties, {}, {}, teamId, null, true, uuid, {
            distinctId,
        })
        if (!result.success) {
            throw new Error('Failed to create person')
        }
        return result.person
    }

    beforeEach(async () => {
        await resetTestDatabase()
        hub = await createHub()
        personRepository = new PostgresPersonRepository(hub.postgres)
        team = await getFirstTeam(hub)
        const team2Id = await createTeam(hub.postgres, team.organization_id)
        team2 = (await getTeam(hub, team2Id))!

        processor = new CdpCyclotronWorkerCustomFlow(hub)

        customFlows = []
        customFlows.push(
            await insertCustomFlow(
                hub.postgres,
                new FixtureCustomFlowBuilder()
                    .withName('Test Custom Flow team 2')
                    .withTeamId(team.id)
                    .withStatus('active')
                    .withSimpleWorkflow()
                    .build()
            )
        )

        customFlows.push(
            await insertCustomFlow(
                hub.postgres,
                new FixtureCustomFlowBuilder()
                    .withName('Test Custom Flow team 2')
                    .withTeamId(team2.id)
                    .withStatus('active')
                    .withSimpleWorkflow()
                    .build()
            )
        )
    })

    afterEach(async () => {
        jest.setTimeout(10000)
        await closeHub(hub)
    })

    describe('loadCustomFlows', () => {
        let invocations: CyclotronJobInvocation[]

        beforeEach(async () => {
            await createPerson(team.id, 'dd3d6f80-60ad-45c3-bd61-e2300f2ba7e1', 'distinct_A_1', {
                name: 'Person A 1',
            })
            await createPerson(team.id, 'dd3d6f80-60ad-45c3-bd61-e2300f2ba7e2', 'distinct_A_2', {
                name: 'Person A 2',
            })
            await createPerson(team2.id, 'dd3d6f80-60ad-45c3-bd61-e2300f2ba7e3', 'distinct_A_1', {
                name: 'Person A 3',
            })

            const invocation1 = createSerializedCustomFlowInvocation(customFlows[0], {
                event: {
                    distinct_id: 'distinct_A_1',
                    properties: {
                        foo: 'bar1',
                    },
                } as any,
            })
            const invocation2 = createSerializedCustomFlowInvocation(customFlows[0], {
                event: {
                    distinct_id: 'distinct_A_2',
                    properties: {
                        foo: 'bar2',
                    },
                } as any,
            })
            const invocation3 = createSerializedCustomFlowInvocation(customFlows[1], {
                event: {
                    distinct_id: 'distinct_A_1', // Same distinct_id but different custom flow
                    properties: {
                        foo: 'bar3',
                    },
                } as any,
            })
            const invocation4 = createSerializedCustomFlowInvocation(customFlows[1], {
                event: {
                    distinct_id: 'missing_person', // Missing person
                    properties: {
                        foo: 'bar4',
                    },
                } as any,
            })

            invocations = [invocation1, invocation2, invocation3, invocation4]
        })

        it('should load custom flows and their persons and globals', async () => {
            const results = (await processor.processInvocations(
                invocations
            )) as CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>[]

            const toMinimalCompare = (
                result: CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>
            ): Record<string, unknown> => {
                return {
                    customFlowName: result.invocation.customFlow.name,
                    filterGlobals: result.invocation.filterGlobals
                        ? {
                              eventProperties: result.invocation.filterGlobals.properties,
                              person: result.invocation.filterGlobals.person,
                          }
                        : null,
                    personName: result.invocation.person?.properties?.name,
                }
            }

            // Check all custom functions were loaded
            expect(results.map(toMinimalCompare)).toMatchInlineSnapshot(`
                [
                  {
                    "filterGlobals": {
                      "eventProperties": {
                        "foo": "bar1",
                      },
                      "person": {
                        "id": "dd3d6f80-60ad-45c3-bd61-e2300f2ba7e1",
                        "properties": {
                          "name": "Person A 1",
                        },
                      },
                    },
                    "customFlowName": "Test Custom Flow team 2",
                    "personName": "Person A 1",
                  },
                  {
                    "filterGlobals": {
                      "eventProperties": {
                        "foo": "bar2",
                      },
                      "person": {
                        "id": "dd3d6f80-60ad-45c3-bd61-e2300f2ba7e2",
                        "properties": {
                          "name": "Person A 2",
                        },
                      },
                    },
                    "customFlowName": "Test Custom Flow team 2",
                    "personName": "Person A 2",
                  },
                  {
                    "filterGlobals": {
                      "eventProperties": {
                        "foo": "bar3",
                      },
                      "person": {
                        "id": "dd3d6f80-60ad-45c3-bd61-e2300f2ba7e3",
                        "properties": {
                          "name": "Person A 3",
                        },
                      },
                    },
                    "customFlowName": "Test Custom Flow team 2",
                    "personName": "Person A 3",
                  },
                  {
                    "filterGlobals": {
                      "eventProperties": {
                        "foo": "bar4",
                      },
                      "person": null,
                    },
                    "customFlowName": "Test Custom Flow team 2",
                    "personName": undefined,
                  },
                ]
            `)
        })

        it('should make minimal calls to the person manager', async () => {
            const personManagerSpy = jest.spyOn(processor['personsManager'] as any, 'fetchPersons')
            await processor.processInvocations(invocations)
            expect(personManagerSpy).toHaveBeenCalledTimes(1)
            expect(personManagerSpy.mock.calls[0][0]).toEqual([
                `${team.id}:distinct_A_1`,
                `${team.id}:distinct_A_2`,
                `${team2.id}:distinct_A_1`,
                `${team2.id}:missing_person`,
            ])
        })

        it('should skip invocations when workflow is disabled after being queued', async () => {
            // Scenario: workflow is active, invocations are queued, then workflow is disabled
            // Remaining invocations should be skipped

            const customFlow = customFlows[0]

            await createPerson(team.id, 'dd3d6f80-60ad-45c3-bd61-e2300f2ba7e4', 'distinct_person_1', {
                name: 'Person 1',
            })
            await createPerson(team.id, 'dd3d6f80-60ad-45c3-bd61-e2300f2ba7e5', 'distinct_person_2', {
                name: 'Person 2',
            })

            const invocation1 = createSerializedCustomFlowInvocation(customFlow, {
                event: {
                    distinct_id: 'distinct_person_1',
                    properties: { foo: 'bar1' },
                } as any,
            })

            const invocation2 = createSerializedCustomFlowInvocation(customFlow, {
                event: {
                    distinct_id: 'distinct_person_2',
                    properties: { foo: 'bar2' },
                } as any,
            })

            // First batch: process invocation1 while workflow is active
            const results1 = (await processor.processInvocations([
                invocation1,
            ])) as CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>[]

            expect(results1).toHaveLength(1)
            expect(results1[0].invocation.filterGlobals?.properties?.foo).toBe('bar1')

            // Now disable the workflow (simulate user archiving it)
            await hub.postgres.query(
                PostgresUse.COMMON_WRITE,
                `UPDATE posthog_customflow SET status = 'archived' WHERE id = $1`,
                [customFlow.id],
                'disableCustomFlow'
            )

            // Mark the customflow for refresh so it fetches fresh data
            ;(processor['customFlowManager'] as any)['lazyLoader'].markForRefresh(customFlow.id)

            // Mock cancelInvocations to track what gets skipped
            const cancelInvocationsSpy = jest.spyOn(processor['cyclotronJobQueue'], 'cancelInvocations')

            // Second batch: invocation2 should be skipped because workflow is now disabled
            const results2 = (await processor.processInvocations([
                invocation2,
            ])) as CyclotronJobInvocationResult<CyclotronJobInvocationCustomFlow>[]

            // No results because the workflow is disabled
            expect(results2).toHaveLength(0)

            // The invocation should have been canceled (not failed)
            expect(cancelInvocationsSpy).toHaveBeenCalledWith([invocation2])
        })
    })
})
