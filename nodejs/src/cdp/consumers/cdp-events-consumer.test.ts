import { mockProducerObserver } from '../../../tests/helpers/mocks/producer.mock'

import { InsightsFlow } from '~/schema/insightsflow'

import { createOrganization, createTeam, getFirstTeam, getTeam, resetTestDatabase } from '../../../tests/helpers/sql'
import { Hub, Team } from '../../types'
import { closeHub, createHub } from '../../utils/db/hub'
import { FixtureInsightsFlowBuilder } from '../_tests/builders/insightsflow.builder'
import { FN_EXAMPLES, FN_FILTERS_EXAMPLES, FN_INPUTS_EXAMPLES } from '../_tests/examples'
import {
    insertInsightsFunction as _insertInsightsFunction,
    createScriptExecutionGlobals,
    createIncomingEvent,
    createInternalEvent,
    createKafkaMessage,
} from '../_tests/fixtures'
import { insertInsightsFlow as _insertInsightsFlow } from '../_tests/fixtures-insightsflows'
import { CyclotronJobQueue } from '../services/job-queue/job-queue'
import { ScriptWatcherState } from '../services/monitoring/script-watcher.service'
import { InsightsFunctionInvocationGlobals, InsightsFunctionType } from '../types'
import { CdpEventsConsumer } from './cdp-events.consumer'
import { CdpInternalEventsConsumer } from './cdp-internal-event.consumer'

jest.setTimeout(1000)

/**
 * NOTE: The internal and normal events consumers are very similar so we can test them together
 */
