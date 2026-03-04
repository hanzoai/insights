import { mockProducerObserver } from '~/tests/helpers/mocks/producer.mock'
import { mockFetch } from '~/tests/helpers/mocks/request.mock'

import { DateTime } from 'luxon'

import { RetryError } from '@hanzo/plugin-scaffold'

import { forSnapshot } from '~/tests/helpers/snapshots'
import { getFirstTeam, resetTestDatabase } from '~/tests/helpers/sql'

import { Hub, Team } from '../../types'
import { closeHub, createHub } from '../../utils/db/hub'
import {
    insertInsightsFunction as _insertInsightsFunction,
    createExampleInvocation,
    createScriptExecutionGlobals,
} from '../_tests/fixtures'
import { DESTINATION_PLUGINS_BY_ID } from '../legacy-plugins'
import { InsightsFunctionInvocationGlobalsWithInputs, InsightsFunctionType } from '../types'
import { CdpCyclotronWorker } from './cdp-cyclotron-worker.consumer'

jest.setTimeout(1000)

/**
 * NOTE: The internal and normal events consumers are very similar so we can test them together
 */
describe('CdpCyclotronWorkerPlugins', () => {
    let processor: CdpCyclotronWorker
    let hub: Hub
    let team: Team
    let fn: InsightsFunctionType
    let globals: InsightsFunctionInvocationGlobalsWithInputs
    const insertInsightsFunction = async (insightsFunction: Partial<InsightsFunctionType>) => {
        const item = await _insertInsightsFunction(hub.postgres, team.id, {
            ...insightsFunction,
            type: 'destination',
        })
        // Trigger the reload that django would do
        processor['insightsFunctionManager']['onInsightsFunctionsReloaded'](team.id, [item.id])
        return item
    }

    const intercomPlugin = DESTINATION_PLUGINS_BY_ID['plugin-insights-intercom-plugin']

    beforeEach(async () => {
        mockFetch.mockResolvedValue({
            status: 200,
            json: () => Promise.resolve({}),
            text: () => Promise.resolve(JSON.stringify({})),
            headers: {},
            dump: () => Promise.resolve(),
        })

        await resetTestDatabase()
        hub = await createHub()

        team = await getFirstTeam(hub)
        processor = new CdpCyclotronWorker(hub)

        await processor.start()

        jest.spyOn(processor['cyclotronJobQueue']!, 'queueInvocationResults').mockImplementation(() =>
            Promise.resolve()
        )

        const fixedTime = DateTime.fromObject({ year: 2025, month: 1, day: 1 }, { zone: 'UTC' })
        jest.spyOn(Date, 'now').mockReturnValue(fixedTime.toMillis())

        fn = await insertInsightsFunction({
            name: 'Plugin test',
            template_id: 'plugin-insights-intercom-plugin',
        })
        globals = {
            ...createScriptExecutionGlobals({
                project: {
                    id: team.id,
                } as any,
                event: {
                    uuid: 'b3a1fe86-b10c-43cc-acaf-d208977608d0',
                    event: '$pageview',
                    properties: {
                        $current_url: 'https://hanzo.ai',
                        $lib_version: '1.0.0',
                        $set: {
                            email: 'test@hanzo.ai',
                        },
                    },
                    timestamp: fixedTime.toISO(),
                } as any,
            }),
            inputs: {
                intercomApiKey: '1234567890',
                triggeringEvents: '$identify,mycustomevent',
                ignoredEmailDomains: 'dev.hanzo.ai',
                useEuropeanDataStorage: 'No',
            },
        }
    })

    afterEach(async () => {
        jest.setTimeout(10000)
        await processor.stop()
        await closeHub(hub)
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    describe('onEvent', () => {
        it('should call the plugin onEvent method', async () => {
            jest.spyOn(intercomPlugin as any, 'onEvent')

            const invocation = createExampleInvocation(fn, globals)
            invocation.state.globals.event.event = 'mycustomevent'
            invocation.state.globals.event.properties = {
                email: 'test@hanzo.ai',
            }

            mockFetch.mockResolvedValue({
                status: 200,
                json: () => Promise.resolve({ total_count: 1 }),
                text: () => Promise.resolve(''),
                headers: {},
                dump: () => Promise.resolve(),
            })

            await processor.processBatch([invocation])

            expect(intercomPlugin.onEvent).toHaveBeenCalledTimes(1)
            expect(forSnapshot(jest.mocked(intercomPlugin.onEvent!).mock.calls[0][0])).toMatchInlineSnapshot(`
                {
                  "$set": undefined,
                  "$set_once": undefined,
                  "distinct_id": "distinct_id",
                  "event": "mycustomevent",
                  "ip": null,
                  "properties": {
                    "email": "test@hanzo.ai",
                  },
                  "team_id": 2,
                  "timestamp": "2025-01-01T00:00:00.000Z",
                  "uuid": "<REPLACED-UUID-0>",
                }
            `)

            expect(mockFetch).toHaveBeenCalledTimes(2)
            expect(forSnapshot(mockFetch.mock.calls[0])).toMatchInlineSnapshot(`
                [
                  "https://api.intercom.io/contacts/search",
                  {
                    "body": "{"query":{"field":"email","operator":"=","value":"test@hanzo.ai"}}",
                    "headers": {
                      "Accept": "application/json",
                      "Authorization": "Bearer 1234567890",
                      "Content-Type": "application/json",
                    },
                    "method": "POST",
                  },
                ]
            `)
            expect(forSnapshot(mockFetch.mock.calls[1])).toMatchInlineSnapshot(`
                [
                  "https://api.intercom.io/events",
                  {
                    "body": "{"event_name":"mycustomevent","created_at":null,"email":"test@hanzo.ai","id":"distinct_id"}",
                    "headers": {
                      "Accept": "application/json",
                      "Authorization": "Bearer 1234567890",
                      "Content-Type": "application/json",
                    },
                    "method": "POST",
                  },
                ]
            `)

            expect(jest.mocked(processor['cyclotronJobQueue']!.queueInvocationResults).mock.calls[0][0]).toMatchObject([
                {
                    finished: true,
                },
            ])
        })

        it('should handle and collect errors', async () => {
            jest.spyOn(intercomPlugin as any, 'onEvent')

            const invocation = createExampleInvocation(fn, globals)
            invocation.state.globals.event.event = 'mycustomevent'
            invocation.state.globals.event.properties = {
                email: 'test@hanzo.ai',
            }

            mockFetch.mockRejectedValue(new Error('Test error'))

            const { invocationResults, backgroundTask } = await processor.processBatch([invocation])
            await backgroundTask

            expect(intercomPlugin.onEvent).toHaveBeenCalledTimes(1)

            expect(invocationResults[0].error).toBeInstanceOf(Error)
            expect(forSnapshot(invocationResults[0].logs.map((x) => x.message))).toMatchInlineSnapshot(`
                [
                  "Plugin execution failed: Service is down, retry later",
                ]
            `)

            expect(jest.mocked(processor['cyclotronJobQueue']!.queueInvocationResults).mock.calls[0][0]).toMatchObject([
                {
                    finished: true,
                    error: new RetryError('Service is down, retry later'),
                },
            ])

            expect(forSnapshot(mockProducerObserver.getProducedKafkaMessages())).toMatchSnapshot()
        })
    })
})
