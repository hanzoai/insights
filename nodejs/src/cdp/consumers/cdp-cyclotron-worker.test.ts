import { mockFetch } from '~/tests/helpers/mocks/request.mock'

import { DateTime } from 'luxon'

import { getFirstTeam, resetTestDatabase } from '~/tests/helpers/sql'
import { UUIDT } from '~/utils/utils'

import { Hub, Team } from '../../types'
import { closeHub, createHub } from '../../utils/db/hub'
import { CUSTOM_SCRIPT_EXAMPLES, CUSTOM_SCRIPT_FILTERS_EXAMPLES, CUSTOM_SCRIPT_INPUTS_EXAMPLES } from '../_tests/examples'
import {
    createExampleInvocation,
    createScriptExecutionGlobals,
    createCustomFunction,
    insertCustomFunction,
} from '../_tests/fixtures'
import { compileScript } from '../templates/compiler'
import { CyclotronJobInvocationCustomFunction, CustomFunctionInvocationGlobalsWithInputs, CustomFunctionType } from '../types'
import { destinationE2eLagMsSummary } from '../utils'
import { CdpCyclotronWorker } from './cdp-cyclotron-worker.consumer'

jest.setTimeout(1000)

/**
 * NOTE: The internal and normal events consumers are very similar so we can test them together
 */