describe.each([
    [CdpEventsConsumer.name, CdpEventsConsumer, 'destination' as const],
    [CdpInternalEventsConsumer.name, CdpInternalEventsConsumer, 'internal_destination' as const],
])('%s', (_name, Consumer, scriptType) => {
    let processor: CdpEventsConsumer | CdpInternalEventsConsumer
    let hub: Hub
    let team: Team
    let team2: Team
    let mockQueueInvocations: jest.Mock

    const insertInsightsFunction = async (insightsFunction: Partial<InsightsFunctionType>) => {
        const teamId = insightsFunction.team_id ?? team.id
        const item = await _insertInsightsFunction(hub.postgres, teamId, {
            ...insightsFunction,
            type: scriptType,
        })
        // Trigger the reload that django would do
        processor['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [item.id])
        return item
    }

    beforeEach(async () => {
        await resetTestDatabase()
        hub = await createHub()
        team = await getFirstTeam(hub) // This team has data_pipelines feature by default (legacy addon)

        // Create second organization without data_pipelines for testing quota limiting
        const otherOrganizationId = await createOrganization(hub.postgres)
        const team2Id = await createTeam(hub.postgres, otherOrganizationId)
        team2 = (await getTeam(hub, team2Id))! // This team does NOT have data_pipelines

        // Set up default quota limiting mock - not limited by default
        jest.spyOn(hub.quotaLimiting, 'isTeamQuotaLimited').mockResolvedValue(false)

        processor = new Consumer(hub)

        // NOTE: We don't want to actually connect to Kafka for these tests as it is slow and we are testing the core logic only
        processor['kafkaConsumer'] = {
            connect: jest.fn(),
            disconnect: jest.fn(),
            isHealthy: jest.fn(),
        } as any

        processor['cyclotronJobQueue'] = {
            queueInvocations: jest.fn(),
            startAsProducer: jest.fn(() => Promise.resolve()),
            stop: jest.fn(),
        } as unknown as jest.Mocked<CyclotronJobQueue>

        mockQueueInvocations = jest.mocked(processor['cyclotronJobQueue']['queueInvocations'])

        await processor.start()
    })

    afterEach(async () => {
        jest.setTimeout(10000)
        await processor.stop()
        await closeHub(hub)
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    describe('team filtering', () => {
        it('should not parse events for teams without custom functions', async () => {
            await insertInsightsFunction({
                team_id: team.id,
                ...FN_EXAMPLES.simple_fetch,
                ...FN_INPUTS_EXAMPLES.simple_fetch,
                ...FN_FILTERS_EXAMPLES.no_filters,
            })

            const events =
                processor instanceof CdpInternalEventsConsumer
                    ? [
                          createKafkaMessage(createInternalEvent(team.id, {})),
                          createKafkaMessage(createInternalEvent(team2.id, {})),
                      ]
                    : [
                          createKafkaMessage(createIncomingEvent(team.id, {})),
                          createKafkaMessage(createIncomingEvent(team2.id, {})),
                      ]
            const invocations = await processor._parseKafkaBatch(events)
            expect(invocations).toHaveLength(1)
            expect(invocations[0].project.id).toBe(team.id)

            await insertInsightsFunction({
                team_id: team2.id,
                ...FN_EXAMPLES.simple_fetch,
                ...FN_INPUTS_EXAMPLES.simple_fetch,
                ...FN_FILTERS_EXAMPLES.no_filters,
            })

            const invocations2 = await processor._parseKafkaBatch(events)
            expect(invocations2).toHaveLength(2)
        })
    })

    describe('general event processing', () => {
        describe('common processing', () => {
            let fnFetchNoFilters: InsightsFunctionType
            let fnPrinterPageviewFilters: InsightsFunctionType
            let globals: InsightsFunctionInvocationGlobals

            beforeEach(async () => {
                fnFetchNoFilters = await insertInsightsFunction({
                    ...FN_EXAMPLES.simple_fetch,
                    ...FN_INPUTS_EXAMPLES.simple_fetch,
                    ...FN_FILTERS_EXAMPLES.no_filters,
                })

                fnPrinterPageviewFilters = await insertInsightsFunction({
                    ...FN_EXAMPLES.input_printer,
                    ...FN_INPUTS_EXAMPLES.secret_inputs,
                    ...FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                })

                globals = createScriptExecutionGlobals({
                    project: {
                        id: team.id,
                    } as any,
                    event: {
                        uuid: 'b3a1fe86-b10c-43cc-acaf-d208977608d0',
                        event: '$pageview',
                        properties: {
                            $current_url: 'https://hanzo.ai',
                            $lib_version: '1.0.0',
                        },
                    } as any,
                })
            })

            const matchInvocation = (insightsFunction: InsightsFunctionType, globals: InsightsFunctionInvocationGlobals) => {
                return {
                    insightsFunction: {
                        id: insightsFunction.id,
                    },
                    state: {
                        globals: {
                            event: globals.event,
                        },
                    },
                }
            }

            it('should process events', async () => {
                const { invocations } = await processor.processBatch([globals])

                expect(invocations).toHaveLength(2)
                expect(invocations).toMatchObject([
                    matchInvocation(fnFetchNoFilters, globals),
                    matchInvocation(fnPrinterPageviewFilters, globals),
                ])

                // Verify Cyclotron jobs
                expect(mockQueueInvocations).toHaveBeenCalledWith(invocations)
            })

            it('should log correct metrics', async () => {
                const { invocations } = await processor.processBatch([globals])

                expect(invocations).toHaveLength(2)
                expect(invocations).toMatchObject([
                    matchInvocation(fnFetchNoFilters, globals),
                    matchInvocation(fnPrinterPageviewFilters, globals),
                ])

                expect(mockQueueInvocations).toHaveBeenCalledWith(invocations)

                const metrics = mockProducerObserver.getProducedKafkaMessagesForTopic('datastore_app_metrics2_test')

                // Check triggered metrics (one per destination)
                const triggeredMetrics = metrics.filter((m: any) => m.value.metric_name === 'triggered')
                expect(triggeredMetrics).toHaveLength(2)
                expect(triggeredMetrics).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            value: expect.objectContaining({
                                app_source: 'insights_function',
                                app_source_id: fnFetchNoFilters.id,
                                metric_name: 'triggered',
                            }),
                        }),
                        expect.objectContaining({
                            value: expect.objectContaining({
                                app_source: 'insights_function',
                                app_source_id: fnPrinterPageviewFilters.id,
                                metric_name: 'triggered',
                            }),
                        }),
                    ])
                )

                // Billing is per-event, not per-destination: 1 event → 2 destinations = 1 billable_invocation
                if (scriptType === 'destination') {
                    const billingMetrics = metrics.filter((m: any) => m.value.metric_name === 'billable_invocation')
                    expect(billingMetrics).toHaveLength(1)
                    expect(billingMetrics[0].value).toMatchObject({
                        app_source: 'insights_function',
                        app_source_id: '_event_trigger',
                        instance_id: globals.event.uuid,
                        metric_kind: 'billing',
                        metric_name: 'billable_invocation',
                        team_id: 2,
                    })
                }
            })

            it("should filter out functions that don't match the filter", async () => {
                globals.event.properties.$current_url = 'https://nomatch.com'

                const { invocations } = await processor.processBatch([globals])

                expect(invocations).toHaveLength(1)
                expect(invocations).toMatchObject([matchInvocation(fnFetchNoFilters, globals)])

                // Verify only one Cyclotron job is created (for fnFetchNoFilters)
                expect(mockQueueInvocations).toHaveBeenCalledWith(invocations)

                // Still verify the metric for the filtered function
                expect(
                    mockProducerObserver.getProducedKafkaMessagesForTopic('datastore_app_metrics2_test')
                ).toMatchObject([
                    {
                        key: expect.any(String),
                        topic: 'datastore_app_metrics2_test',
                        value: {
                            app_source: 'insights_function',
                            app_source_id: fnPrinterPageviewFilters.id,
                            count: 1,
                            metric_kind: 'other',
                            metric_name: 'filtered',
                            team_id: 2,
                            timestamp: expect.any(String),
                        },
                    },
                    {
                        key: expect.any(String),
                        topic: 'datastore_app_metrics2_test',
                        value: {
                            app_source: 'insights_function',
                            app_source_id: fnFetchNoFilters.id,
                            count: 1,
                            metric_kind: 'other',
                            metric_name: 'triggered',
                            team_id: 2,
                            timestamp: expect.any(String),
                        },
                    },
                    // Billing is per-event: 1 event → 1 destination = 1 billable_invocation
                    ...(scriptType !== 'destination'
                        ? []
                        : [
                              {
                                  key: expect.any(String),
                                  topic: 'datastore_app_metrics2_test',
                                  value: {
                                      app_source: 'insights_function',
                                      app_source_id: '_event_trigger',
                                      instance_id: globals.event.uuid,
                                      count: 1,
                                      metric_kind: 'billing',
                                      metric_name: 'billable_invocation',
                                      team_id: 2,
                                      timestamp: expect.any(String),
                                  },
                              },
                          ]),
                ])
            })

            it('should filter out functions that are disabled', async () => {
                await processor.scriptWatcher.forceStateChange(fnFetchNoFilters, ScriptWatcherState.disabled)
                await processor.scriptWatcher.forceStateChange(fnPrinterPageviewFilters, ScriptWatcherState.disabled)

                const { invocations } = await processor.processBatch([globals])

                expect(invocations).toHaveLength(0)
                expect(mockProducerObserver.produceSpy).toHaveBeenCalledTimes(2)

                expect(mockProducerObserver.getProducedKafkaMessages()).toMatchObject([
                    {
                        topic: 'datastore_app_metrics2_test',
                        value: {
                            app_source: 'insights_function',
                            app_source_id: fnFetchNoFilters.id,
                            count: 1,
                            metric_kind: 'failure',
                            metric_name: 'disabled_permanently',
                            team_id: 2,
                        },
                    },
                    {
                        topic: 'datastore_app_metrics2_test',
                        value: {
                            app_source: 'insights_function',
                            app_source_id: fnPrinterPageviewFilters.id,
                            count: 1,
                            metric_kind: 'failure',
                            metric_name: 'disabled_permanently',
                            team_id: 2,
                        },
                    },
                ])
            })

            if (scriptType === 'destination') {
                it('should bill once per event, not per destination (multiple events)', async () => {
                    // Create a second event with different UUID
                    const globals2 = createScriptExecutionGlobals({
                        project: {
                            id: team.id,
                        } as any,
                        event: {
                            uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                            event: '$pageview',
                            properties: {
                                $current_url: 'https://hanzo.ai',
                                $lib_version: '1.0.0',
                            },
                        } as any,
                    })

                    // Process both events - each should trigger both destinations
                    const { invocations } = await processor.processBatch([globals, globals2])

                    // 2 events × 2 destinations = 4 invocations
                    expect(invocations).toHaveLength(4)

                    const billingMetrics = mockProducerObserver
                        .getProducedKafkaMessagesForTopic('datastore_app_metrics2_test')
                        .filter((m: any) => m.value.metric_name === 'billable_invocation')

                    // 2 events = 2 billable_invocations (not 4)
                    expect(billingMetrics).toHaveLength(2)

                    // Each billing metric should have app_source_id='_event_trigger' and unique event UUID
                    expect(billingMetrics).toEqual(
                        expect.arrayContaining([
                            expect.objectContaining({
                                value: expect.objectContaining({
                                    app_source_id: '_event_trigger',
                                    instance_id: globals.event.uuid,
                                    metric_name: 'billable_invocation',
                                }),
                            }),
                            expect.objectContaining({
                                value: expect.objectContaining({
                                    app_source_id: '_event_trigger',
                                    instance_id: globals2.event.uuid,
                                    metric_name: 'billable_invocation',
                                }),
                            }),
                        ])
                    )
                })
            }
        })

        describe('quota limiting', () => {
            let fnFetchNoFilters: InsightsFunctionType
            let fnPrinterPageviewFilters: InsightsFunctionType
            let globals: InsightsFunctionInvocationGlobals

            beforeEach(async () => {
                // Create functions for team2 (no data_pipelines feature)
                fnFetchNoFilters = await insertInsightsFunction({
                    team_id: team2.id,
                    ...FN_EXAMPLES.simple_fetch,
                    ...FN_INPUTS_EXAMPLES.simple_fetch,
                    ...FN_FILTERS_EXAMPLES.no_filters,
                })

                fnPrinterPageviewFilters = await insertInsightsFunction({
                    team_id: team2.id,
                    ...FN_EXAMPLES.input_printer,
                    ...FN_INPUTS_EXAMPLES.secret_inputs,
                    ...FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                })

                // Globals for team2 (without data_pipelines)
                globals = createScriptExecutionGlobals({
                    project: {
                        id: team2.id,
                    } as any,
                    event: {
                        uuid: 'b3a1fe86-b10c-43cc-acaf-d208977608d0',
                        event: '$pageview',
                        properties: {
                            $current_url: 'https://hanzo.ai',
                            $lib_version: '1.0.0',
                        },
                    } as any,
                })
            })

            it('should filter out functions when team is quota limited', async () => {
                // Mock quota limiting to return true for team2 (which doesn't have data_pipelines)
                jest.mocked(hub.quotaLimiting.isTeamQuotaLimited).mockClear()
                jest.mocked(hub.quotaLimiting.isTeamQuotaLimited).mockResolvedValue(true)

                const { invocations } = await processor.processBatch([globals])

                expect(hub.quotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(team2.id, 'cdp_trigger_events')

                // Now check invocations length - should be 0 because team2 is quota limited and has no legacy addon
                expect(invocations).toHaveLength(0)

                // Check that quota_limited metrics were produced
                const metrics = mockProducerObserver.getProducedKafkaMessagesForTopic('datastore_app_metrics2_test')
                expect(metrics).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            topic: 'datastore_app_metrics2_test',
                            value: expect.objectContaining({
                                app_source: 'insights_function',
                                app_source_id: fnFetchNoFilters.id,
                                count: 1,
                                metric_kind: 'failure',
                                metric_name: 'quota_limited',
                                team_id: team2.id,
                            }),
                        }),
                        expect.objectContaining({
                            topic: 'datastore_app_metrics2_test',
                            value: expect.objectContaining({
                                app_source: 'insights_function',
                                app_source_id: fnPrinterPageviewFilters.id,
                                count: 1,
                                metric_kind: 'failure',
                                metric_name: 'quota_limited',
                                team_id: team2.id,
                            }),
                        }),
                    ])
                )
            })

            it('should not filter out functions when team is not quota limited', async () => {
                // Mock quota limiting to return false for team2
                jest.mocked(hub.quotaLimiting.isTeamQuotaLimited).mockClear()
                jest.mocked(hub.quotaLimiting.isTeamQuotaLimited).mockResolvedValue(false)

                const { invocations } = await processor.processBatch([globals])

                expect(invocations).toHaveLength(2)
                expect(hub.quotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(team2.id, 'cdp_trigger_events')

                // Check that triggered metrics were produced instead
                const metrics = mockProducerObserver.getProducedKafkaMessagesForTopic('datastore_app_metrics2_test')
                expect(metrics).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            topic: 'datastore_app_metrics2_test',
                            value: expect.objectContaining({
                                app_source: 'insights_function',
                                app_source_id: fnFetchNoFilters.id,
                                count: 1,
                                metric_kind: 'other',
                                metric_name: 'triggered',
                                team_id: team2.id,
                            }),
                        }),
                        expect.objectContaining({
                            topic: 'datastore_app_metrics2_test',
                            value: expect.objectContaining({
                                app_source: 'insights_function',
                                app_source_id: fnPrinterPageviewFilters.id,
                                count: 1,
                                metric_kind: 'other',
                                metric_name: 'triggered',
                                team_id: team2.id,
                            }),
                        }),
                    ])
                )
            })
        })

        describe('filtering errors', () => {
            let globals: InsightsFunctionInvocationGlobals

            beforeEach(() => {
                globals = createScriptExecutionGlobals({
                    project: {
                        id: team.id,
                    } as any,
                    event: {
                        uuid: 'b3a1fe86-b10c-43cc-acaf-d208977608d0',
                        event: '$pageview',
                        properties: {
                            $current_url: 'https://hanzo.ai',
                            $lib_version: '1.0.0',
                        },
                    } as any,
                })
            })

            it('should filter out functions that error while filtering', async () => {
                const erroringFunction = await insertInsightsFunction({
                    ...FN_EXAMPLES.input_printer,
                    ...FN_INPUTS_EXAMPLES.secret_inputs,
                    ...FN_FILTERS_EXAMPLES.broken_filters,
                })
                await processor.processBatch([globals])
                expect(mockProducerObserver.getProducedKafkaMessages()).toMatchObject([
                    {
                        key: expect.any(String),
                        topic: 'datastore_app_metrics2_test',
                        value: {
                            app_source: 'insights_function',
                            app_source_id: erroringFunction.id,
                            count: 1,
                            metric_kind: 'other',
                            metric_name: 'filtering_failed',
                            team_id: 2,
                            timestamp: expect.any(String),
                        },
                    },
                    {
                        topic: 'log_entries_test',
                        value: {
                            message:
                                'Error filtering event b3a1fe86-b10c-43cc-acaf-d208977608d0: Invalid InsightsQL bytecode, stack is empty, can not pop',
                        },
                    },
                ])
            })
        })
    })
})

