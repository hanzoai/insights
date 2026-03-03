// sort-imports-ignore
import { DateTime } from 'luxon'

import { FixtureInsightsFlowBuilder, SimpleInsightsFlowRepresentation } from '~/cdp/_tests/builders/customflow.builder'
import { createScriptExecutionGlobals, insertInsightsFunctionTemplate, insertIntegration } from '~/cdp/_tests/fixtures'
import { compileFn } from '~/cdp/templates/compiler'
import { template as insightsCaptureTemplate } from '~/cdp/templates/_destinations/insights_capture/insights-capture.template'
import { InsightsFlow } from '~/schema/insightsflow'
import { getFirstTeam, resetTestDatabase } from '~/tests/helpers/sql'

import { fetch } from '~/utils/request'
import { logger } from '../../../utils/logger'
import { Hub } from '../../../types'
import { createHub } from '../../../utils/db/hub'
import { FN_FILTERS_EXAMPLES } from '../../_tests/examples'
import { createExampleInsightsFlowInvocation } from '../../_tests/fixtures-insightsflows'
import { ScriptExecutorService } from '../script-executor.service'
import { InsightsFunctionTemplateManagerService } from '../managers/insights-function-template-manager.service'
import { RecipientsManagerService } from '../managers/recipients-manager.service'
import { RecipientPreferencesService } from '../messaging/recipient-preferences.service'
import { InsightsFlowExecutorService, createInsightsFlowInvocation } from './insightsflow-executor.service'
import { InsightsFlowFunctionsService } from './insightsflow-functions.service'

// Mock before importing fetch
jest.mock('~/utils/request', () => {
    const original = jest.requireActual('~/utils/request')
    return {
        ...original,
        fetch: jest.fn().mockImplementation((url, options) => {
            return original.fetch(url, options)
        }),
    }
})

const cleanLogs = (logs: string[]): string[] => {
    // Replaces the function time with a fixed value to simplify testing
    return logs.map((log) => log.replace(/Function completed in \d+(\.\d+)?ms/, 'Function completed in REPLACEDms'))
}

