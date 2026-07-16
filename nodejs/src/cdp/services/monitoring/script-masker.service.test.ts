import { RedisV2, createRedisV2PoolFromConfig } from '~/common/redis/redis-v2'
import { InsightsFlow } from '~/schema/insightsflow'
import { Hub } from '~/types'
import { closeHub, createHub } from '~/utils/db/hub'
import { delay } from '~/utils/utils'

import { INSIGHTS_FLOW_MASK_EXAMPLES, CUSTOM_MASK_EXAMPLES } from '../../_tests/examples'
import { createExampleInvocation, createScriptExecutionGlobals, createInsightsFunction } from '../../_tests/fixtures'
import { createExampleInsightsFlowInvocation } from '../../_tests/fixtures-insightsflows'
import { deleteKeysWithPrefix } from '../../_tests/redis'
import { CyclotronJobInvocationInsightsFunction, InsightsFunctionType } from '../../types'
import { BASE_KV_KEY, ScriptMaskerService } from './script-masker.service'

const mockNow: jest.SpyInstance = jest.spyOn(Date, 'now')

describe('ScriptMasker', () => {
    jest.retryTimes(3)
    describe('integration', () => {
        let now: number
        let hub: Hub
        let masker: ScriptMaskerService
        let redis: RedisV2

        beforeEach(async () => {
            hub = await createHub()
            now = 1720000000000
            mockNow.mockReturnValue(now)

            redis = createRedisV2PoolFromConfig({
                connection: hub.CDP_KV_HOST
                    ? {
                          url: hub.CDP_KV_HOST,
                          options: { port: hub.CDP_KV_PORT, password: hub.CDP_KV_PASSWORD },
                      }
                    : { url: hub.KV_URL },
                poolMinSize: hub.KV_POOL_MIN_SIZE,
                poolMaxSize: hub.KV_POOL_MAX_SIZE,
            })
            await deleteKeysWithPrefix(redis, BASE_KV_KEY)

            masker = new ScriptMaskerService(redis)
        })

        const advanceTime = (ms: number) => {
            now += ms
            mockNow.mockReturnValue(now)
        }

        const reallyAdvanceTime = async (ms: number) => {
            advanceTime(ms)
            await delay(ms)
        }

        afterEach(async () => {
            await closeHub(hub)
            jest.clearAllMocks()
        })

        it('should return all functions without masks', async () => {
            const normalFunction = createInsightsFunction({})
            const invocations = [createExampleInvocation(normalFunction)]
            const res = await masker.filterByMasking(invocations)

            expect(res.notMasked).toHaveLength(1)
            expect(res.masked).toEqual([])
        })

        it('supports custom flow invocations without trigger_masking', async () => {
            const insightsFlow: InsightsFlow = {
                id: 'flow_1',
                team_id: 1,
                name: 'Test Flow',
                version: 1,
                actions: [],
                status: 'active',
                trigger: {
                    type: 'event',
                    filters: {
                        events: [],
                    },
                },
                trigger_masking: null,
                exit_condition: 'exit_only_at_end',
                edges: [],
            }
            const invocation = createExampleInsightsFlowInvocation(insightsFlow)
            const res = await masker.filterByMasking([invocation])
            expect(res.notMasked).toHaveLength(1)
            expect(res.masked).toHaveLength(0)
        })

        it('should only allow one invocation call when masked for one function', async () => {
            const functionWithAllMasking = createInsightsFunction({
                ...CUSTOM_MASK_EXAMPLES.all,
            })

            const invocation1 = createExampleInvocation(
                functionWithAllMasking,
                createScriptExecutionGlobals({ event: { uuid: '1' } as any })
            )
            const invocation2 = createExampleInvocation(
                functionWithAllMasking,
                createScriptExecutionGlobals({ event: { uuid: '2' } as any })
            )
            const invocation3 = createExampleInvocation(
                functionWithAllMasking,
                createScriptExecutionGlobals({ event: { uuid: '3' } as any })
            )
            const invocations = [invocation1, invocation2, invocation3]

            const res = await masker.filterByMasking(invocations)
            expect(res.notMasked).toHaveLength(1)
            expect(res.masked).toHaveLength(2)
            expect(res.notMasked[0].state?.globals).toEqual(invocation1.state.globals)
            expect(res.masked[0].state?.globals).toEqual(invocation2.state.globals)
            expect(res.masked[1].state?.globals).toEqual(invocation3.state.globals)

            const res2 = await masker.filterByMasking(invocations)
            expect(res2.notMasked).toHaveLength(0)
            expect(res2.masked).toHaveLength(3)
        })

        it('allow multiple functions for the same globals', async () => {
            const functionWithAllMasking = createInsightsFunction({
                ...CUSTOM_MASK_EXAMPLES.all,
            })
            const functionWithAllMasking2 = createInsightsFunction({
                ...CUSTOM_MASK_EXAMPLES.all,
            })
            const functionWithNoMasking = createInsightsFunction({})
            const globals = createScriptExecutionGlobals()
            const invocations = [
                createExampleInvocation(functionWithAllMasking, globals),
                createExampleInvocation(functionWithAllMasking2, globals),
                createExampleInvocation(functionWithNoMasking, globals),
            ]

            const res = await masker.filterByMasking(invocations)
            expect(res.notMasked).toHaveLength(3)
            expect(res.masked).toHaveLength(0)

            const res2 = await masker.filterByMasking(invocations)
            expect(res2.notMasked).toHaveLength(1)
            expect(res2.masked).toHaveLength(2)
            expect((res2.notMasked[0] as CyclotronJobInvocationInsightsFunction).insightsFunction).toEqual(functionWithNoMasking)
            expect((res2.masked[0] as CyclotronJobInvocationInsightsFunction).insightsFunction).toEqual(functionWithAllMasking)
            expect((res2.masked[1] as CyclotronJobInvocationInsightsFunction).insightsFunction).toEqual(functionWithAllMasking2)
        })

        describe('ttl', () => {
            let insightsFunctionPerson: InsightsFunctionType
            let insightsFunctionAll: InsightsFunctionType
            let insightsFunctionPersonAndEvent: InsightsFunctionType

            beforeEach(() => {
                insightsFunctionPerson = createInsightsFunction({
                    masking: {
                        ...CUSTOM_MASK_EXAMPLES.person.masking!,
                        ttl: 1,
                    },
                })

                insightsFunctionPersonAndEvent = createInsightsFunction({
                    masking: {
                        ...CUSTOM_MASK_EXAMPLES.personAndEvent.masking!,
                        ttl: 1,
                    },
                })

                insightsFunctionAll = createInsightsFunction({
                    masking: {
                        ...CUSTOM_MASK_EXAMPLES.all.masking!,
                        ttl: 1,
                    },
                })
            })
            it('should re-allow after the ttl expires', async () => {
                const invocations = [createExampleInvocation(insightsFunctionAll)]
                expect((await masker.filterByMasking(invocations)).notMasked).toHaveLength(1)
                expect((await masker.filterByMasking(invocations)).notMasked).toHaveLength(0)
                expect((await masker.filterByMasking(invocations)).notMasked).toHaveLength(0)
                await reallyAdvanceTime(1000)
                expect((await masker.filterByMasking(invocations)).notMasked).toHaveLength(1)
                expect((await masker.filterByMasking(invocations)).notMasked).toHaveLength(0)
            })

            it('should mask with custom script hash', async () => {
                const globals1 = createScriptExecutionGlobals({
                    person: { id: '1' } as any,
                    event: { event: '$pageview' } as any,
                })
                const globals2 = createScriptExecutionGlobals({
                    person: { id: '2' } as any,
                    event: { event: '$autocapture' } as any,
                })
                const globals3 = createScriptExecutionGlobals({
                    person: { id: '2' } as any,
                    event: { event: '$pageview' } as any,
                })

                const invocations = [
                    createExampleInvocation(insightsFunctionPerson, globals1),
                    createExampleInvocation(insightsFunctionAll, globals1),
                    createExampleInvocation(insightsFunctionPersonAndEvent, globals1),
                    createExampleInvocation(insightsFunctionPerson, globals2),
                    createExampleInvocation(insightsFunctionAll, globals2),
                    createExampleInvocation(insightsFunctionPersonAndEvent, globals2),
                    createExampleInvocation(insightsFunctionPersonAndEvent, globals3),
                ]
                const res = await masker.filterByMasking(invocations)
                expect(res.masked.length).toEqual(1)
                expect(res.notMasked.length).toEqual(6)
                const res2 = await masker.filterByMasking(invocations)
                expect(res2.masked.length).toEqual(7)
                expect(res2.notMasked.length).toEqual(0)
            })

            it('should mask until threshold passed', async () => {
                insightsFunctionAll.masking!.threshold = 5

                const invocation = createExampleInvocation(insightsFunctionAll)
                // First one goes through
                expect((await masker.filterByMasking([invocation])).notMasked).toHaveLength(1)

                // Next 4 should be masked
                expect((await masker.filterByMasking([invocation])).notMasked).toHaveLength(0)
                expect((await masker.filterByMasking([invocation])).notMasked).toHaveLength(0)
                expect((await masker.filterByMasking([invocation])).notMasked).toHaveLength(0)
                expect((await masker.filterByMasking([invocation])).notMasked).toHaveLength(0)
                // Now we have hit the threshold so it should not be masked
                expect((await masker.filterByMasking([invocation])).notMasked).toHaveLength(1)
                // Next 4 should be masked
                expect((await masker.filterByMasking([invocation])).notMasked).toHaveLength(0)
                expect((await masker.filterByMasking([invocation])).notMasked).toHaveLength(0)
                expect((await masker.filterByMasking([invocation])).notMasked).toHaveLength(0)
                expect((await masker.filterByMasking([invocation])).notMasked).toHaveLength(0)
                // Again the Nth one shouldn't be masked
                expect((await masker.filterByMasking([invocation])).notMasked).toHaveLength(1)
            })

            it('should mask threshold based in a batch', async () => {
                insightsFunctionAll.masking!.threshold = 5
                insightsFunctionAll.masking!.ttl = 10

                // If we have 10 invocations in a batch then we should have 2 invocations that are not masked
                expect(
                    (await masker.filterByMasking(Array(10).fill(createExampleInvocation(insightsFunctionAll)))).notMasked
                ).toHaveLength(2)

                // Next one should cross the threshold
                expect(
                    (await masker.filterByMasking([createExampleInvocation(insightsFunctionAll)])).notMasked
                ).toHaveLength(1)
            })

            describe('ttl constraints', () => {
                const getRedisKeyTtl = async (): Promise<number> => {
                    const keys = await redis.useClient({ name: 'test-keys' }, async (client) => {
                        return await client.keys(`${BASE_KV_KEY}/mask/*`)
                    })
                    expect(keys?.length).toBe(1)
                    const ttl = await redis.useClient({ name: 'test-ttl' }, async (client) => {
                        return await client.ttl(keys![0])
                    })
                    return ttl!
                }

                const expectTtlNear = (ttl: number, expected: number) => {
                    expect(ttl).toBeLessThanOrEqual(expected)
                    expect(ttl).toBeGreaterThan(expected - 10)
                }

                const oneDaySeconds = 60 * 60 * 24
                const threeYearsSeconds = 60 * 60 * 24 * 365 * 3

                describe('custom functions', () => {
                    it('should default to 1 day when ttl is null', async () => {
                        const insightsFunction = createInsightsFunction({
                            masking: {
                                ...CUSTOM_MASK_EXAMPLES.all.masking!,
                                ttl: null,
                            },
                        })

                        await masker.filterByMasking([createExampleInvocation(insightsFunction)])
                        expectTtlNear(await getRedisKeyTtl(), oneDaySeconds)
                    })

                    it('should cap at 1 day max', async () => {
                        const insightsFunction = createInsightsFunction({
                            masking: {
                                ...CUSTOM_MASK_EXAMPLES.all.masking!,
                                ttl: 60 * 60 * 24 * 365, // 1 year
                            },
                        })

                        await masker.filterByMasking([createExampleInvocation(insightsFunction)])
                        expectTtlNear(await getRedisKeyTtl(), oneDaySeconds)
                    })
                })

                describe('custom flows', () => {
                    const createFlowWithTtl = (ttl: number | null): InsightsFlow => ({
                        id: `flow_${ttl}`,
                        team_id: 1,
                        name: 'Test Flow',
                        version: 1,
                        actions: [],
                        status: 'active',
                        trigger: {
                            type: 'event',
                            filters: {
                                events: [],
                            },
                        },
                        trigger_masking: {
                            ...INSIGHTS_FLOW_MASK_EXAMPLES.onceEver.trigger_masking!,
                            ttl,
                        },
                        exit_condition: 'exit_only_at_end',
                        edges: [],
                    })

                    it('should default to 3 years when ttl is null', async () => {
                        const insightsFlow = createFlowWithTtl(null)
                        await masker.filterByMasking([createExampleInsightsFlowInvocation(insightsFlow)])
                        expectTtlNear(await getRedisKeyTtl(), threeYearsSeconds)
                    })

                    it('should cap at 3 years when set to a higher value', async () => {
                        const insightsFlow = createFlowWithTtl(60 * 60 * 24 * 365 * 10) // 10 years
                        await masker.filterByMasking([createExampleInsightsFlowInvocation(insightsFlow)])
                        expectTtlNear(await getRedisKeyTtl(), threeYearsSeconds)
                    })
                })
            })

            describe('custom flow trigger masking', () => {
                let insightsFlowEvery: InsightsFlow
                let insightsFlowOncePer: InsightsFlow
                let insightsFlowOnceEver: InsightsFlow

                beforeEach(() => {
                    const base: Partial<InsightsFlow> = {
                        team_id: 1,
                        name: 'Mask Flow',
                        version: 1,
                        actions: [],
                        status: 'active',
                        trigger: {
                            type: 'event',
                            filters: {
                                events: [],
                            },
                        },
                        exit_condition: 'exit_only_at_end',
                        edges: [],
                    }

                    insightsFlowEvery = {
                        ...base,
                        id: 'hf_every',
                        trigger_masking: { ...INSIGHTS_FLOW_MASK_EXAMPLES.everyTime.trigger_masking },
                    } as InsightsFlow
                    insightsFlowOncePer = {
                        ...base,
                        id: 'hf_once_per',
                        trigger_masking: { ...INSIGHTS_FLOW_MASK_EXAMPLES.oncePerTimePeriod.trigger_masking, ttl: 1 },
                    } as InsightsFlow
                    insightsFlowOnceEver = {
                        ...base,
                        id: 'hf_once_ever',
                        trigger_masking: { ...INSIGHTS_FLOW_MASK_EXAMPLES.onceEver.trigger_masking },
                    } as InsightsFlow
                })

                it('allows only one custom flow invocation per masking hash per ttl', async () => {
                    const inv1 = createExampleInsightsFlowInvocation(insightsFlowEvery)
                    const inv2 = createExampleInsightsFlowInvocation(insightsFlowEvery)
                    const inv3 = createExampleInsightsFlowInvocation(insightsFlowEvery)
                    const batch = [inv1, inv2, inv3]
                    const res = await masker.filterByMasking(batch)
                    expect(res.notMasked).toHaveLength(1)
                    expect(res.masked).toHaveLength(2)
                })

                it('resets after ttl for custom flow trigger masking', async () => {
                    const inv = createExampleInsightsFlowInvocation(insightsFlowOncePer)
                    expect((await masker.filterByMasking([inv])).notMasked).toHaveLength(1)
                    expect((await masker.filterByMasking([inv])).masked).toHaveLength(1)
                    await reallyAdvanceTime(1000)
                    expect((await masker.filterByMasking([inv])).notMasked).toHaveLength(1)
                    expect((await masker.filterByMasking([inv])).masked).toHaveLength(1)
                })

                it('uses threshold for onceEver flow trigger masking', async () => {
                    const inv = createExampleInsightsFlowInvocation(insightsFlowOnceEver)
                    expect((await masker.filterByMasking([inv])).notMasked).toHaveLength(1)
                    expect((await masker.filterByMasking([inv])).masked).toHaveLength(1)
                    expect((await masker.filterByMasking([inv])).masked).toHaveLength(1)
                })
            })
        })
    })
})
