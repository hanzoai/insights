import { DateTime } from 'luxon'

import { INSIGHTS_EXAMPLES, INSIGHTS_FILTERS_EXAMPLES, INSIGHTS_INPUTS_EXAMPLES } from '../_tests/examples'
import { createScriptExecutionGlobals, createInsightsFunction } from '../_tests/fixtures'
import { ScriptInputsService } from '../services/script-inputs.service'
import { buildInsightsFunctionInvocations, cloneInvocation, createInvocation } from './invocation-utils'

describe('Invocation utils', () => {
    describe('buildInsightsFunctionInvocations', () => {
        // Plain templated inputs only: no integration, email or push_subscription schema types, so
        // the service never reaches its integration manager, tokens service or encrypted fields.
        const scriptInputsService = new ScriptInputsService(undefined as any, undefined as any, undefined as any)

        const pageviewGlobals = () =>
            createScriptExecutionGlobals({
                groups: {},
                event: { event: '$pageview', properties: { $current_url: 'https://hanzo.ai' } } as any,
            })

        it('injects the invoked function as the globals source', async () => {
            const fn = createInsightsFunction({
                ...INSIGHTS_EXAMPLES.simple_fetch,
                ...INSIGHTS_INPUTS_EXAMPLES.simple_fetch,
                ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
            })

            const globals = createScriptExecutionGlobals({ groups: {} })
            expect(globals.source).toBeUndefined()

            const { invocations } = await buildInsightsFunctionInvocations(scriptInputsService, [fn], globals)

            expect(invocations).toHaveLength(1)
            expect(invocations[0].state.globals.source).toEqual({
                name: 'Script Function',
                url: `http://localhost:8000/projects/1/functions/${fn.id}/configuration/`,
            })
        })

        it('builds an invocation only when the filters match, counting a filtered metric otherwise', async () => {
            const fn = createInsightsFunction({
                ...INSIGHTS_EXAMPLES.simple_fetch,
                ...INSIGHTS_INPUTS_EXAMPLES.simple_fetch,
                ...INSIGHTS_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
            })

            const notMatched = await buildInsightsFunctionInvocations(
                scriptInputsService,
                [fn],
                createScriptExecutionGlobals({ groups: {} })
            )
            expect(notMatched.invocations).toHaveLength(0)
            expect(notMatched.metrics.map((m) => m.metric_name)).toEqual(['filtered'])

            const matched = await buildInsightsFunctionInvocations(scriptInputsService, [fn], pageviewGlobals())
            expect(matched.invocations).toHaveLength(1)
            expect(matched.metrics).toHaveLength(0)
        })

        // Filters that read elements_chain_* only match if the chain is parsed into the filter globals.
        // The parsing itself is covered in script-function-filtering.test.ts; these rows check that a real
        // autocapture filter of each shape actually gates invocation building.
        const elementsChainCases = [
            {
                shape: 'text',
                filters: INSIGHTS_FILTERS_EXAMPLES.elements_text_filter,
                notMatching: 'Not our text',
                matching: 'Reload',
                chain: (buttonText: string) =>
                    `span.Button__content:attr__class="Button__content"nth-child="2"nth-of-type="2"text="${buttonText}";span.Button__chrome:attr__class="Button__chrome"nth-child="1"nth-of-type="1";button.Button.Button--has-icon.Button--secondary.Button--status-default:attr__class="Button Button--secondary Button--status-default Button--has-icon"attr__type="button"nth-child="1"nth-of-type="1"text="${buttonText}";div.flex.gap-4.items-center:attr__class="flex gap-4 items-center"nth-child="1"nth-of-type="1"`,
            },
            {
                shape: 'href',
                filters: INSIGHTS_FILTERS_EXAMPLES.elements_href_filter,
                notMatching: '/project/1/not-a-link',
                matching: '/project/1/activity/explore',
                chain: (link: string) =>
                    `span.Button__content:attr__class="Button__content"attr__href="${link}"href="${link}"nth-child="2"nth-of-type="2"text="Activity";a.Button.Link.NavbarButton:attr__class="Link Button NavbarButton"attr__href="${link}"href="${link}"nth-child="1"nth-of-type="1"text="Activity"`,
            },
            {
                shape: 'tag and id',
                filters: INSIGHTS_FILTERS_EXAMPLES.elements_tag_and_id_filter,
                notMatching: 'notfound',
                matching: 'homelink',
                chain: (id: string) =>
                    `a.Link.font-semibold:attr__class="Link font-semibold"attr__href="/project/1/dashboard/1"attr__id="${id}"attr_id="${id}"href="/project/1/dashboard/1"nth-child="1"nth-of-type="1"text="My App Dashboard"`,
            },
        ]

        it.each(elementsChainCases)(
            'gates invocation building on an elements-chain $shape filter',
            async ({ filters, chain, notMatching, matching }) => {
                const fn = createInsightsFunction({
                    ...INSIGHTS_EXAMPLES.simple_fetch,
                    ...INSIGHTS_INPUTS_EXAMPLES.simple_fetch,
                    ...filters,
                })

                const autocaptureGlobals = (elementsChain: string) =>
                    createScriptExecutionGlobals({
                        groups: {},
                        event: {
                            uuid: 'uuid',
                            event: '$autocapture',
                            elements_chain: elementsChain,
                            distinct_id: 'distinct_id',
                            url: 'http://localhost:8000/events/1',
                            properties: { $lib_version: '1.2.3' },
                            timestamp: '2025-01-01T00:00:00.000Z',
                        },
                    })

                const notMatched = await buildInsightsFunctionInvocations(
                    scriptInputsService,
                    [fn],
                    autocaptureGlobals(chain(notMatching))
                )
                expect(notMatched.invocations).toHaveLength(0)
                expect(notMatched.metrics.map((m) => m.metric_name)).toEqual(['filtered'])

                const matched = await buildInsightsFunctionInvocations(
                    scriptInputsService,
                    [fn],
                    autocaptureGlobals(chain(matching))
                )
                expect(matched.invocations).toHaveLength(1)
                expect(matched.metrics).toHaveLength(0)
            }
        )

        describe('mappings', () => {
            const mappingFunction = () =>
                createInsightsFunction({
                    ...INSIGHTS_EXAMPLES.simple_fetch,
                    ...INSIGHTS_INPUTS_EXAMPLES.simple_fetch,
                    ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
                    mappings: [
                        {
                            // Filters for pageview or autocapture, and overrides the url input
                            ...INSIGHTS_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                            inputs: {
                                url: {
                                    order: 0,
                                    value: 'https://example.com?q={event.event}',
                                    bytecode: [
                                        '_H',
                                        1,
                                        32,
                                        'https://example.com?q=',
                                        32,
                                        'event',
                                        32,
                                        'event',
                                        1,
                                        2,
                                        2,
                                        'concat',
                                        2,
                                    ],
                                },
                            },
                        },
                        // No filters so should match all events
                        { ...INSIGHTS_FILTERS_EXAMPLES.no_filters },
                        // Broken filters so shouldn't match
                        { ...INSIGHTS_FILTERS_EXAMPLES.broken_filters },
                    ],
                })

            it('builds one invocation per matching mapping', async () => {
                const results = await buildInsightsFunctionInvocations(
                    scriptInputsService,
                    [mappingFunction()],
                    pageviewGlobals()
                )

                expect(results.invocations).toHaveLength(2)
                expect(results.metrics.map((m) => m.metric_name)).toEqual(['filtering_failed'])
                expect(results.logs.map((l) => l.message)).toMatchInlineSnapshot(`
                    [
                      "Error filtering event uuid: Invalid InsightsQL bytecode, stack is empty, can not pop",
                    ]
                `)
            })

            it('skips mappings whose filters do not match', async () => {
                const results = await buildInsightsFunctionInvocations(
                    scriptInputsService,
                    [mappingFunction()],
                    createScriptExecutionGlobals({ event: { event: 'test' } as any })
                )

                // Only the unfiltered mapping survives
                expect(results.invocations).toHaveLength(1)
                expect(results.metrics.map((m) => m.metric_name)).toEqual(['filtered', 'filtering_failed'])
            })

            it('resolves each matching mapping against its own inputs', async () => {
                const { invocations } = await buildInsightsFunctionInvocations(
                    scriptInputsService,
                    [mappingFunction()],
                    pageviewGlobals()
                )

                // The first mapping overrides url; both inherit the top-level headers
                expect(invocations[0].state.globals.inputs.url).toBe('https://example.com?q=$pageview')
                expect(invocations[0].state.globals.inputs.headers).toEqual({ version: 'v=' })
                expect(invocations[1].state.globals.inputs.url).toBe('https://example.com/insights-webhook')
                expect(invocations[1].state.globals.inputs.headers).toEqual({ version: 'v=' })
            })

            // `mappings: []` takes the mapping path and matches nothing, so the function never runs.
            // A destination saved with no mappings is silently a no-op rather than an unmapped send.
            it('builds nothing for a function with an empty mappings array', async () => {
                const fn = createInsightsFunction({
                    ...INSIGHTS_EXAMPLES.simple_fetch,
                    ...INSIGHTS_INPUTS_EXAMPLES.simple_fetch,
                    ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
                    mappings: [],
                })

                const results = await buildInsightsFunctionInvocations(scriptInputsService, [fn], pageviewGlobals())

                expect(results.invocations).toHaveLength(0)
                expect(results.metrics).toHaveLength(0)
            })
        })

        it('reports a function whose inputs fail to build without dropping the rest of the batch', async () => {
            const broken = createInsightsFunction({
                ...INSIGHTS_EXAMPLES.simple_fetch,
                ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
                inputs_schema: [{ key: 'url', type: 'string', label: 'Webhook URL', required: true }],
                // Truncated bytecode - resolving this input throws
                inputs: { url: { order: 0, value: 'https://example.com', bytecode: ['_H', 1, 2] } },
            })
            const healthy = createInsightsFunction({
                ...INSIGHTS_EXAMPLES.simple_fetch,
                ...INSIGHTS_INPUTS_EXAMPLES.simple_fetch,
                ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
            })

            const results = await buildInsightsFunctionInvocations(scriptInputsService, [broken, healthy], pageviewGlobals())

            expect(results.invocations.map((i) => i.functionId)).toEqual([healthy.id])
            expect(results.metrics).toMatchObject([
                { app_source_id: broken.id, metric_kind: 'failure', metric_name: 'inputs_failed', count: 1 },
            ])
            expect(results.logs).toMatchObject([
                {
                    level: 'error',
                    log_source: 'insights_function',
                    log_source_id: broken.id,
                    message: expect.stringContaining('Error building inputs for event uuid:'),
                },
            ])
        })
    })

    describe('cloneInvocation', () => {
        beforeEach(() => {
            const fixedTime = DateTime.fromObject({ year: 2025, month: 1, day: 1 }, { zone: 'UTC' })
            jest.spyOn(Date, 'now').mockReturnValue(fixedTime.toMillis())
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        const invocation = createInvocation(
            {
                ...createScriptExecutionGlobals(),
                inputs: { foo: 'bar' },
            },
            createInsightsFunction({
                ...INSIGHTS_EXAMPLES.simple_fetch,
                ...INSIGHTS_INPUTS_EXAMPLES.simple_fetch,
                ...INSIGHTS_FILTERS_EXAMPLES.elements_href_filter,
            })
        )

        invocation.queueSource = 'postgres'

        it('should clone an invocation', () => {
            const cloned = cloneInvocation(invocation)
            const { id, state, insightsFunction, functionId, ...rest } = cloned
            expect(id).toBe(invocation.id)
            expect(functionId).toBe(invocation.functionId)
            expect(state).toBe(invocation.state)
            expect(insightsFunction).toBe(invocation.insightsFunction)

            expect(rest).toMatchInlineSnapshot(`
                {
                  "queue": "script",
                  "queueMetadata": undefined,
                  "queueParameters": undefined,
                  "queuePriority": 0,
                  "queueScheduledAt": undefined,
                  "queueSource": "postgres",
                  "teamId": 1,
                }
            `)
        })

        it('should allow overriding properties', () => {
            const cloned = cloneInvocation(invocation, {
                queuePriority: 1,
                queueMetadata: { foo: 'bar' },
                queueScheduledAt: DateTime.utc(),
                queueParameters: {
                    type: 'fetch',
                    url: 'https://example.com',
                    method: 'GET',
                },
            })

            const { id, state, insightsFunction, functionId, ...rest } = cloned
            expect(id).toBe(invocation.id)
            expect(functionId).toBe(invocation.functionId)
            expect(state).toBe(invocation.state)
            expect(insightsFunction).toBe(invocation.insightsFunction)

            expect(rest).toMatchInlineSnapshot(`
                {
                  "queue": "script",
                  "queueMetadata": {
                    "foo": "bar",
                  },
                  "queueParameters": {
                    "method": "GET",
                    "type": "fetch",
                    "url": "https://example.com",
                  },
                  "queuePriority": 1,
                  "queueScheduledAt": "2025-01-01T00:00:00.000Z",
                  "queueSource": "postgres",
                  "teamId": 1,
                }
            `)
        })
    })
})