describe('Customflow Executor', () => {
    let executor: InsightsFlowExecutorService
    let hub: Hub
    const mockFetch = jest.mocked(fetch)

    beforeEach(async () => {
        const fixedTime = DateTime.fromObject({ year: 2025, month: 1, day: 1 }, { zone: 'UTC' })
        jest.spyOn(Date, 'now').mockReturnValue(fixedTime.toMillis())

        mockFetch.mockImplementation((): any => {
            return {
                status: 200,
                text: () => Promise.resolve(JSON.stringify({ status: 200 })),
            }
        })

        await resetTestDatabase()
        hub = await createHub({
            SITE_URL: 'http://localhost:8000',
        })
        const scriptExecutor = new ScriptExecutorService(hub)
        const insightsFunctionTemplateManager = new InsightsFunctionTemplateManagerService(hub.postgres)
        const insightsFlowFunctionsService = new InsightsFlowFunctionsService(
            hub.SITE_URL,
            insightsFunctionTemplateManager,
            scriptExecutor
        )
        const recipientsManager = new RecipientsManagerService(hub.postgres)
        const recipientPreferencesService = new RecipientPreferencesService(recipientsManager)

        await insertInsightsFunctionTemplate(hub.postgres, {
            id: 'template-test-customflow-executor',
            name: 'Test Template',
            code: `
            print(f'Hello, {inputs.name}!')
            print('Fetch 1', fetch('https://hanzo.ai').status)`,
            inputs_schema: [
                {
                    key: 'name',
                    type: 'string',
                    required: true,
                },
            ],
        })

        await insertInsightsFunctionTemplate(hub.postgres, {
            id: 'template-test-customflow-executor-async',
            name: 'Test template multi fetch',
            code: `
            print(f'Hello, {inputs.name}!')
            print('Fetch 1', fetch('https://hanzo.ai').status)
            print('Fetch 2', fetch('https://hanzo.ai').status)
            print('Fetch 3', fetch('https://hanzo.ai').status)
            print('All fetches done!')`,
            inputs_schema: [
                {
                    key: 'name',
                    type: 'string',
                    required: true,
                },
            ],
        })

        await insertInsightsFunctionTemplate(hub.postgres, insightsCaptureTemplate)

        executor = new InsightsFlowExecutorService(insightsFlowFunctionsService, recipientPreferencesService)
    })

    describe('general event processing', () => {
        let insightsFlow: InsightsFlow

        beforeEach(async () => {
            insightsFlow = new FixtureInsightsFlowBuilder()
                .withWorkflow({
                    actions: {
                        trigger: {
                            type: 'trigger',
                            config: {
                                type: 'event',
                                filters: FN_FILTERS_EXAMPLES.no_filters.filters ?? {},
                            },
                        },

                        function_id_1: {
                            type: 'function',
                            config: {
                                template_id: 'template-test-customflow-executor',
                                inputs: {
                                    name: {
                                        value: `Mr {event?.properties?.name}`,
                                        bytecode: await compileFn(`return f'Mr {event?.properties?.name}'`),
                                    },
                                },
                            },
                        },

                        exit: {
                            type: 'exit',
                            config: {},
                        },
                    },
                    edges: [
                        {
                            from: 'trigger',
                            to: 'function_id_1',
                            type: 'continue',
                        },
                        {
                            from: 'function_id_1',
                            to: 'exit',
                            type: 'continue',
                        },
                    ],
                })
                .build()
        })

        it('can execute a simple customflow', async () => {
            const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                event: {
                    ...createScriptExecutionGlobals().event,
                    properties: {
                        name: 'John Doe',
                    },
                    timestamp: '2026-01-30T20:20:20.200Z',
                },
            })

            const result = await executor.execute(invocation)

            expect(result).toEqual({
                capturedInsightsEvents: [],
                invocation: {
                    state: {
                        actionStepCount: 1,
                        currentAction: {
                            id: 'exit',
                            startedAtTimestamp: expect.any(Number),
                        },
                        event: {
                            distinct_id: 'distinct_id',
                            elements_chain: '',
                            event: 'test',
                            properties: {
                                name: 'John Doe',
                            },
                            timestamp: expect.any(String),
                            url: 'http://localhost:8000/events/1',
                            uuid: 'uuid',
                        },
                    },
                    id: expect.any(String),
                    teamId: 1,
                    insightsFlow: invocation.insightsFlow,
                    person: {
                        id: 'person_id',
                        name: 'John Doe',
                        properties: {
                            name: 'John Doe',
                        },
                        url: '',
                    },
                    filterGlobals: expect.any(Object),
                    functionId: invocation.insightsFlow.id,
                    queue: 'customflow',
                    queueMetadata: undefined,
                    queueScheduledAt: undefined,
                    queueSource: undefined,
                    queueParameters: undefined,
                    queuePriority: 0,
                },
                finished: true,
                logs: [
                    {
                        level: 'debug',
                        message:
                            'Starting workflow execution at trigger for [Person:person_id|John Doe] on [Event:uuid|test|2026-01-30T20:20:20.200Z]',
                        timestamp: expect.any(DateTime),
                    },
                    {
                        level: 'debug',
                        message: 'Executing action [Action:function_id_1]',
                        timestamp: expect.any(DateTime),
                    },
                    {
                        level: 'info',
                        timestamp: expect.any(DateTime),
                        message: '[Action:function_id_1] Hello, Mr John Doe!',
                    },
                    {
                        level: 'info',
                        timestamp: expect.any(DateTime),
                        message: '[Action:function_id_1] Fetch 1, 200',
                    },
                    {
                        level: 'debug',
                        timestamp: expect.any(DateTime),
                        message: expect.stringContaining('[Action:function_id_1] Function completed in'),
                    },
                    {
                        level: 'info',
                        timestamp: expect.any(DateTime),
                        message: 'Workflow moved to action [Action:exit]',
                    },
                    {
                        level: 'debug',
                        timestamp: expect.any(DateTime),
                        message: 'Executing action [Action:exit]',
                    },
                    {
                        level: 'info',
                        timestamp: expect.any(DateTime),
                        message: 'Workflow completed',
                    },
                ],
                metrics: [
                    {
                        team_id: insightsFlow.team_id,
                        app_source_id: insightsFlow.id,
                        instance_id: expect.any(String),
                        metric_kind: 'fetch',
                        metric_name: 'billable_invocation',
                        count: 1,
                    },
                    {
                        team_id: insightsFlow.team_id,
                        app_source_id: insightsFlow.id,
                        instance_id: 'function_id_1',
                        metric_kind: 'success',
                        metric_name: 'succeeded',
                        count: 1,
                    },
                    {
                        team_id: insightsFlow.team_id,
                        app_source_id: insightsFlow.id,
                        instance_id: 'exit',
                        metric_kind: 'success',
                        metric_name: 'succeeded',
                        count: 1,
                    },
                ],
            })
        })

        it('can execute a customflow with async function delays', async () => {
            const action = insightsFlow.actions.find((action) => action.id === 'function_id_1')!
            ;(action.config as any).template_id = 'template-test-customflow-executor-async'

            const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                event: {
                    ...createScriptExecutionGlobals().event,
                    properties: {
                        name: 'John Doe',
                    },
                    timestamp: '2026-01-30T20:20:20.200Z',
                },
            })

            const result = await executor.execute(invocation)

            expect(result.finished).toEqual(false)
            expect(result.invocation.state.currentAction!.insightsFunctionState).toEqual(expect.any(Object))
            expect(result.invocation.queueScheduledAt).toEqual(expect.any(DateTime))
            expect(result.logs.map((log) => log.message)).toMatchInlineSnapshot(`
                [
                  "Starting workflow execution at trigger for [Person:person_id|John Doe] on [Event:uuid|test|2026-01-30T20:20:20.200Z]",
                  "Executing action [Action:function_id_1]",
                  "[Action:function_id_1] Hello, Mr John Doe!",
                  "[Action:function_id_1] Fetch 1, 200",
                  "Workflow will pause until 2025-01-01T00:00:00.000Z",
                ]
            `)

            const result2 = await executor.execute(result.invocation)

            expect(result2.finished).toEqual(false)
            expect(result2.invocation.state.currentAction!.insightsFunctionState).toEqual(expect.any(Object))
            expect(result2.logs.map((log) => log.message)).toMatchInlineSnapshot(`
                [
                  "Resuming workflow execution at [Action:function_id_1] on [Event:uuid|test|2026-01-30T20:20:20.200Z]",
                  "Executing action [Action:function_id_1]",
                  "[Action:function_id_1] Fetch 2, 200",
                  "Workflow will pause until 2025-01-01T00:00:00.000Z",
                ]
            `)

            const result3 = await executor.execute(result2.invocation)

            expect(result3.finished).toEqual(true)
            expect(cleanLogs(result3.logs.map((log) => log.message))).toMatchInlineSnapshot(`
                [
                  "Resuming workflow execution at [Action:function_id_1] on [Event:uuid|test|2026-01-30T20:20:20.200Z]",
                  "Executing action [Action:function_id_1]",
                  "[Action:function_id_1] Fetch 3, 200",
                  "[Action:function_id_1] All fetches done!",
                  "[Action:function_id_1] Function completed in REPLACEDms. Sync: 0ms. Mem: 0.099kb. Ops: 32. Event: 'http://localhost:8000/events/1'",
                  "Workflow moved to action [Action:exit]",
                  "Executing action [Action:exit]",
                  "Workflow completed",
                ]
            `)
        })

        describe('action filtering', () => {
            beforeEach(() => {
                const action = insightsFlow.actions.find((action) => action.id === 'function_id_1')!
                action.filters = FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter.filters
            })

            it('should only run the action if the provided filters match', async () => {
                const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        event: '$pageview',
                        properties: {
                            $current_url: 'https://hanzo.ai',
                        },
                    },
                })

                const result = await executor.execute(invocation)

                expect(result.finished).toEqual(true)
                expect(mockFetch).toHaveBeenCalledTimes(1)
                expect(result.metrics.find((x) => x.instance_id === 'function_id_1')).toMatchObject({
                    count: 1,
                    instance_id: 'function_id_1',
                    metric_kind: 'success',
                    metric_name: 'succeeded',
                })
            })

            it('should skip the action if the filters do not match', async () => {
                const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        event: 'not-a-pageview',
                        properties: {
                            $current_url: 'https://hanzo.ai',
                        },
                    },
                })

                const result = await executor.execute(invocation)

                expect(result.finished).toEqual(true)
                expect(mockFetch).toHaveBeenCalledTimes(0)
                expect(result.metrics.find((x) => x.instance_id === 'function_id_1')).toMatchObject({
                    count: 1,
                    instance_id: 'function_id_1',
                    metric_kind: 'other',
                    metric_name: 'filtered',
                })
            })
        })

        describe('executeTest', () => {
            it('executes only a single step at a time', async () => {
                const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        properties: {
                            name: 'Debug User',
                        },
                        timestamp: '2026-01-30T20:20:20.200Z',
                    },
                })

                // NOTE: Slightly contrived as we dont set the current action to trigger when creating the invocation
                // but we do support it technically from the frontend
                invocation.state.currentAction = {
                    id: 'trigger',
                    startedAtTimestamp: DateTime.now().toMillis(),
                }

                // First step: should process trigger and move to function_id_1, but not complete
                const result1 = await executor.executeCurrentAction(invocation)
                expect(result1.finished).toBe(false)
                expect(result1.invocation.state.currentAction?.id).toBe('function_id_1')
                expect(result1.logs.map((log) => log.message)).toEqual([
                    'Executing action [Action:trigger]',
                    'Workflow moved to action [Action:function_id_1]',
                ])

                // Second step: should process function_id_1 and move to exit, but not complete
                const result2 = await executor.execute(result1.invocation)
                expect(result2.finished).toBe(true)
                expect(result2.invocation.state.currentAction?.id).toBe('exit')
                expect(result2.logs.map((log) => log.message)).toEqual([
                    'Resuming workflow execution at [Action:function_id_1] on [Event:uuid|test|2026-01-30T20:20:20.200Z]',
                    'Executing action [Action:function_id_1]',
                    '[Action:function_id_1] Hello, Mr Debug User!',
                    '[Action:function_id_1] Fetch 1, 200',
                    expect.stringContaining('[Action:function_id_1] Function completed in'),
                    'Workflow moved to action [Action:exit]',
                    'Executing action [Action:exit]',
                    'Workflow completed',
                ])
            })
        })
    })

    describe('actions', () => {
        const createInsightsFlow = (flow: SimpleInsightsFlowRepresentation): InsightsFlow => {
            return new FixtureInsightsFlowBuilder()
                .withExitCondition('exit_on_conversion')
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
                            config: {
                                delay_duration: '2h',
                            },
                        },
                        exit: {
                            type: 'exit',
                            config: {},
                        },
                        ...flow.actions,
                    },
                    edges: flow.edges,
                })
                .build()
        }

        describe('early exit conditions', () => {
            let insightsFlow: InsightsFlow

            beforeEach(async () => {
                // Setup: exit if person no longer matches trigger filters
                insightsFlow = new FixtureInsightsFlowBuilder()
                    .withExitCondition('exit_only_at_end')
                    .withWorkflow({
                        actions: {
                            trigger: {
                                type: 'trigger',
                                config: {
                                    type: 'event',
                                    filters: FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter.filters ?? {},
                                },
                            },
                            function_id_1: {
                                type: 'function',
                                config: {
                                    template_id: 'template-test-customflow-executor',
                                    inputs: {
                                        name: {
                                            value: `Mr {event?.properties?.name}`,
                                            bytecode: await compileFn(`return f'Mr {event?.properties?.name}'`),
                                        },
                                    },
                                },
                            },
                            exit: {
                                type: 'exit',
                                config: {},
                            },
                        },
                        edges: [
                            { from: 'trigger', to: 'function_id_1', type: 'continue' },
                            { from: 'function_id_1', to: 'exit', type: 'continue' },
                        ],
                    })
                    .build()
            })

            it('should not exit early if exit condition is exit_only_at_end', async () => {
                const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        event: '$pageview',
                        properties: { name: 'John Doe', $current_url: 'https://hanzo.ai' },
                    },
                })

                // Step 1: run first action (function_id_1)
                const result1 = await executor.execute(invocation)
                expect(result1.finished).toBe(true)
                // Metrics: 'billable_invocation' from function_id_1, 'succeeded' from function_id_1, 'succeeded' from exit action
                expect(result1.metrics.map((m) => m.metric_name)).toEqual([
                    'billable_invocation',
                    'succeeded',
                    'succeeded',
                ])

                const invocation2 = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        event: 'not-a-pageview',
                        properties: { name: 'John Doe', $current_url: 'https://hanzo.ai' },
                    },
                })

                // Step 2: run again, should NOT exit early due to exit_only_at_end
                const result2 = await executor.execute(invocation2)
                expect(result2.finished).toBe(true)
                // Metrics: 'billable_invocation' from function_id_1, 'succeeded' from function_id_1, 'succeeded' from exit action
                expect(result2.metrics.map((m) => m.metric_name)).toEqual([
                    'billable_invocation',
                    'succeeded',
                    'succeeded',
                ])
            })

            it('should exit early if exit condition is exit_on_conversion', async () => {
                insightsFlow.exit_condition = 'exit_on_conversion'
                insightsFlow.conversion = {
                    window_minutes: 10,
                    filters: FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter.filters,
                }

                // Simulate a non-conversion event
                const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        event: '$not-a-pageview',
                        properties: { name: 'John Doe', $current_url: 'https://hanzo.ai', conversion: true },
                    },
                })

                const result1 = await executor.execute(invocation)
                expect(result1.finished).toBe(true)
                // Metrics: 'billable_invocation' from function_id_1, 'succeeded' from function_id_1, 'succeeded' from exit action
                expect(result1.metrics.map((m) => m.metric_name)).toEqual([
                    'billable_invocation',
                    'succeeded',
                    'succeeded',
                ])

                const invocation2 = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        event: '$pageview',
                        properties: { name: 'John Doe', $current_url: 'https://hanzo.ai', conversion: true },
                    },
                })
                const result2 = await executor.execute(invocation2)
                expect(result2.finished).toBe(true)
                expect(result2.metrics.map((m) => m.metric_name)).toEqual(['early_exit'])
                expect(result2.logs.map((log) => log.message)).toMatchInlineSnapshot(`
                    [
                      "Workflow exited early due to exit condition: exit_on_conversion (Person matches conversion filters)",
                    ]
                `)
            })

            it('should exit early if exit condition is exit_on_trigger_not_matched', async () => {
                insightsFlow.exit_condition = 'exit_on_trigger_not_matched'
                insightsFlow.trigger = {
                    type: 'event',
                    filters: FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter.filters ?? {},
                }

                const invocation1 = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        event: '$pageview',
                        properties: { name: 'John Doe', $current_url: 'https://hanzo.ai' },
                    },
                })

                const result1 = await executor.execute(invocation1)
                expect(result1.finished).toBe(true)
                expect(result1.metrics.map((m) => m.metric_name)).toEqual([
                    'billable_invocation',
                    'succeeded',
                    'succeeded',
                ])

                const invocation2 = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        event: '$not-a-pageview',
                        properties: { name: 'John Doe', $current_url: 'https://hanzo.ai' },
                    },
                })

                const result2 = await executor.execute(invocation2)
                expect(result2.finished).toBe(true)
                expect(result2.metrics.map((m) => m.metric_name)).toEqual(['early_exit'])
                expect(result2.logs.map((log) => log.message)).toMatchInlineSnapshot(`
                    [
                      "Workflow exited early due to exit condition: exit_on_trigger_not_matched (Person no longer matches trigger filters)",
                    ]
                `)
            })

            it('should exit early if exit condition is exit_on_trigger_not_matched_or_conversion', async () => {
                // Setup: exit if person no longer matches trigger filters or conversion event is seen
                insightsFlow.exit_condition = 'exit_on_trigger_not_matched_or_conversion'
                insightsFlow.trigger = {
                    type: 'event',
                    filters: FN_FILTERS_EXAMPLES.no_filters.filters ?? {},
                }
                insightsFlow.conversion = {
                    window_minutes: 10,
                    filters: FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter.filters,
                }

                // Simulate person data changing so they no longer match the trigger filter
                const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        event: '$not-a-pageview',
                        properties: { name: 'John Doe', $current_url: 'https://hanzo.ai' },
                    },
                })

                const result1 = await executor.execute(invocation)
                expect(result1.finished).toBe(true)
                // Metrics: 'billable_invocation' from function_id_1, 'succeeded' from function_id_1, 'succeeded' from exit action
                expect(result1.metrics.map((m) => m.metric_name)).toEqual([
                    'billable_invocation',
                    'succeeded',
                    'succeeded',
                ])

                const invocation2 = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        event: '$pageview',
                        properties: { name: 'John Doe', $current_url: 'https://hanzo.ai' },
                    },
                })

                const result2 = await executor.execute(invocation2)
                expect(result2.finished).toBe(true)
                expect(result2.metrics.map((m) => m.metric_name)).toEqual(['early_exit'])
                expect(result2.logs.map((log) => log.message)).toMatchInlineSnapshot(`
                    [
                      "Workflow exited early due to exit condition: exit_on_trigger_not_matched_or_conversion (Person matches conversion filters)",
                    ]
                `)
            })

            describe('on_error handling', () => {
                let insightsFlow: InsightsFlow
                beforeEach(async () => {
                    insightsFlow = new FixtureInsightsFlowBuilder()
                        .withWorkflow({
                            actions: {
                                trigger: {
                                    type: 'trigger',
                                    config: {
                                        type: 'event',
                                        filters: FN_FILTERS_EXAMPLES.no_filters.filters ?? {},
                                    },
                                },
                                function_id_1: {
                                    type: 'function',
                                    config: {
                                        template_id: 'template-test-customflow-executor',
                                        inputs: {
                                            name: {
                                                value: `Mr {event?.properties?.name}`,
                                                bytecode: await compileFn(`raise Exception('fail!')`),
                                            },
                                        },
                                    },
                                    // filters: none
                                },
                                middle_action: {
                                    id: 'middle_action',
                                    name: 'Middle Action',
                                    description: '',
                                    type: 'delay',
                                    config: { delay_duration: '5m' },
                                    created_at: new Date().getUTCSeconds(),
                                    updated_at: new Date().getUTCSeconds(),
                                },
                                exit: {
                                    type: 'exit',
                                    config: {},
                                },
                            },
                            edges: [
                                { from: 'trigger', to: 'function_id_1', type: 'continue' },
                                { from: 'function_id_1', to: 'middle_action', type: 'continue' },
                                { from: 'middle_action', to: 'exit', type: 'continue' },
                            ],
                        })
                        .build()
                })

                describe('execute error handling when error is returned, not thrown', () => {
                    it('continues to next action when on_error is continue', async () => {
                        const action = insightsFlow.actions.find((a) => a.id === 'function_id_1')!
                        action.on_error = 'continue'

                        // Mock the handler to return an error in the result
                        const functionHandler = executor['actionHandlers']['function']
                        jest.spyOn(functionHandler, 'execute').mockResolvedValueOnce({
                            error: new Error('Mocked handler error'),
                        })

                        const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                            event: {
                                ...createScriptExecutionGlobals().event,
                                properties: { name: 'Test User' },
                            },
                        })
                        invocation.state.currentAction = {
                            id: 'function_id_1',
                            startedAtTimestamp: DateTime.now().toMillis(),
                        }

                        const result = await executor.executeCurrentAction(invocation)

                        expect(result.error).toBe('Mocked handler error')

                        expect(result.finished).toBe(false)

                        expect(result.invocation.state.currentAction?.id).toBe('middle_action')
                        expect(result.logs.map((l) => l.message)).toEqual(
                            expect.arrayContaining([
                                expect.stringContaining('Continuing to next action'),
                                expect.stringContaining('Workflow moved to action [Action:middle_action]'),
                            ])
                        )
                    })

                    it('does NOT continue to next action when on_error is abort', async () => {
                        const action = insightsFlow.actions.find((a) => a.id === 'function_id_1')!
                        action.on_error = 'abort'

                        // Mock the handler to return an error in the result
                        const functionHandler = executor['actionHandlers']['function']
                        jest.spyOn(functionHandler, 'execute').mockResolvedValueOnce({
                            error: new Error('Mocked handler error'),
                        })

                        const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                            event: {
                                ...createScriptExecutionGlobals().event,
                                properties: { name: 'Test User' },
                            },
                        })
                        invocation.state.currentAction = {
                            id: 'function_id_1',
                            startedAtTimestamp: DateTime.now().toMillis(),
                        }

                        const loggerErrorSpy = jest.spyOn(logger, 'error')

                        const result = await executor.execute(invocation)

                        expect(result.error).toBe('Mocked handler error')
                        expect(result.finished).toBe(true)
                        // Should stay on function_id_1 - goToNextAction was NOT called
                        expect(result.invocation.state.currentAction?.id).toBe('function_id_1')
                        expect(result.logs.map((l) => l.message)).not.toEqual(
                            expect.arrayContaining([expect.stringContaining('Workflow moved to action')])
                        )
                        expect(result.logs.map((l) => l.message)).toEqual(
                            expect.arrayContaining([
                                expect.stringContaining(
                                    `Workflow is aborting due to [Action:function_id_1] error handling setting being set to abort on error`
                                ),
                            ])
                        )

                        // Check that logger.error was called with the expected log
                        expect(loggerErrorSpy).toHaveBeenCalledWith(
                            '🦔',
                            expect.stringContaining(
                                `[InsightsFlowExecutor] Error executing custom flow ${insightsFlow.id} - ${insightsFlow.name}. Event: '`
                            ),
                            expect.any(Error)
                        )
                        loggerErrorSpy.mockRestore()
                    })
                })
            })
        })

        describe('per action runner tests', () => {
            // NOTE: We test one case of each action to ensure it works as expected, the rest is handles as per-action unit test
            const cases: [
                string,
                SimpleInsightsFlowRepresentation,
                {
                    finished: boolean
                    scheduledAt?: DateTime
                    nextActionId: string
                },
            ][] = [
                [
                    'wait_until_condition',
                    {
                        actions: {
                            wait_until_condition: {
                                type: 'wait_until_condition',
                                config: {
                                    condition: {
                                        filters: FN_FILTERS_EXAMPLES.elements_text_filter.filters, // no match
                                    },
                                    max_wait_duration: '10m',
                                },
                            },
                        },
                        edges: [
                            {
                                from: 'trigger',
                                to: 'wait_until_condition',
                                type: 'continue',
                            },
                        ],
                    },
                    {
                        finished: false,
                        scheduledAt: DateTime.fromISO('2025-01-01T00:10:00.000Z').toUTC(),
                        nextActionId: 'wait_until_condition',
                    },
                ],

                [
                    'conditional_branch',
                    {
                        actions: {
                            conditional_branch: {
                                type: 'conditional_branch',
                                config: {
                                    conditions: [
                                        {
                                            filters: FN_FILTERS_EXAMPLES.elements_text_filter.filters,
                                        },
                                        {
                                            filters: FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter.filters,
                                        },
                                    ],
                                },
                            },
                        },
                        edges: [
                            {
                                from: 'conditional_branch',
                                to: 'exit',
                                type: 'branch',
                                index: 0,
                            },
                            {
                                from: 'conditional_branch',
                                to: 'delay',
                                type: 'branch',
                                index: 1,
                            },
                        ],
                    },
                    {
                        finished: false,
                        nextActionId: 'delay',
                    },
                ],
                [
                    'delay',
                    {
                        actions: {
                            delay: {
                                type: 'delay',
                                config: {
                                    delay_duration: '2h',
                                },
                            },
                        },
                        edges: [
                            {
                                from: 'delay',
                                to: 'exit',
                                type: 'continue',
                            },
                        ],
                    },
                    {
                        finished: false,
                        scheduledAt: DateTime.fromISO('2025-01-01T02:00:00.000Z').toUTC(),
                        nextActionId: 'exit',
                    },
                ],
                [
                    'random_cohort_branch',
                    {
                        actions: {
                            random_cohort_branch: {
                                type: 'random_cohort_branch',
                                config: {
                                    cohorts: [
                                        {
                                            percentage: 50,
                                        },
                                        {
                                            percentage: 50,
                                        },
                                    ],
                                },
                            },
                        },
                        edges: [
                            {
                                from: 'random_cohort_branch',
                                to: 'exit',
                                type: 'branch',
                                index: 0,
                            },
                            {
                                from: 'random_cohort_branch',
                                to: 'delay',
                                type: 'branch',
                                index: 1,
                            },
                        ],
                    },
                    {
                        finished: false,
                        nextActionId: 'delay',
                    },
                ],
                [
                    'exit',
                    {
                        actions: {
                            exit: {
                                type: 'exit',
                                config: {},
                            },
                        },
                        edges: [
                            {
                                from: 'exit',
                                to: 'exit',
                                type: 'continue',
                            },
                        ],
                    },
                    { finished: true, nextActionId: 'exit' },
                ],
            ]

            it.each(cases)(
                'should run %s action',
                async (actionId, simpleFlow, { nextActionId, finished, scheduledAt }) => {
                    const insightsFlow = createInsightsFlow(simpleFlow)
                    const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                        event: {
                            ...createScriptExecutionGlobals().event,
                            event: '$pageview',
                            properties: {
                                $current_url: 'https://hanzo.ai',
                            },
                        },
                    })

                    // For the random_cohort_branch action
                    jest.spyOn(Math, 'random').mockReturnValue(0.8)

                    invocation.state.currentAction = {
                        id: actionId,
                        startedAtTimestamp: DateTime.utc().toMillis(),
                    }

                    const result = await executor['executeCurrentAction'](invocation)

                    expect(result.finished).toEqual(finished)
                    expect(result.invocation.queueScheduledAt).toEqual(scheduledAt)
                    expect(result.invocation.state.currentAction!.id).toEqual(nextActionId)
                }
            )
        })

        describe('capturedInsightsEvents', () => {
            it('should collect capturedInsightsEvents from custom function actions', async () => {
                const insightsFlow = createInsightsFlow({
                    actions: {
                        capture_function: {
                            type: 'function',
                            config: {
                                template_id: 'template-insights-capture',
                                inputs: {
                                    event: { value: 'custom_event' },
                                    distinct_id: { value: '{event.distinct_id}' },
                                    properties: {
                                        value: {
                                            user: '{event.properties.user_name}',
                                            value: '{event.properties.value}',
                                        },
                                    },
                                },
                            },
                        },
                        exit: {
                            type: 'exit',
                            config: {},
                        },
                    },
                    edges: [
                        {
                            from: 'trigger',
                            to: 'capture_function',
                            type: 'continue',
                        },
                        {
                            from: 'capture_function',
                            to: 'exit',
                            type: 'continue',
                        },
                    ],
                })

                const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                    event: {
                        ...createScriptExecutionGlobals().event,
                        properties: { user_name: 'Test User', value: 'test-value-123' },
                    },
                })

                const result = await executor.execute(invocation)

                expect(result.finished).toBe(true)
                expect(result.error).toBeUndefined()

                expect(result.capturedInsightsEvents).toBeDefined()
                expect(result.capturedInsightsEvents).toHaveLength(1)
                expect(result.capturedInsightsEvents[0]).toMatchObject({
                    team_id: 1,
                    event: 'custom_event',
                    distinct_id: '{event.distinct_id}',
                    properties: {
                        user: '{event.properties.user_name}',
                        value: '{event.properties.value}',
                    },
                })
            })

            it('should collect capturedInsightsEvents from multiple custom function actions', async () => {
                const insightsFlow = createInsightsFlow({
                    actions: {
                        capture_function_1: {
                            type: 'function',
                            config: {
                                template_id: 'template-insights-capture',
                                inputs: {
                                    event: { value: 'custom_event' },
                                    distinct_id: { value: 'user1' },
                                    properties: { value: { user: 'User1', value: 'value1' } },
                                },
                            },
                        },
                        capture_function_2: {
                            type: 'function',
                            config: {
                                template_id: 'template-insights-capture',
                                inputs: {
                                    event: { value: 'custom_event' },
                                    distinct_id: { value: 'user2' },
                                    properties: { value: { user: 'User2', value: 'value2' } },
                                },
                            },
                        },
                        exit: {
                            type: 'exit',
                            config: {},
                        },
                    },
                    edges: [
                        {
                            from: 'trigger',
                            to: 'capture_function_1',
                            type: 'continue',
                        },
                        {
                            from: 'capture_function_1',
                            to: 'capture_function_2',
                            type: 'continue',
                        },
                        {
                            from: 'capture_function_2',
                            to: 'exit',
                            type: 'continue',
                        },
                    ],
                })

                const invocation = createExampleInsightsFlowInvocation(insightsFlow)

                const result = await executor.execute(invocation)

                expect(result.finished).toBe(true)
                expect(result.error).toBeUndefined()

                expect(result.capturedInsightsEvents).toHaveLength(2)
                expect(result.capturedInsightsEvents[0]).toMatchObject({
                    event: 'custom_event',
                    distinct_id: 'user1',
                    properties: { user: 'User1', value: 'value1' },
                })
                expect(result.capturedInsightsEvents[1]).toMatchObject({
                    event: 'custom_event',
                    distinct_id: 'user2',
                    properties: { user: 'User2', value: 'value2' },
                })
            })
        })
    })

    describe('filter_test_accounts', () => {
        let insightsFlow: InsightsFlow

        beforeEach(async () => {
            insightsFlow = new FixtureInsightsFlowBuilder()
                .withWorkflow({
                    actions: {
                        trigger: {
                            type: 'trigger',
                            config: {
                                type: 'event',
                                // Use the test account filter which filters out @hanzo.ai emails
                                filters: FN_FILTERS_EXAMPLES.test_account_filter.filters ?? {},
                            },
                        },

                        function_id_1: {
                            type: 'function',
                            config: {
                                template_id: 'template-test-customflow-executor',
                                inputs: {
                                    name: {
                                        value: `Mr {event?.properties?.name}`,
                                        bytecode: await compileFn(`return f'Mr {event?.properties?.name}'`),
                                    },
                                },
                            },
                        },

                        exit: {
                            type: 'exit',
                            config: {},
                        },
                    },
                    edges: [
                        {
                            from: 'trigger',
                            to: 'function_id_1',
                            type: 'continue',
                        },
                        {
                            from: 'function_id_1',
                            to: 'exit',
                            type: 'continue',
                        },
                    ],
                })
                .build()
        })

        it('should filter out internal users with @hanzo.ai email', async () => {
            // Create globals with internal user email
            const globals = createScriptExecutionGlobals({
                event: {
                    uuid: 'uuid',
                    event: '$pageview',
                    distinct_id: 'distinct_id',
                    elements_chain: '',
                    timestamp: new Date().toISOString(),
                    url: 'http://localhost:8000/events/1',
                    properties: {
                        name: 'Internal User',
                    },
                },
                person: {
                    id: 'person_internal',
                    name: 'Internal User',
                    url: '',
                    properties: {
                        email: 'internal@hanzo.ai',
                    },
                },
            })

            const result = await executor.buildInsightsFlowInvocations([insightsFlow], globals)

            // Should not match because email contains @hanzo.ai
            expect(result.invocations).toHaveLength(0)
        })

        it('should allow external users without @hanzo.ai email', async () => {
            // Create globals with external user email
            const globals = createScriptExecutionGlobals({
                event: {
                    uuid: 'uuid',
                    event: '$pageview',
                    distinct_id: 'distinct_id',
                    elements_chain: '',
                    timestamp: new Date().toISOString(),
                    url: 'http://localhost:8000/events/1',
                    properties: {
                        name: 'External User',
                    },
                },
                person: {
                    id: 'person_external',
                    name: 'External User',
                    url: '',
                    properties: {
                        email: 'external@customer.com',
                    },
                },
            })

            const result = await executor.buildInsightsFlowInvocations([insightsFlow], globals)

            // Should match because email doesn't contain @hanzo.ai
            expect(result.invocations).toHaveLength(1)
            expect(result.invocations[0].insightsFlow.id).toBe(insightsFlow.id)
        })
    })

    describe('variable merging', () => {
        it('merges default and provided variables correctly', () => {
            const insightsFlow: InsightsFlow = new FixtureInsightsFlowBuilder()
                .withWorkflow({
                    actions: {
                        trigger: {
                            type: 'trigger',
                            config: {
                                type: 'event',
                                filters: {},
                            },
                        },

                        exit: {
                            type: 'exit',
                            config: {},
                        },
                    },
                    edges: [{ from: 'trigger', to: 'exit', type: 'continue' }],
                })
                .build()

            // Set variables directly with required fields
            insightsFlow.variables = [
                { key: 'foo', default: 'bar', type: 'string', label: 'foo' },
                { key: 'baz', default: 123, type: 'number', label: 'baz' },
                { key: 'overrideMe', default: 'defaultValue', type: 'string', label: 'overrideMe' },
            ]

            const globals = {
                event: {
                    event: 'test',
                    properties: {},
                    url: '',
                    distinct_id: '',
                    timestamp: '',
                    uuid: '',
                    elements_chain: '',
                },
                project: { id: 1, name: 'Test Project', url: '' },
                person: { id: 'person_id', name: 'John Doe', properties: {}, url: '' },
                variables: {
                    overrideMe: 'customValue',
                    extra: 'shouldBeIncluded',
                },
            }
            const invocation = createInsightsFlowInvocation(globals, insightsFlow, {} as any)
            expect(invocation.state.variables).toEqual({
                foo: 'bar',
                baz: 123,
                overrideMe: 'customValue',
                extra: 'shouldBeIncluded',
            })
        })
    })

    describe('output variable mapping', () => {
        let insightsFlowBuilder: (outputVariable: any) => Promise<InsightsFlow>

        beforeEach(async () => {
            const nameBytecode = await compileFn(`return 'Test'`)
            insightsFlowBuilder = (outputVariable: any) => {
                return Promise.resolve(
                    new FixtureInsightsFlowBuilder()
                        .withWorkflow({
                            actions: {
                                trigger: {
                                    type: 'trigger',
                                    config: {
                                        type: 'event',
                                        filters: FN_FILTERS_EXAMPLES.no_filters.filters ?? {},
                                    },
                                },
                                action_1: {
                                    type: 'function',
                                    config: {
                                        template_id: 'template-test-customflow-executor',
                                        inputs: {
                                            name: {
                                                value: 'Test',
                                                bytecode: nameBytecode,
                                            },
                                        },
                                    },
                                    output_variable: outputVariable,
                                } as any,
                                exit: {
                                    type: 'exit',
                                    config: {},
                                },
                            },
                            edges: [
                                { from: 'trigger', to: 'action_1', type: 'continue' },
                                { from: 'action_1', to: 'exit', type: 'continue' },
                            ],
                        })
                        .build()
                )
            }
        })

        const executeToCompletion = async (insightsFlow: InsightsFlow) => {
            const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                event: {
                    ...createScriptExecutionGlobals().event,
                    properties: { name: 'Test' },
                },
            })
            let result = await executor.execute(invocation)
            while (!result.finished) {
                result = await executor.execute(result.invocation)
            }
            return result
        }

        it('stores full result in variable with single object output_variable', async () => {
            const insightsFlow = await insightsFlowBuilder({ key: 'response', result_path: null })
            const result = await executeToCompletion(insightsFlow)

            expect(result.invocation.state.variables?.response).toBeDefined()
            expect(result.invocation.state.variables?.response).toHaveProperty('status', 200)
        })

        it('stores extracted value via result_path', async () => {
            const insightsFlow = await insightsFlowBuilder({ key: 'http_status', result_path: 'status' })
            const result = await executeToCompletion(insightsFlow)

            expect(result.invocation.state.variables).toEqual({ http_status: 200 })
        })

        it('stores multiple variables from array output_variable', async () => {
            const insightsFlow = await insightsFlowBuilder([
                { key: 'http_status', result_path: 'status' },
                { key: 'response_body', result_path: 'body' },
            ])
            const result = await executeToCompletion(insightsFlow)

            expect(result.invocation.state.variables?.http_status).toBe(200)
            expect(result.invocation.state.variables?.response_body).toBeDefined()
        })

        it('spreads object result into prefixed variables', async () => {
            const insightsFlow = await insightsFlowBuilder({ key: 'resp', result_path: 'body', spread: true })
            const result = await executeToCompletion(insightsFlow)

            // body is { status: 200 } so spread should create resp_status
            expect(result.invocation.state.variables?.resp_status).toBe(200)
        })

        it('skips entries with empty key in array form', async () => {
            const insightsFlow = await insightsFlowBuilder([
                { key: '', result_path: 'status' },
                { key: 'http_status', result_path: 'status' },
            ])
            const result = await executeToCompletion(insightsFlow)

            expect(result.invocation.state.variables).toEqual({ http_status: 200 })
        })

        it('does nothing when output_variable is undefined', async () => {
            const insightsFlow = await insightsFlowBuilder(undefined)
            const result = await executeToCompletion(insightsFlow)

            expect(result.invocation.state.variables).toBeUndefined()
        })

        it('errors and exits when total variable size exceeds 5KB with on_error=abort', async () => {
            const insightsFlow = await insightsFlowBuilder({ key: 'response', result_path: null })
            // Set action to abort on error
            const action = insightsFlow.actions.find((a) => a.id === 'action_1')!
            action.on_error = 'abort'

            const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                event: {
                    ...createScriptExecutionGlobals().event,
                    properties: { name: 'Test' },
                },
            })
            invocation.state.variables = { existing: 'x'.repeat(5100) }

            let result = await executor.execute(invocation)
            while (!result.finished) {
                result = await executor.execute(result.invocation)
            }

            expect(result.error).toContain('exceeds 5KB limit')
            expect(result.invocation.state.variables?.response).toBeUndefined()
            expect(result.invocation.state.variables?.existing).toBe('x'.repeat(5100))
        })

        it('errors but continues when total variable size exceeds 5KB with on_error=continue', async () => {
            const insightsFlow = await insightsFlowBuilder({ key: 'response', result_path: null })
            const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                event: {
                    ...createScriptExecutionGlobals().event,
                    properties: { name: 'Test' },
                },
            })
            invocation.state.variables = { existing: 'x'.repeat(5100) }

            let result = await executor.execute(invocation)
            while (!result.finished) {
                result = await executor.execute(result.invocation)
            }

            // on_error=continue (default), so workflow finishes but variables are cleaned up
            expect(result.finished).toBe(true)
            expect(result.invocation.state.variables?.response).toBeUndefined()
            expect(result.invocation.state.variables?.existing).toBe('x'.repeat(5100))
            expect(result.logs.some((l) => l.message.includes('exceeds 5KB limit'))).toBe(true)
        })

        it('warns when output variable specified but no result returned', async () => {
            // Use a template that doesn't do a fetch (no result)
            await insertInsightsFunctionTemplate(hub.postgres, {
                id: 'template-no-result',
                name: 'No result template',
                code: `print('no result')`,
                inputs_schema: [],
            })

            const insightsFlow = new FixtureInsightsFlowBuilder()
                .withWorkflow({
                    actions: {
                        trigger: {
                            type: 'trigger',
                            config: {
                                type: 'event',
                                filters: FN_FILTERS_EXAMPLES.no_filters.filters ?? {},
                            },
                        },
                        action_1: {
                            type: 'function',
                            config: {
                                template_id: 'template-no-result',
                                inputs: {},
                            },
                            output_variable: { key: 'my_var', result_path: null },
                        } as any,
                        exit: {
                            type: 'exit',
                            config: {},
                        },
                    },
                    edges: [
                        { from: 'trigger', to: 'action_1', type: 'continue' },
                        { from: 'action_1', to: 'exit', type: 'continue' },
                    ],
                })
                .build()

            const result = await executeToCompletion(insightsFlow)

            // No variables should be set since no result was produced
            expect(result.invocation.state.variables).toBeUndefined()
        })
    })

    describe('billing metrics', () => {
        const createInsightsFlow = (flow: SimpleInsightsFlowRepresentation): InsightsFlow => {
            return new FixtureInsightsFlowBuilder()
                .withExitCondition('exit_on_conversion')
                .withWorkflow({
                    actions: {
                        trigger: {
                            type: 'trigger',
                            config: {
                                type: 'event',
                                filters: FN_FILTERS_EXAMPLES.no_filters.filters ?? {},
                            },
                        },
                        ...flow.actions,
                        exit: {
                            type: 'exit',
                            config: {},
                        },
                    },
                    edges: [...flow.edges],
                })
                .build()
        }

        it('should record billing metrics for both regular custom functions and email functions', async () => {
            const team = await getFirstTeam(hub)

            await insertIntegration(hub.postgres, team.id, {
                id: 1,
                kind: 'email',
                config: {
                    email: 'test@hanzo.ai',
                    name: 'Test User',
                    domain: 'hanzo.ai',
                    verified: true,
                    provider: 'maildev',
                },
            })

            const regularTemplate = await insertInsightsFunctionTemplate(hub.postgres, {
                id: 'template-email',
                name: 'Test Regular Template',
                code: `sendEmail(inputs.email)`,
                inputs_schema: [
                    {
                        type: 'native_email',
                        key: 'email',
                        label: 'Email message',
                        integration: 'email',
                        required: true,
                        default: {
                            to: {
                                email: '',
                                name: '',
                            },
                            from: {
                                email: '',
                                name: '',
                            },
                            replyTo: '',
                            subject: '',
                            preheader: '',
                            text: 'Hello from Insights!',
                            html: '<div>Hi {{ person.properties.name }}, this email was sent from Insights!</div>',
                        },
                        secret: false,
                        description: '',
                        templating: 'liquid',
                    },
                ],
            })

            // Create a workflow with 2 regular custom function actions and 2 email actions
            const insightsFlow = createInsightsFlow({
                actions: {
                    function_1: {
                        type: 'function',
                        config: {
                            template_id: regularTemplate.template_id,
                            inputs: {
                                name: { value: 'Function 1' },
                            },
                        },
                    },
                    function_2: {
                        type: 'function',
                        config: {
                            template_id: regularTemplate.template_id,
                            inputs: {
                                name: { value: 'Function 2' },
                            },
                        },
                    },
                    email_1: {
                        type: 'function_email',
                        config: {
                            template_id: 'template-email',
                            inputs: {
                                email: {
                                    value: {
                                        to: {
                                            email: 'recipient@example.com',
                                            name: 'Recipient',
                                        },
                                        from: {
                                            integrationId: 1,
                                            email: 'test@hanzo.ai',
                                        },
                                        subject: 'Test Email 1',
                                        text: 'Test Text 1',
                                        html: 'Test HTML 1',
                                    },
                                },
                            },
                        },
                    },
                    email_2: {
                        type: 'function_email',
                        config: {
                            template_id: 'template-email',
                            inputs: {
                                email: {
                                    value: {
                                        to: {
                                            email: 'recipient2@example.com',
                                            name: 'Recipient 2',
                                        },
                                        from: {
                                            integrationId: 1,
                                            email: 'test@hanzo.ai',
                                        },
                                        subject: 'Test Email 2',
                                        text: 'Test Text 2',
                                        html: 'Test HTML 2',
                                    },
                                },
                            },
                        },
                    },
                },
                edges: [
                    { from: 'trigger', to: 'function_1', type: 'continue' },
                    { from: 'function_1', to: 'function_2', type: 'continue' },
                    { from: 'function_2', to: 'email_1', type: 'continue' },
                    { from: 'email_1', to: 'email_2', type: 'continue' },
                    { from: 'email_2', to: 'exit', type: 'continue' },
                ],
            })

            const invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                event: {
                    ...createScriptExecutionGlobals().event,
                    event: '$pageview',
                    properties: {
                        $current_url: 'https://hanzo.ai',
                    },
                },
            })

            // There are 4 async actions, so we need to execute multiple times until finished
            let result = await executor.execute(invocation)
            while (!result.finished) {
                result = await executor.execute(result.invocation)
            }

            expect(result.finished).toBe(true)
            expect(result.error).toBeUndefined()

            // Verify we have billing metrics for both custom functions and email actions
            const fetchBilling = result.metrics.filter(
                (m) => m.metric_kind === 'fetch' && m.metric_name === 'billable_invocation'
            )
            expect(fetchBilling).toHaveLength(2)
            const emailBilling = result.metrics.filter(
                (m) => m.metric_kind === 'email' && m.metric_name === 'billable_invocation'
            )
            expect(emailBilling).toHaveLength(2)
        })
    })
})