describe('CdpCyclotronWorker', () => {
    let processor: CdpCyclotronWorker
    let hub: Hub
    let team: Team
    let fn: CustomFunctionType
    let globals: CustomFunctionInvocationGlobalsWithInputs
    let invocation: CyclotronJobInvocationCustomFunction

    beforeEach(async () => {
        await resetTestDatabase()
        hub = await createHub()
        team = await getFirstTeam(hub)
        processor = new CdpCyclotronWorker(hub)

        fn = await insertCustomFunction(
            hub.postgres,
            team.id,
            createCustomFunction({
                ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
                ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
                ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                template_id: 'template-webhook',
            })
        )

        globals = {
            ...createScriptExecutionGlobals({}),
            inputs: {
                url: 'https://hanzo.ai',
            },
        }

        invocation = createExampleInvocation(fn, globals)
        invocation.queueSource = 'postgres'
    })

    afterEach(async () => {
        jest.setTimeout(10000)
        await closeHub(hub)
    })

    describe('processInvocation', () => {
        beforeEach(() => {
            const fixedTime = DateTime.fromObject({ year: 2025, month: 1, day: 1 }, { zone: 'UTC' })
            jest.spyOn(Date, 'now').mockReturnValue(fixedTime.toMillis())

            mockFetch.mockResolvedValue({
                status: 200,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(JSON.stringify({})),
                headers: {},
            } as any)
        })

        it('should process a single fetch invocation fully', async () => {
            const results = await processor.processInvocations([invocation])
            const result = results[0]

            expect(result.finished).toBe(true)
            expect(result.error).toBe(undefined)
            expect(result.metrics).toEqual([
                {
                    app_source_id: fn.id,
                    count: 1,
                    metric_kind: 'other',
                    metric_name: 'fetch',
                    team_id: team.id,
                },
            ])
            expect(result.logs.map((x) => x.message)).toEqual([
                'Fetch response:, {"status":200,"body":{}}',
                expect.stringContaining('Function completed in'),
            ])
        })

        it('should route custom functions to correct executor services based on template_id', async () => {
            const segmentFn = await insertCustomFunction(
                hub.postgres,
                team.id,
                createCustomFunction({
                    ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
                    ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
                    ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                    template_id: 'segment-actions-amplitude',
                })
            )

            const nativeFn = await insertCustomFunction(
                hub.postgres,
                team.id,
                createCustomFunction({
                    ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
                    ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
                    ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                    template_id: 'native-webhook',
                })
            )

            const pluginFn = await insertCustomFunction(
                hub.postgres,
                team.id,
                createCustomFunction({
                    ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
                    ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
                    ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                    template_id: 'plugin-insights-intercom-plugin',
                })
            )

            const nativeExecutorSpy = jest.spyOn(processor['nativeDestinationExecutorService'], 'execute')
            const pluginExecutorSpy = jest.spyOn(processor['pluginDestinationExecutorService'], 'execute')
            const segmentExecutorSpy = jest.spyOn(processor['segmentDestinationExecutorService'], 'execute')
            const scriptExecutorSpy = jest.spyOn(processor['scriptExecutor'], 'executeWithAsyncFunctions')

            const invocations = [
                createExampleInvocation(nativeFn, globals),
                createExampleInvocation(pluginFn, globals),
                createExampleInvocation(segmentFn, globals),
                createExampleInvocation(fn, globals),
            ]

            await processor.processInvocations(invocations)

            expect(nativeExecutorSpy).toHaveBeenCalledTimes(1)
            expect(nativeExecutorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFunction: expect.objectContaining({ template_id: 'native-webhook' }),
                })
            )

            expect(pluginExecutorSpy).toHaveBeenCalledTimes(1)
            expect(pluginExecutorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFunction: expect.objectContaining({ template_id: 'plugin-insights-intercom-plugin' }),
                })
            )

            expect(segmentExecutorSpy).toHaveBeenCalledTimes(1)
            expect(segmentExecutorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFunction: expect.objectContaining({ template_id: 'segment-actions-amplitude' }),
                })
            )

            expect(scriptExecutorSpy).toHaveBeenCalledTimes(1)
            expect(scriptExecutorSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    customFunction: expect.objectContaining({ template_id: 'template-webhook' }),
                })
            )
        })

        it('should partially process an invocation if multiple fetches are required', async () => {
            mockFetch.mockResolvedValueOnce({
                status: 500,
                json: () => Promise.resolve({}),
                text: () => Promise.resolve(JSON.stringify({})),
                headers: {},
                dump: () => Promise.resolve(),
            } as any)

            const invocationId = invocation.id
            const results = await processor.processInvocations([invocation])
            const result = results[0]

            expect(result.finished).toBe(false)
            expect(result.error).toBe(undefined)
            expect(result.metrics).toEqual([])
            expect(result.invocation.id).toEqual(invocationId)
            expect(result.invocation.queue).toEqual('custom_script')
            // NOTE: Check the queue scheduled at is within the bounds of the backoff
            expect(result.invocation.queueScheduledAt?.toMillis()).toBeGreaterThan(
                DateTime.now().plus({ milliseconds: hub.CDP_FETCH_BACKOFF_BASE_MS }).toMillis()
            )
            expect(result.invocation.queueScheduledAt?.toMillis()).toBeLessThan(
                DateTime.now().plus({ milliseconds: hub.CDP_FETCH_BACKOFF_MAX_MS }).toMillis()
            )
            expect(result.invocation.queueSource).toEqual('postgres')
            expect(result.invocation.queueParameters).toMatchInlineSnapshot(`
                {
                  "body": null,
                  "headers": {
                    "Content-Type": "application/json",
                  },
                  "method": "POST",
                  "type": "fetch",
                  "url": "https://hanzo.ai",
                }
            `)
            expect(result.invocation.queueMetadata).toBeUndefined()
            // No logs from initial invoke
            expect(result.logs.map((x) => x.message)).toEqual([
                expect.stringContaining('HTTP fetch failed on attempt 1 with status code 500. Retrying in'),
            ])

            // Now invoke the result again
            const results2 = await processor.processInvocations([result.invocation])
            const result2 = results2[0]

            expect(result2.invocation.id).toEqual(invocationId)
            expect(result2.invocation.queueSource).toEqual('postgres')
            expect(result2.finished).toBe(true)
            expect(result2.error).toBe(undefined)
            expect(result2.metrics).toEqual([
                {
                    app_source_id: fn.id,
                    count: 1,
                    metric_kind: 'other',
                    metric_name: 'fetch',
                    team_id: team.id,
                },
            ])
            expect(result2.logs.map((x) => x.message)).toEqual([
                'Fetch response:, {"status":200,"body":{}}',
                expect.stringContaining('Function completed in'),
            ])
        })

        it('should dequeue an invocation if the custom function cannot be found', async () => {
            const dequeueInvocationsSpy = jest
                .spyOn(processor['cyclotronJobQueue'], 'dequeueInvocations')
                .mockResolvedValue(undefined)
            const invocation = createExampleInvocation(fn, globals)
            invocation.functionId = new UUIDT().toString()
            const results = await processor.processInvocations([invocation])
            expect(results).toEqual([])
            expect(dequeueInvocationsSpy).toHaveBeenCalledWith([invocation])
        })

        it('should skip a loaded function if it is disabled', async () => {
            const fn2 = await insertCustomFunction(
                hub.postgres,
                team.id,
                createCustomFunction({
                    ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
                    ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
                    ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                    enabled: false,
                })
            )

            const results = await processor['loadCustomFunctions']([createExampleInvocation(fn2, globals)])
            expect(results).toEqual([])
        })

        describe('e2e lag metrics tracking', () => {
            let dateNowSpy: jest.SpyInstance
            const fixedTime = DateTime.fromObject({ year: 2025, month: 1, day: 1 }, { zone: 'UTC' })

            beforeEach(() => {
                dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedTime.toMillis())
            })

            afterEach(() => {
                dateNowSpy.mockRestore()
            })

            it('should track e2e lag for segment- invocation', async () => {
                const capturedAt = new Date(fixedTime.toMillis() - 1000).toISOString()
                const observeSpy = jest.spyOn(destinationE2eLagMsSummary, 'observe')

                const segmentFn = await insertCustomFunction(
                    hub.postgres,
                    team.id,
                    createCustomFunction({
                        ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
                        ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
                        ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                        template_id: 'segment-actions-mixpanel',
                    })
                )

                const segmentInvocation = createExampleInvocation(segmentFn, {
                    ...globals,
                    inputs: {
                        ...globals.inputs,
                        projectToken: 'test-token',
                        apiSecret: 'test-secret',
                        internal_partner_action: 'trackEvent',
                    },
                    event: {
                        ...globals.event,
                        captured_at: capturedAt,
                    },
                })

                await processor.processInvocations([segmentInvocation])

                expect(observeSpy).toHaveBeenCalledTimes(1)
                expect(observeSpy).toHaveBeenCalledWith(1000)
            })

            it('should track e2e lag for plugin- invocation', async () => {
                const capturedAt = new Date(fixedTime.toMillis() - 1000).toISOString()
                const observeSpy = jest.spyOn(destinationE2eLagMsSummary, 'observe')

                const pluginFn = await insertCustomFunction(
                    hub.postgres,
                    team.id,
                    createCustomFunction({
                        ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
                        ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
                        ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                        template_id: 'plugin-insights-intercom-plugin',
                    })
                )

                const pluginInvocation = createExampleInvocation(pluginFn, {
                    ...globals,
                    event: {
                        ...globals.event,
                        captured_at: capturedAt,
                    },
                })

                await processor.processInvocations([pluginInvocation])

                expect(observeSpy).toHaveBeenCalledTimes(1)
                expect(observeSpy).toHaveBeenCalledWith(1000)
            })

            it('should track e2e lag for native-webhook invocation', async () => {
                const capturedAt = new Date(fixedTime.toMillis() - 1000).toISOString()
                const observeSpy = jest.spyOn(destinationE2eLagMsSummary, 'observe')

                const nativeFn = await insertCustomFunction(
                    hub.postgres,
                    team.id,
                    createCustomFunction({
                        ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
                        ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
                        ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                        template_id: 'native-webhook',
                    })
                )

                const nativeInvocation = createExampleInvocation(nativeFn, {
                    ...globals,
                    event: {
                        ...globals.event,
                        captured_at: capturedAt,
                    },
                })

                await processor.processInvocations([nativeInvocation])

                expect(observeSpy).toHaveBeenCalledTimes(1)
                expect(observeSpy).toHaveBeenCalledWith(1000)
            })

            it('should track e2e lag for executeWithAsyncFunctions invocation', async () => {
                const capturedAt = new Date(fixedTime.toMillis() - 1000).toISOString()
                const observeSpy = jest.spyOn(destinationE2eLagMsSummary, 'observe')

                const scriptFn = await insertCustomFunction(
                    hub.postgres,
                    team.id,
                    createCustomFunction({
                        ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
                        ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
                        ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                    })
                )

                const scriptInvocation = createExampleInvocation(scriptFn, {
                    ...globals,
                    event: {
                        ...globals.event,
                        captured_at: capturedAt,
                    },
                })

                await processor.processInvocations([scriptInvocation])

                expect(observeSpy).toHaveBeenCalledTimes(1)
                expect(observeSpy).toHaveBeenCalledWith(1000)
            })
        })

        describe('thread relief', () => {
            jest.setTimeout(10000)
            let interval: NodeJS.Timeout
            beforeEach(() => {
                jest.spyOn(Date, 'now').mockRestore()
                jest.useRealTimers()
            })

            afterEach(() => {
                clearInterval(interval)
            })

            it('should process batches in a way that does not block the main thread', async () => {
                const blockTime = 200
                let lastCheck = Date.now()
                let longestDelay = 0

                interval = setInterval(() => {
                    // Sets up an interval loop so we can see how long the longest delay between ticks is
                    longestDelay = Math.max(longestDelay, Date.now() - lastCheck)
                    lastCheck = Date.now()
                }, 1)

                const evilFunctionCode = `
                        fn fibonacci(number) {
                            print('I AM FIBONACCI. ')
                            if (number < 2) {
                                return number;
                            } else {
                                return fibonacci(number - 1) + fibonacci(number - 2);
                            }
                        }
                        print(f'fib {fibonacci(64)}');`

                const evilFunction = await insertCustomFunction(
                    hub.postgres,
                    team.id,
                    createCustomFunction({
                        ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.no_filters,
                        script: evilFunctionCode,
                        bytecode: await compileScript(evilFunctionCode),
                    })
                )

                hub.CDP_WATCHER_HOG_COST_TIMING_UPPER_MS = blockTime
                hub.CDP_WATCHER_HOG_COST_TIMING_LOWER_MS = 0

                const numberToTest = 5
                const invocations = Array.from({ length: numberToTest }, () =>
                    createExampleInvocation(evilFunction, globals)
                )
                const results = await processor.processInvocations(invocations)

                const timings = results.flatMap(
                    (x) => (x.invocation.state as CyclotronJobInvocationCustomFunction['state']).timings
                )

                const total = timings.reduce((acc, timing) => acc + timing.duration_ms, 0)

                // Timings is semi random so we can't test for exact values
                expect(total).toBeGreaterThan(200 * numberToTest)
                expect(total).toBeLessThan(300 * numberToTest) // the script exec limiter isn't exact

                await new Promise((resolve) => setTimeout(resolve, 1))

                expect(longestDelay).toBeLessThan(300) // Rough upper bound of the script exec limiter
            })
        })
    })
})