describe('custom flow processing', () => {
    let processor: CdpEventsConsumer | CdpInternalEventsConsumer
    let hub: Hub
    let team: Team

    const insertInsightsFlow = async (insightsFlow: InsightsFlow) => {
        const teamId = insightsFlow.team_id ?? team.id

        const item = await _insertInsightsFlow(hub.postgres, insightsFlow)
        // Trigger the reload that django would do
        processor['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [item.id])
        return item
    }

    beforeEach(async () => {
        await resetTestDatabase()
        hub = await createHub()
        team = await getFirstTeam(hub)
        processor = new CdpEventsConsumer(hub)

        // NOTE: We don't want to actually connect to Kafka for these tests as it is slow and we are testing the core logic only
        processor['kafkaConsumer'] = {
            connect: jest.fn(),
            disconnect: jest.fn(),
            isHealthy: jest.fn(),
        } as any

        processor['cyclotronJobQueue'] = {
            queueInvocations: jest.fn(),
            startAsProducer: jest.fn(() => Promise.resolve()),
            stop: jest.fn(),
        } as unknown as jest.Mocked<CyclotronJobQueue>

        await processor.start()
    })

    afterEach(async () => {
        jest.setTimeout(10000)
        await processor.stop()
        await closeHub(hub)
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    describe('createInsightsFlowInvocations', () => {
        let globals: InsightsFunctionInvocationGlobals

        beforeEach(() => {
            globals = createScriptExecutionGlobals({
                project: {
                    id: team.id,
                } as any,
                event: {
                    uuid: 'b3a1fe86-b10c-43cc-acaf-d208977608d0',
                    event: '$pageview',
                    properties: {
                        $current_url: 'https://hanzo.ai',
                        $lib_version: '1.0.0',
                    },
                } as any,
            })
        })

        it('should not create custom flow invocations with no filters', async () => {
            const insightsFlow = new FixtureInsightsFlowBuilder().withTeamId(team.id).build()
            insightsFlow.trigger = {} as any
            await insertInsightsFlow(insightsFlow)

            const invocations = await processor['createInsightsFlowInvocations']([globals])
            expect(invocations).toHaveLength(0)
        })

        it('should not create custom flow invocations with webhook triggers', async () => {
            const insightsFlow = new FixtureInsightsFlowBuilder()
                .withTeamId(team.id)
                .withSimpleWorkflow({
                    trigger: {
                        type: 'webhook',
                        template_id: 'test',
                        inputs: {},
                    },
                })
                .build()
            await insertInsightsFlow(insightsFlow)

            const invocations = await processor['createInsightsFlowInvocations']([globals])
            expect(invocations).toHaveLength(0)
        })

        it('should create custom flow invocations with matching filters', async () => {
            const insightsFlow = await insertInsightsFlow(
                new FixtureInsightsFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'event',
                            filters: FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter.filters ?? {},
                        },
                    })
                    .build()
            )

            const noInvocations = await processor['createInsightsFlowInvocations']([
                {
                    ...globals,
                    event: {
                        ...globals.event,
                        event: 'not-a-pageview',
                    },
                },
            ])

            expect(noInvocations).toHaveLength(0)

            const invocations = await processor['createInsightsFlowInvocations']([globals])
            expect(invocations).toHaveLength(1)
            expect(invocations[0]).toMatchObject({
                functionId: insightsFlow.id,
                insightsFlow: {
                    id: insightsFlow.id,
                },
                id: expect.any(String),
                queue: 'customflow',
                queuePriority: 1,
                state: {
                    event: globals.event,
                    actionStepCount: 0,
                },
                teamId: 2,
            })
        })

        it('should not produce billable_invocation metrics for custom flow invocations', async () => {
            await insertInsightsFlow(
                new FixtureInsightsFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'event',
                            filters: FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter.filters ?? {},
                        },
                    })
                    .build()
            )

            await processor['createInsightsFlowInvocations']([globals])

            const producedMetrics =
                mockProducerObserver.getProducedKafkaMessagesForTopic('datastore_app_metrics2_test')
            expect(producedMetrics).not.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        value: expect.objectContaining({
                            metric_name: 'billable_invocation',
                        }),
                    }),
                ])
            )
        })
    })

    describe('quota limiting for custom flows', () => {
        let globals: InsightsFunctionInvocationGlobals

        beforeEach(() => {
            globals = createScriptExecutionGlobals({
                project: {
                    id: team.id,
                } as any,
                event: {
                    uuid: 'b3a1fe86-b10c-43cc-acaf-d208977608d0',
                    event: '$pageview',
                    properties: {
                        $current_url: 'https://hanzo.ai',
                        $lib_version: '1.0.0',
                    },
                } as any,
            })
        })

        it('should not process workflows with email actions when team has email quota limit', async () => {
            // Mock quota limiting for email
            ;(processor as any).hub.quotaLimiting.isTeamQuotaLimited = jest
                .fn()
                .mockImplementation((_teamId, resource) => {
                    return resource === 'workflow_emails'
                })

            const insightsFlow = await insertInsightsFlow(
                new FixtureInsightsFlowBuilder()
                    .withTeamId(team.id)
                    .withWorkflow({
                        actions: {
                            trigger: {
                                type: 'trigger',
                                config: {
                                    type: 'event',
                                    filters: FN_FILTERS_EXAMPLES.no_filters.filters ?? {},
                                },
                            },
                            sendEmail: {
                                type: 'function_email',
                                config: {} as any,
                            },
                            sendWebhook: {
                                type: 'function',
                                config: {} as any,
                            },
                            exit: {
                                type: 'exit',
                                config: {},
                            },
                        },
                        edges: [
                            { from: 'trigger', to: 'sendEmail', type: 'continue' },
                            { from: 'sendEmail', to: 'sendWebhook', type: 'continue' },
                            { from: 'sendWebhook', to: 'exit', type: 'continue' },
                        ],
                    })
                    .build()
            )

            const invocations = await processor['createInsightsFlowInvocations']([globals])

            // Should have no invocations returned due to quota limiting
            expect(invocations).toHaveLength(0)

            // Should have checked quota limits
            expect((processor as any).hub.quotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(
                team.id,
                'workflow_emails'
            )
            expect((processor as any).hub.quotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(
                team.id,
                'workflow_destinations_dispatched'
            )

            // Flush metrics so we can assert them down below
            await processor['insightsFunctionMonitoringService'].flush()

            // Should have queued a quota limited metric
            const producedMetrics =
                mockProducerObserver.getProducedKafkaMessagesForTopic('datastore_app_metrics2_test')
            expect(producedMetrics).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        value: expect.objectContaining({
                            app_source: 'insights_flow',
                            app_source_id: insightsFlow.id,
                            metric_kind: 'failure',
                            metric_name: 'quota_limited',
                        }),
                    }),
                ])
            )
        })

        it('should not process workflows with destination actions when team has destination quota limit', async () => {
            // Mock quota limiting for destinations
            ;(processor as any).hub.quotaLimiting.isTeamQuotaLimited = jest
                .fn()
                .mockImplementation((_teamId, resource) => {
                    return resource === 'workflow_destinations_dispatched'
                })

            await insertInsightsFlow(
                new FixtureInsightsFlowBuilder()
                    .withTeamId(team.id)
                    .withWorkflow({
                        actions: {
                            trigger: {
                                type: 'trigger',
                                config: {
                                    type: 'event',
                                    filters: FN_FILTERS_EXAMPLES.no_filters.filters ?? {},
                                },
                            },
                            delay: {
                                type: 'delay',
                                config: {} as any,
                            },
                            sendWebhook: {
                                type: 'function',
                                config: {} as any,
                            },
                            exit: {
                                type: 'exit',
                                config: {},
                            },
                        },
                        edges: [
                            { from: 'trigger', to: 'delay', type: 'continue' },
                            { from: 'delay', to: 'sendWebhook', type: 'continue' },
                            { from: 'sendWebhook', to: 'exit', type: 'continue' },
                        ],
                    })
                    .build()
            )

            const invocations = await processor['createInsightsFlowInvocations']([globals])

            expect(invocations).toHaveLength(0)
            expect((processor as any).hub.quotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(
                team.id,
                'workflow_destinations_dispatched'
            )
        })

        it('should process workflows without limited action types even when quotas exist', async () => {
            // Mock quota limiting for both
            ;(processor as any).hub.quotaLimiting.isTeamQuotaLimited = jest.fn().mockResolvedValue(true)

            const insightsFlow = await insertInsightsFlow(
                new FixtureInsightsFlowBuilder()
                    .withTeamId(team.id)
                    .withWorkflow({
                        actions: {
                            trigger: {
                                type: 'trigger',
                                config: {
                                    type: 'event',
                                    filters: FN_FILTERS_EXAMPLES.no_filters.filters ?? {},
                                },
                            },
                            delay: {
                                type: 'delay',
                                config: {} as any,
                            },
                            branch: {
                                type: 'conditional_branch',
                                config: {} as any,
                            },
                            exit: {
                                type: 'exit',
                                config: {},
                            },
                        },
                        edges: [
                            { from: 'trigger', to: 'delay', type: 'continue' },
                            { from: 'delay', to: 'branch', type: 'continue' },
                            { from: 'branch', to: 'exit', type: 'continue' },
                        ],
                    })
                    .build()
            )

            const invocations = await processor['createInsightsFlowInvocations']([globals])

            // Should process the workflow since it doesn't have email or destination actions
            expect(invocations).toHaveLength(1)
            expect(invocations[0]).toMatchObject({
                functionId: insightsFlow.id,
                insightsFlow: {
                    id: insightsFlow.id,
                },
            })
        })

        it('should process workflows when team has no quota limits', async () => {
            // No quota limits
            ;(processor as any).hub.quotaLimiting.isTeamQuotaLimited = jest.fn().mockResolvedValue(false)

            const insightsFlow = await insertInsightsFlow(
                new FixtureInsightsFlowBuilder()
                    .withTeamId(team.id)
                    .withWorkflow({
                        actions: {
                            trigger: {
                                type: 'trigger',
                                config: {
                                    type: 'event',
                                    filters: FN_FILTERS_EXAMPLES.no_filters.filters ?? {},
                                },
                            },
                            sendEmail: {
                                type: 'function_email',
                                config: {} as any,
                            },
                            sendWebhook: {
                                type: 'function',
                                config: {} as any,
                            },
                            exit: {
                                type: 'exit',
                                config: {},
                            },
                        },
                        edges: [
                            { from: 'trigger', to: 'sendEmail', type: 'continue' },
                            { from: 'sendEmail', to: 'sendWebhook', type: 'continue' },
                            { from: 'sendWebhook', to: 'exit', type: 'continue' },
                        ],
                    })
                    .build()
            )

            const invocations = await processor['createInsightsFlowInvocations']([globals])

            expect(invocations).toHaveLength(1)
            expect(invocations[0]).toMatchObject({
                functionId: insightsFlow.id,
                insightsFlow: {
                    id: insightsFlow.id,
                },
            })
        })
    })
})
