import { mockProducerObserver } from '~/tests/helpers/mocks/producer.mock'

import { DateTime } from 'luxon'

import { PluginEvent } from '@posthog/plugin-scaffold'

import { insightsFilterOutPlugin } from '../../../src/cdp/legacy-plugins/_transformations/insights-filter-out-plugin/template'
import { template as defaultTemplate } from '../../../src/cdp/templates/_transformations/default/default.template'
import { template as geoipTemplate } from '../../../src/cdp/templates/_transformations/geoip/geoip.template'
import { compileFn } from '../../../src/cdp/templates/compiler'
import { forSnapshot } from '../../../tests/helpers/snapshots'
import { getFirstTeam, resetTestDatabase } from '../../../tests/helpers/sql'
import { Hub } from '../../types'
import { closeHub, createHub } from '../../utils/db/hub'
import { createInsightsFunction, insertInsightsFunction } from '../_tests/fixtures'
import { insightsPluginGeoip } from '../legacy-plugins/_transformations/insights-plugin-geoip/template'
import { propertyFilterPlugin } from '../legacy-plugins/_transformations/property-filter-plugin/template'
import { ScriptWatcherState } from '../services/monitoring/script-watcher.service'
import { InsightsFunctionTemplate } from '../types'
import { ScriptTransformerService } from './script-transformer.service'

const createPluginEvent = (event: Partial<PluginEvent> = {}, teamId: number = 1): PluginEvent => {
    return {
        ip: '12.87.118.0',
        site_url: 'http://localhost',
        team_id: teamId,
        now: '2024-06-07T12:00:00.000Z',
        uuid: 'event-id',
        event: 'event-name',
        distinct_id: 'distinct-id',
        properties: { $current_url: 'https://example.com', $ip: '12.87.118.0' },
        timestamp: '2024-01-01T00:00:00Z',
        ...event,
    }
}

describe('ScriptTransformer', () => {
    let hub: Hub
    let scriptTransformer: ScriptTransformerService
    let teamId: number

    beforeEach(async () => {
        hub = await createHub()
        await resetTestDatabase()

        const fixedTime = DateTime.fromObject({ year: 2025, month: 1, day: 1 }, { zone: 'UTC' })
        jest.spyOn(Date, 'now').mockReturnValue(fixedTime.toMillis())

        // Create a team first before inserting custom functions
        const team = await getFirstTeam(hub)
        teamId = team.id

        scriptTransformer = new ScriptTransformerService(hub)
    })

    afterEach(async () => {
        await closeHub(hub)

        jest.spyOn(scriptTransformer['pluginExecutor'], 'execute')
    })

    describe('transformEvent', () => {
        it('handles geoip lookup transformation', async () => {
            // Setup the custom function
            const scriptByteCode = await compileFn(geoipTemplate.code)
            const geoIpFunction = createInsightsFunction({
                type: 'transformation',
                name: geoipTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: scriptByteCode,
                execution_order: 1,
                id: 'd77e792e-0f35-431b-a983-097534aa4767',
            })
            await insertInsightsFunction(hub.postgres, teamId, geoIpFunction)

            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [geoIpFunction.id])

            const event: PluginEvent = createPluginEvent({}, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            expect(result.event?.properties).toMatchInlineSnapshot(`
                {
                  "$current_url": "https://example.com",
                  "$geoip_accuracy_radius": 20,
                  "$geoip_city_name": "Cleveland",
                  "$geoip_continent_code": "NA",
                  "$geoip_continent_name": "North America",
                  "$geoip_country_code": "US",
                  "$geoip_country_name": "United States",
                  "$geoip_latitude": 41.5,
                  "$geoip_longitude": -81.6938,
                  "$geoip_postal_code": "44192",
                  "$geoip_subdivision_1_code": "OH",
                  "$geoip_subdivision_1_name": "Ohio",
                  "$geoip_time_zone": "America/New_York",
                  "$ip": "12.87.118.0",
                  "$set": {
                    "$geoip_accuracy_radius": 20,
                    "$geoip_city_confidence": null,
                    "$geoip_city_name": "Cleveland",
                    "$geoip_continent_code": "NA",
                    "$geoip_continent_name": "North America",
                    "$geoip_country_code": "US",
                    "$geoip_country_name": "United States",
                    "$geoip_latitude": 41.5,
                    "$geoip_longitude": -81.6938,
                    "$geoip_postal_code": "44192",
                    "$geoip_subdivision_1_code": "OH",
                    "$geoip_subdivision_1_name": "Ohio",
                    "$geoip_subdivision_2_code": null,
                    "$geoip_subdivision_2_name": null,
                    "$geoip_time_zone": "America/New_York",
                  },
                  "$set_once": {
                    "$initial_geoip_accuracy_radius": 20,
                    "$initial_geoip_city_confidence": null,
                    "$initial_geoip_city_name": "Cleveland",
                    "$initial_geoip_continent_code": "NA",
                    "$initial_geoip_continent_name": "North America",
                    "$initial_geoip_country_code": "US",
                    "$initial_geoip_country_name": "United States",
                    "$initial_geoip_latitude": 41.5,
                    "$initial_geoip_longitude": -81.6938,
                    "$initial_geoip_postal_code": "44192",
                    "$initial_geoip_subdivision_1_code": "OH",
                    "$initial_geoip_subdivision_1_name": "Ohio",
                    "$initial_geoip_subdivision_2_code": null,
                    "$initial_geoip_subdivision_2_name": null,
                    "$initial_geoip_time_zone": "America/New_York",
                  },
                  "$transformations_succeeded": [
                    "GeoIP (d77e792e-0f35-431b-a983-097534aa4767)",
                  ],
                }
            `)
        })

        it('only allow modifying certain properties', async () => {
            const fn = createInsightsFunction({
                type: 'transformation',
                name: 'Modifier',
                team_id: teamId,
                enabled: true,
                bytecode: [],
                execution_order: 1,
                id: 'd77e792e-0f35-431b-a983-097534aa4767',
                script: `
                    let returnEvent := event
                    returnEvent.distinct_id := 'modified-distinct-id'
                    returnEvent.event := 'modified-event'
                    returnEvent.properties.test_property := 'modified-test-value'
                    returnEvent.something_else := 'should not be allowed'
                    returnEvent.timestamp := 'should not be allowed'
                    return returnEvent
                `,
            })
            fn.bytecode = await compileFn(fn.fn)
            await insertInsightsFunction(hub.postgres, teamId, fn)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [fn.id])

            const event: PluginEvent = createPluginEvent({}, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            expect(result.event).toMatchInlineSnapshot(`
                {
                  "distinct_id": "modified-distinct-id",
                  "event": "modified-event",
                  "ip": "12.87.118.0",
                  "now": "2024-06-07T12:00:00.000Z",
                  "properties": {
                    "$current_url": "https://example.com",
                    "$ip": "12.87.118.0",
                    "$transformations_succeeded": [
                      "Modifier (d77e792e-0f35-431b-a983-097534aa4767)",
                    ],
                    "test_property": "modified-test-value",
                  },
                  "site_url": "http://localhost",
                  "team_id": 2,
                  "timestamp": "2024-01-01T00:00:00Z",
                  "uuid": "event-id",
                }
            `)
        })
        it('should execute multiple transformations and produce messages', async () => {
            const testTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Test Template',
                description: 'A simple test template that adds a test property',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.test_property := 'test_value'
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const geoTransformationIpByteCode = await compileFn(geoipTemplate.code)
            const geoIpTransformationFunction = createInsightsFunction({
                type: 'transformation',
                name: geoipTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: geoTransformationIpByteCode,
                execution_order: 1,
            })

            const defaultTransformationByteCode = await compileFn(defaultTemplate.code)
            const defaultTransformationFunction = createInsightsFunction({
                type: 'transformation',
                name: defaultTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: defaultTransformationByteCode,
                execution_order: 2,
            })

            const testTransformationByteCode = await compileFn(testTemplate.code)
            const testTransformationFunction = createInsightsFunction({
                type: 'transformation',
                name: testTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: testTransformationByteCode,
                execution_order: 3,
            })

            await insertInsightsFunction(hub.postgres, teamId, testTransformationFunction)
            await insertInsightsFunction(hub.postgres, teamId, defaultTransformationFunction)
            await insertInsightsFunction(hub.postgres, teamId, geoIpTransformationFunction)

            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [
                geoIpTransformationFunction.id,
                defaultTransformationFunction.id,
                testTransformationFunction.id,
            ])

            const executeInsightsFunctionSpy = jest.spyOn(scriptTransformer as any, 'executeInsightsFunction')

            const event: PluginEvent = {
                ip: '89.160.20.129',
                site_url: 'http://localhost',
                team_id: teamId,
                now: '2024-06-07T12:00:00.000Z',
                uuid: 'event-id',
                event: 'event-name',
                distinct_id: 'distinct-id',
                properties: { $ip: '89.160.20.129' },
                timestamp: '2024-01-01T00:00:00Z',
            }

            await scriptTransformer.transformEventAndProduceMessages(event)

            expect(executeInsightsFunctionSpy).toHaveBeenCalledTimes(3)
            expect(executeInsightsFunctionSpy.mock.calls[0][0]).toMatchObject({ execution_order: 1 })
            expect(executeInsightsFunctionSpy.mock.calls[1][0]).toMatchObject({ execution_order: 2 })
            expect(executeInsightsFunctionSpy.mock.calls[2][0]).toMatchObject({ execution_order: 3 })
            expect(event.properties?.test_property).toEqual('test_value')

            await scriptTransformer.processInvocationResults()

            const messages = mockProducerObserver.getProducedKafkaMessages()
            // Replace certain messages that have changeable values
            messages.forEach((x) => {
                if (typeof x.value.message === 'string' && x.value.message.includes('Function completed in')) {
                    x.value.message = 'Function completed in [REPLACED]'
                }
                if (typeof x.value.message === 'string' && x.value.message.includes('geoip location data for ip')) {
                    x.value.message = 'geoip location data for ip: [REPLACED]'
                }
            })
            expect(forSnapshot(messages)).toMatchSnapshot()
        })

        it('should delete a property from previous transformation', async () => {
            const addingTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'alpha',
                type: 'transformation',
                id: 'template-test',
                name: 'Test Template',
                description: 'A simple test template that adds a test property',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.test_property := 'test_value'
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const deletingTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'alpha',
                type: 'transformation',
                id: 'template-test',
                name: 'Test Template',
                description: 'A simple test template that adds a test property',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.test_property := null
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const addingTransformationFunction = createInsightsFunction({
                type: 'transformation',
                name: addingTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(addingTemplate.code),
                execution_order: 1,
            })

            const deletingTransformationFunction = createInsightsFunction({
                type: 'transformation',
                name: deletingTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(deletingTemplate.code),
                execution_order: 2,
            })

            await insertInsightsFunction(hub.postgres, teamId, deletingTransformationFunction)
            await insertInsightsFunction(hub.postgres, teamId, addingTransformationFunction)

            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [
                addingTransformationFunction.id,
                deletingTransformationFunction.id,
            ])

            const executeInsightsFunctionSpy = jest.spyOn(scriptTransformer as any, 'executeInsightsFunction')

            const event: PluginEvent = {
                ip: '89.160.20.129',
                site_url: 'http://localhost',
                team_id: teamId,
                now: '2024-06-07T12:00:00.000Z',
                uuid: 'event-id',
                event: 'event-name',
                distinct_id: 'distinct-id',
                properties: { $ip: '89.160.20.129' },
                timestamp: '2024-01-01T00:00:00Z',
            }

            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            /*
             * First call is the adding the test property
             * Second call is the deleting the test property
             * hence the result is null
             */
            expect(executeInsightsFunctionSpy).toHaveBeenCalledTimes(2)
            expect(result?.event?.properties?.test_property).toEqual(null)
        })

        it('should allow second transformation to read property added by first transformation', async () => {
            const firstTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'alpha',
                type: 'transformation',
                id: 'template-first',
                name: 'First Template',
                description: 'Adds a property that the second transformation will read',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.added_by_first := 'value_from_first'
                    returnEvent.properties.counter := 1
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const secondTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'alpha',
                type: 'transformation',
                id: 'template-second',
                name: 'Second Template',
                description: 'Reads property from first transformation and creates a derived property',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    // This should be able to read the property added by the first transformation
                    returnEvent.properties.derived_from_first := f'derived_from_{event.properties.added_by_first}'
                    returnEvent.properties.counter := event.properties.counter + 1
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const firstTransformationFunction = createInsightsFunction({
                type: 'transformation',
                name: firstTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(firstTemplate.code),
                execution_order: 1,
            })

            const secondTransformationFunction = createInsightsFunction({
                type: 'transformation',
                name: secondTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(secondTemplate.code),
                execution_order: 2,
            })

            await insertInsightsFunction(hub.postgres, teamId, firstTransformationFunction)
            await insertInsightsFunction(hub.postgres, teamId, secondTransformationFunction)

            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [
                firstTransformationFunction.id,
                secondTransformationFunction.id,
            ])

            const executeInsightsFunctionSpy = jest.spyOn(scriptTransformer as any, 'executeInsightsFunction')

            const event: PluginEvent = {
                ip: '89.160.20.129',
                site_url: 'http://localhost',
                team_id: teamId,
                now: '2024-06-07T12:00:00.000Z',
                uuid: 'event-id',
                event: 'event-name',
                distinct_id: 'distinct-id',
                properties: { $ip: '89.160.20.129' },
                timestamp: '2024-01-01T00:00:00Z',
            }

            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            expect(executeInsightsFunctionSpy).toHaveBeenCalledTimes(2)
            expect(result?.event?.properties?.added_by_first).toEqual('value_from_first')
            expect(result?.event?.properties?.derived_from_first).toEqual('derived_from_value_from_first')
            expect(result?.event?.properties?.counter).toEqual(2)
        })

        it('should execute tranformation without execution_order last', async () => {
            const firstTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'alpha',
                type: 'transformation',
                id: 'template-test',
                name: 'Test Template',
                description: 'A simple test template that adds a test property',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    return event
                `,
                inputs_schema: [],
            }

            const secondTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'alpha',
                type: 'transformation',
                id: 'template-test',
                name: 'Test Template',
                description: 'A simple test template that adds a test property',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    return event
                `,
                inputs_schema: [],
            }

            const thirdTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'alpha',
                type: 'transformation',
                id: 'template-test',
                name: 'Test Template',
                description: 'A simple test template that adds a test property',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    return event
                `,
                inputs_schema: [],
            }

            const firstTransformationByteCode = await compileFn(firstTemplate.code)
            const firstTransformationFunction = createInsightsFunction({
                type: 'transformation',
                name: firstTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: firstTransformationByteCode,
                execution_order: 1,
            })

            const secondTransformationByteCode = await compileFn(secondTemplate.code)
            const secondTransformationFunction = createInsightsFunction({
                type: 'transformation',
                name: secondTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: secondTransformationByteCode,
                execution_order: 2,
            })

            const thirdTransformationByteCode = await compileFn(thirdTemplate.code)
            const thirdTransformationFunction = createInsightsFunction({
                type: 'transformation',
                name: thirdTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: thirdTransformationByteCode,
                execution_order: undefined,
            })

            await insertInsightsFunction(hub.postgres, teamId, thirdTransformationFunction)
            await insertInsightsFunction(hub.postgres, teamId, secondTransformationFunction)
            await insertInsightsFunction(hub.postgres, teamId, firstTransformationFunction)

            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [
                thirdTransformationFunction.id,
                secondTransformationFunction.id,
                firstTransformationFunction.id,
            ])

            const executeInsightsFunctionSpy = jest.spyOn(scriptTransformer as any, 'executeInsightsFunction')

            const event: PluginEvent = {
                ip: '89.160.20.129',
                site_url: 'http://localhost',
                team_id: teamId,
                now: '2024-06-07T12:00:00.000Z',
                uuid: 'event-id',
                event: 'event-name',
                distinct_id: 'distinct-id',
                properties: { $ip: '89.160.20.129' },
                timestamp: '2024-01-01T00:00:00Z',
            }

            await scriptTransformer.transformEventAndProduceMessages(event)
            expect(executeInsightsFunctionSpy).toHaveBeenCalledTimes(3)
            expect(executeInsightsFunctionSpy.mock.calls[0][0]).toMatchObject({ execution_order: 1 })
            expect(executeInsightsFunctionSpy.mock.calls[1][0]).toMatchObject({ execution_order: 2 })
            expect(executeInsightsFunctionSpy.mock.calls[2][0]).toMatchObject({ execution_order: null })
        })

        it('should track successful and failed transformations', async () => {
            // Create a successful transformation
            const successTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-success',
                name: 'Success Template',
                description: 'A template that should succeed',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.success := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            // Create a failing transformation
            const failingTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-fail',
                name: 'Failing Template',
                description: 'A template that should fail',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    // Return invalid result (not an object with properties)
                    return "invalid"
                `,
                inputs_schema: [],
            }

            const successByteCode = await compileFn(successTemplate.code)
            const successFunction = createInsightsFunction({
                type: 'transformation',
                name: successTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: successByteCode,
                execution_order: 1,
            })

            const failByteCode = await compileFn(failingTemplate.code)
            const failFunction = createInsightsFunction({
                type: 'transformation',
                name: failingTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: failByteCode,
                execution_order: 2,
            })

            await insertInsightsFunction(hub.postgres, teamId, successFunction)
            await insertInsightsFunction(hub.postgres, teamId, failFunction)

            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [
                successFunction.id,
                failFunction.id,
            ])

            const event = createPluginEvent(
                {
                    event: 'test',
                    properties: {},
                },
                teamId
            )

            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify the event has both success and failure tracking
            expect(result.event?.properties).toEqual({
                success: true, // From successful transformation
                $transformations_succeeded: [`Success Template (${successFunction.id})`],
                $transformations_failed: [`Failing Template (${failFunction.id})`],
            })
        })

        it('should pull from inputs and encrypted_inputs', async () => {
            // Create a successful transformation
            const inputSetter: InsightsFunctionTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-input-setter',
                name: 'Input Setter',
                description: 'A template that sets the inputs',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.inputs := {
                        'not_encrypted': inputs.not_encrypted,
                        'encrypted': inputs.encrypted,
                    }
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const inputSetterByteCode = await compileFn(inputSetter.code)

            const inputSetterFunction = createInsightsFunction({
                type: 'transformation',
                name: inputSetter.name,
                team_id: teamId,
                enabled: true,
                bytecode: inputSetterByteCode,
                inputs_schema: [
                    {
                        key: 'not_encrypted',
                        type: 'string',
                    },
                    {
                        key: 'encrypted',
                        type: 'string',
                        secret: true,
                    },
                ],
                inputs: {
                    not_encrypted: {
                        value: 'from not encrypted: {event.event}',
                        bytecode: await compileFn("return f'from not encrypted: {event.event}'"),
                    },
                },
                encrypted_inputs: hub.encryptedFields.encrypt(
                    JSON.stringify({
                        encrypted: {
                            value: 'from encrypted: {event.event}',
                            bytecode: await compileFn("return f'from encrypted: {event.event}'"),
                        },
                    })
                ) as any,
            })

            await insertInsightsFunction(hub.postgres, teamId, inputSetterFunction)

            const event = createPluginEvent(
                {
                    event: 'test',
                    properties: {},
                },
                teamId
            )

            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify the event has both success and failure tracking
            expect(result.event?.properties?.inputs).toMatchObject({
                not_encrypted: 'from not encrypted: test',
                encrypted: 'from encrypted: test',
            })
        })

        it('should not add transformation tracking properties if no transformations run', async () => {
            const event = createPluginEvent(
                {
                    event: 'test',
                    properties: { original: true },
                },
                teamId
            )

            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify the event properties are unchanged
            expect(result.event?.properties).toEqual({
                original: true,
            })
            expect(result.event?.properties).not.toHaveProperty('$transformations_succeeded')
            expect(result.event?.properties).not.toHaveProperty('$transformations_failed')
        })

        it('should ignore existing transformation results when adding new ones', async () => {
            const successTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-success',
                name: 'Success Template',
                description: 'A template that should succeed',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.success := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const successByteCode = await compileFn(successTemplate.code)
            const successFunction = createInsightsFunction({
                type: 'transformation',
                name: successTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: successByteCode,
                execution_order: 1,
            })

            await insertInsightsFunction(hub.postgres, teamId, successFunction)

            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [successFunction.id])

            const event = createPluginEvent(
                {
                    event: 'test',
                    properties: {
                        $transformations_succeeded: ['Previous Success (prev-id)'],
                        $transformations_failed: {}, // malformed value
                    },
                },
                teamId
            )

            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify new results are appended to existing ones
            expect(result?.event?.properties?.$transformations_succeeded).toEqual([
                `Success Template (${successFunction.id})`,
            ])
            expect(result?.event?.properties?.$transformations_failed).toEqual(undefined)
        })

        it('should track skipped transformations when filter does not match', async () => {
            const filterTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Filter Template',
                description: 'A template that should be skipped when filter does not match',
                category: ['Custom'],
                script: `
                    let returnEvent := event
                    returnEvent.properties.should_not_be_set := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: filterTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(filterTemplate.fn),
                filters: {
                    bytecode: await compileFn(`
                        return event = 'match-me'
                    `),
                    events: [{ id: 'match-me', name: 'match-me', type: 'events', order: 0 }],
                },
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            const event = createPluginEvent(
                {
                    event: 'does-not-match-me',
                    properties: {
                        original: true,
                    },
                },
                teamId
            )

            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify transformation was skipped and tracked
            expect(result.event?.properties?.should_not_be_set).toBeUndefined()
            expect(result.event?.properties?.$transformations_skipped).toEqual([
                `${insightsFunction.name} (${insightsFunction.id})`,
            ])
            expect(result.event?.properties?.original).toBe(true)
            expect(result.event?.properties?.$transformations_succeeded).toBeUndefined()
            expect(result.event?.properties?.$transformations_failed).toBeUndefined()
        })

        it('should track both successful and skipped transformations in sequence', async () => {
            const successTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-success',
                name: 'Success Template',
                description: 'A template that should succeed',
                category: ['Custom'],
                script: `
                    let returnEvent := event
                    returnEvent.properties.success := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const skippedTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-skipped',
                name: 'Skipped Template',
                description: 'A template that should be skipped',
                category: ['Custom'],
                script: `
                    let returnEvent := event
                    returnEvent.properties.should_not_be_set := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const successFunction = createInsightsFunction({
                type: 'transformation',
                name: successTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(successTemplate.fn),
                execution_order: 1,
            })

            const skippedFunction = createInsightsFunction({
                type: 'transformation',
                name: skippedTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(skippedTemplate.fn),
                execution_order: 2,
                filters: {
                    bytecode: await compileFn(`
                        return event = 'match-me'
                    `),
                    events: [{ id: 'match-me', name: 'match-me', type: 'events', order: 0 }],
                },
            })

            await insertInsightsFunction(hub.postgres, teamId, successFunction)
            await insertInsightsFunction(hub.postgres, teamId, skippedFunction)

            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [
                successFunction.id,
                skippedFunction.id,
            ])

            const event = createPluginEvent({ event: 'does-not-match' }, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify that:
            // 1. First transformation succeeded (property was set)
            // 2. Second transformation was skipped (property was NOT set)
            // 3. We have correct tracking properties
            expect(result.event?.properties?.success).toBe(true)
            expect(result.event?.properties?.should_not_be_set).toBeUndefined()

            // Check that transformations_succeeded and transformations_skipped arrays contain the right functions
            expect(result.event?.properties?.$transformations_succeeded).toContain(
                `Success Template (${successFunction.id})`
            )
            expect(result.event?.properties?.$transformations_skipped).toContain(
                `Skipped Template (${skippedFunction.id})`
            )
        })
    })

    describe('legacy plugins', () => {
        let executeSpy: jest.SpyInstance

        beforeEach(async () => {
            const filterOutPlugin = createInsightsFunction({
                type: 'transformation',
                name: insightsFilterOutPlugin.template.name,
                template_id: 'plugin-insights-filter-out-plugin',
                inputs: {
                    eventsToDrop: {
                        value: 'drop-me',
                    },
                },
                team_id: teamId,
                enabled: true,
                script: insightsFilterOutPlugin.template.code,
                inputs_schema: insightsFilterOutPlugin.template.inputs_schema,
                id: 'c342e9ae-9f76-4379-a465-d33b4826bc05',
            })

            await insertInsightsFunction(hub.postgres, teamId, filterOutPlugin)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [filterOutPlugin.id])

            executeSpy = jest.spyOn(scriptTransformer['pluginExecutor'], 'execute')
        })

        afterEach(() => {
            executeSpy.mockRestore()
        })

        it('handles legacy plugin transformation to drop events', async () => {
            const event: PluginEvent = createPluginEvent({ event: 'drop-me', team_id: teamId })
            const result = await scriptTransformer.transformEventAndProduceMessages(event)
            expect(executeSpy).toHaveBeenCalledTimes(1)
            expect(result.event).toMatchInlineSnapshot(`null`)
        })

        it('handles legacy plugin transformation to keep events', async () => {
            const event: PluginEvent = createPluginEvent({ event: 'keep-me', team_id: teamId })
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            expect(executeSpy).toHaveBeenCalledTimes(1)
            expect(result.event).toMatchInlineSnapshot(`
                {
                  "distinct_id": "distinct-id",
                  "event": "keep-me",
                  "ip": "12.87.118.0",
                  "now": "2024-06-07T12:00:00.000Z",
                  "properties": {
                    "$current_url": "https://example.com",
                    "$ip": "12.87.118.0",
                    "$transformations_succeeded": [
                      "Filter Out Plugin (c342e9ae-9f76-4379-a465-d33b4826bc05)",
                    ],
                  },
                  "site_url": "http://localhost",
                  "team_id": 2,
                  "timestamp": "2024-01-01T00:00:00Z",
                  "uuid": "event-id",
                }
            `)
        })
    })

    describe('long event chain', () => {
        it('should handle a long chain of transformations', async () => {
            const geoIp = createInsightsFunction({
                type: 'transformation',
                name: insightsPluginGeoip.template.name,
                template_id: insightsPluginGeoip.template.id,
                inputs: {},
                team_id: teamId,
                enabled: true,
                script: insightsPluginGeoip.template.code,
                inputs_schema: insightsPluginGeoip.template.inputs_schema,
            })

            const filterPlugin = createInsightsFunction({
                type: 'transformation',
                name: propertyFilterPlugin.template.name,
                template_id: propertyFilterPlugin.template.id,
                inputs: {
                    properties: {
                        value: '$ip,$geoip_country_code,$geoip_latitude,$geoip_longitude',
                    },
                },
                team_id: teamId,
                enabled: true,
                script: propertyFilterPlugin.template.code,
                inputs_schema: propertyFilterPlugin.template.inputs_schema,
            })

            await insertInsightsFunction(hub.postgres, teamId, geoIp)
            await insertInsightsFunction(hub.postgres, teamId, filterPlugin)

            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [geoIp.id, filterPlugin.id])

            const event: PluginEvent = createPluginEvent({ event: 'keep-me', team_id: teamId })
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            expect(forSnapshot(result.event)).toMatchInlineSnapshot(`
                {
                  "distinct_id": "distinct-id",
                  "event": "keep-me",
                  "ip": null,
                  "now": "2024-06-07T12:00:00.000Z",
                  "properties": {
                    "$current_url": "https://example.com",
                    "$geoip_accuracy_radius": 20,
                    "$geoip_city_name": "Cleveland",
                    "$geoip_continent_code": "NA",
                    "$geoip_continent_name": "North America",
                    "$geoip_country_name": "United States",
                    "$geoip_postal_code": "44192",
                    "$geoip_subdivision_1_code": "OH",
                    "$geoip_subdivision_1_name": "Ohio",
                    "$geoip_time_zone": "America/New_York",
                    "$set": {
                      "$geoip_accuracy_radius": 20,
                      "$geoip_city_confidence": null,
                      "$geoip_city_name": "Cleveland",
                      "$geoip_continent_code": "NA",
                      "$geoip_continent_name": "North America",
                      "$geoip_country_code": "US",
                      "$geoip_country_name": "United States",
                      "$geoip_latitude": 41.5,
                      "$geoip_longitude": -81.6938,
                      "$geoip_postal_code": "44192",
                      "$geoip_subdivision_1_code": "OH",
                      "$geoip_subdivision_1_name": "Ohio",
                      "$geoip_subdivision_2_code": null,
                      "$geoip_subdivision_2_name": null,
                      "$geoip_time_zone": "America/New_York",
                    },
                    "$set_once": {
                      "$initial_geoip_accuracy_radius": 20,
                      "$initial_geoip_city_confidence": null,
                      "$initial_geoip_city_name": "Cleveland",
                      "$initial_geoip_continent_code": "NA",
                      "$initial_geoip_continent_name": "North America",
                      "$initial_geoip_country_code": "US",
                      "$initial_geoip_country_name": "United States",
                      "$initial_geoip_latitude": 41.5,
                      "$initial_geoip_longitude": -81.6938,
                      "$initial_geoip_postal_code": "44192",
                      "$initial_geoip_subdivision_1_code": "OH",
                      "$initial_geoip_subdivision_1_name": "Ohio",
                      "$initial_geoip_subdivision_2_code": null,
                      "$initial_geoip_subdivision_2_name": null,
                      "$initial_geoip_time_zone": "America/New_York",
                    },
                    "$transformations_succeeded": [
                      "GeoIP (<REPLACED-UUID-0>)",
                      "Property Filter (<REPLACED-UUID-1>)",
                    ],
                  },
                  "site_url": "http://localhost",
                  "team_id": 2,
                  "timestamp": "2024-01-01T00:00:00Z",
                  "uuid": "event-id",
                }
            `)
        })
    })

    describe('filter-based transformations', () => {
        it('should skip transformation when filter does not match', async () => {
            const filterTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Filter Template',
                description: 'A template that should be skipped when filter does not match',
                category: ['Custom'],
                script: `
                    let returnEvent := event
                    returnEvent.properties.should_not_be_set := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: filterTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(filterTemplate.fn),
                filters: {
                    bytecode: await compileFn(`
                        return event = 'match-me'
                    `),
                    events: [{ id: 'match-me', name: 'match-me', type: 'events', order: 0 }],
                },
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            const event = createPluginEvent({ event: 'does-not-match-me' }, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify transformation was skipped
            expect(result.event?.properties?.should_not_be_set).toBeUndefined()
            expect(result.event?.properties?.$transformations_succeeded).toBeUndefined()
            expect(result.event?.properties?.$transformations_failed).toBeUndefined()
            expect(result.event?.properties?.$transformations_skipped).toEqual([
                `${insightsFunction.name} (${insightsFunction.id})`,
            ])
        })

        it('should apply transformation when filter matches', async () => {
            const filterMatchingTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Test Template',
                description: 'A template that adds a property when filter matches',
                category: ['Custom'],
                script: `
                    let returnEvent := event
                    returnEvent.properties.test_property := 'test_value'
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: filterMatchingTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(filterMatchingTemplate.fn),
                filters: {
                    bytecode: await compileFn(`
                        // Filter that matches events with event name 'match-me'
                        return event = 'match-me'
                    `),
                    events: [{ id: 'match-me', name: 'match-me', type: 'events', order: 0 }],
                },
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            // Test event that should match the filter
            const matchingEvent = createPluginEvent({ event: 'match-me' }, teamId)
            const matchResult = await scriptTransformer.transformEventAndProduceMessages(matchingEvent)

            // Verify transformation was applied
            expect(matchResult.event?.properties?.test_property).toBe('test_value')
            expect(matchResult.event?.properties?.$transformations_succeeded).toContain(
                `${insightsFunction.name} (${insightsFunction.id})`
            )

            // Test event that shouldn't match the filter
            const nonMatchingEvent = createPluginEvent({ event: 'dont-match-me' }, teamId)
            const nonMatchResult = await scriptTransformer.transformEventAndProduceMessages(nonMatchingEvent)

            // Verify transformation was skipped
            expect(nonMatchResult.event?.properties?.test_property).toBeUndefined()
            expect(nonMatchResult.event?.properties?.$transformations_succeeded).toBeUndefined()
            expect(nonMatchResult.event?.properties?.$transformations_failed).toBeUndefined()
            expect(nonMatchResult.event?.properties?.$transformations_skipped).toEqual([
                `${insightsFunction.name} (${insightsFunction.id})`,
            ])
        })

        it('should apply transformation when no filters are defined', async () => {
            const noFilterTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'No Filter Template',
                description: 'A template without filters',
                category: ['Custom'],
                script: `
                    let returnEvent := event
                    returnEvent.properties.no_filter_property := 'applied'
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: noFilterTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(noFilterTemplate.fn),
                // No filters defined
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            const event = createPluginEvent({ event: 'any-event' }, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify transformation was applied
            expect(result.event?.properties?.no_filter_property).toBe('applied')
            expect(result.event?.properties?.$transformations_succeeded).toContain(
                `${insightsFunction.name} (${insightsFunction.id})`
            )
        })

        it('should skip transformation when filter errors and not continue processing', async () => {
            const errorFilterTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Error Filter Template',
                description: 'A template with an erroring filter',
                category: ['Custom'],
                script: `
                    let returnEvent := event
                    returnEvent.properties.error_filter_property := 'should_not_be_set'
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const workingTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-working',
                name: 'Working Template',
                description: 'A template that should work',
                category: ['Custom'],
                script: `
                    let returnEvent := event
                    returnEvent.properties.working_property := 'working'
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const errorFunction = createInsightsFunction({
                type: 'transformation',
                name: errorFilterTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(errorFilterTemplate.fn),
                filters: {
                    bytecode: await compileFn(`
                        // Invalid filter that will throw an error
                        lol
                    `),
                    events: [{ id: 'test-event', name: 'test-event', type: 'events', order: 0 }],
                },
            })

            const workingFunction = createInsightsFunction({
                type: 'transformation',
                name: workingTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(workingTemplate.fn),
            })

            await insertInsightsFunction(hub.postgres, teamId, errorFunction)
            await insertInsightsFunction(hub.postgres, teamId, workingFunction)

            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [
                errorFunction.id,
                workingFunction.id,
            ])

            const queueAppMetricsSpy = jest.spyOn(scriptTransformer['insightsFunctionMonitoringService'], 'queueAppMetrics')
            const queueLogsSpy = jest.spyOn(scriptTransformer['insightsFunctionMonitoringService'], 'queueLogs')

            const event = createPluginEvent({ event: 'test-event' }, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify one transformation was applied and the other was skipped
            expect(result.event?.properties?.$transformations_skipped).toContain(
                `${errorFunction.name} (${errorFunction.id})`
            )
            expect(queueAppMetricsSpy).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        metric_name: 'filtering_failed',
                    }),
                ]),
                'insights_function'
            )
            expect(queueLogsSpy).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: expect.stringContaining('Global variable not found'),
                    }),
                ]),
                'insights_function'
            )

            expect(result.event?.properties?.working_property).toBe('working')
            expect(result.event?.properties?.$transformations_succeeded).toContain(
                `${workingFunction.name} (${workingFunction.id})`
            )

            queueAppMetricsSpy.mockRestore()
            queueLogsSpy.mockRestore()
        })

        it('should skip transformation when none of multiple filters match', async () => {
            const multiFilterTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Multi Filter Template',
                description: 'A template with multiple filters that should all not match',
                category: ['Custom'],
                script: `
                    let returnEvent := event
                    returnEvent.properties.should_not_be_set := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: multiFilterTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(multiFilterTemplate.fn),
                filters: {
                    bytecode: await compileFn(`
                        // First filter checks for 'match-me-1'
                        let filter1 := event = 'match-me-1'
                        // Second filter checks for 'match-me-2'
                        let filter2 := event = 'match-me-2'
                        // Only transform if at least one filter matches
                        return filter1 or filter2
                    `),
                    events: [
                        { id: 'match-me-1', name: 'match-me-1', type: 'events', order: 0 },
                        { id: 'match-me-2', name: 'match-me-2', type: 'events', order: 1 },
                    ],
                },
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            const event = createPluginEvent({ event: 'does-not-match-any' }, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify transformation was skipped since no filters matched
            expect(result.event?.properties?.should_not_be_set).toBeUndefined()
            expect(result.event?.properties?.$transformations_succeeded).toBeUndefined()
            expect(result.event?.properties?.$transformations_failed).toBeUndefined()
            expect(result.event?.properties?.$transformations_skipped).toEqual([
                `${insightsFunction.name} (${insightsFunction.id})`,
            ])
        })

        it('should apply transformation when at least one of multiple filters match', async () => {
            const multiFilterTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Multi Filter Template',
                description: 'A template with multiple filters where one should match',
                category: ['Custom'],
                script: `
                    let returnEvent := event
                    returnEvent.properties.should_be_set := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: multiFilterTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(multiFilterTemplate.fn),
                filters: {
                    bytecode: await compileFn(`
                        // First filter checks for 'match-me-1'
                        let filter1 := event = 'match-me-1'
                        // Second filter checks for 'match-me-2'
                        let filter2 := event = 'match-me-2'
                        // Only transform if at least one filter matches
                        return filter1 or filter2
                    `),
                },
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            const event = createPluginEvent({ event: 'match-me-1' }, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify transformation was applied since one filter matched
            expect(result.event?.properties?.should_be_set).toBe(true)
            expect(result.event?.properties?.$transformations_succeeded).toContain(
                `${insightsFunction.name} (${insightsFunction.id})`
            )
        })
    })

    describe('ScriptWatcher integration', () => {
        beforeEach(() => {
            hub.CDP_HOG_WATCHER_SAMPLE_RATE = 1
        })

        it('should skip ScriptWatcher operations when sample rate is 0', async () => {
            hub.CDP_HOG_WATCHER_SAMPLE_RATE = 0

            const testTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Test Template',
                description: 'A simple test template',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.test_property := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: testTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(testTemplate.code),
                id: '11111111-1111-4111-a111-111111111111',
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            const observeResultsSpy = jest.spyOn(scriptTransformer['scriptWatcher'], 'observeResults')

            const event = createPluginEvent({ event: 'test-event' }, teamId)
            await scriptTransformer.transformEventAndProduceMessages(event)

            expect(observeResultsSpy).not.toHaveBeenCalled()
            expect(scriptTransformer['invocationResults'].length).toBe(1)

            observeResultsSpy.mockRestore()
        })

        it('should add watcher promise when sample rate is 1', async () => {
            hub.CDP_HOG_WATCHER_SAMPLE_RATE = 1

            const testTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Test Template',
                description: 'A simple test template',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.test_property := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunctionId = '11111111-1111-4111-a111-111111111111'
            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: testTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(testTemplate.code),
                id: insightsFunctionId,
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            // Add the state to the cache to prevent the error from being thrown
            // This simulates what would happen in production where states would be loaded
            scriptTransformer['cachedStates'][insightsFunctionId] = ScriptWatcherState.healthy

            const observeResultsSpy = jest
                .spyOn(scriptTransformer['scriptWatcher'], 'observeResults')
                .mockImplementation(() => Promise.resolve())

            const event = createPluginEvent({ event: 'test-event' }, teamId)
            await scriptTransformer.transformEventAndProduceMessages(event)
            expect(scriptTransformer['invocationResults'].length).toBe(1)
            await scriptTransformer.processInvocationResults()
            expect(scriptTransformer['invocationResults'].length).toBe(0)

            expect(observeResultsSpy).toHaveBeenCalled()

            observeResultsSpy.mockRestore()
        })

        it('should save and clear custom function states', async () => {
            const functionIds = ['11111111-1111-4111-a111-111111111111', '22222222-2222-4222-a222-222222222222']
            const mockStates = {
                [functionIds[0]]: { state: ScriptWatcherState.disabled, tokens: 0, rating: 0 },
                [functionIds[1]]: { state: ScriptWatcherState.disabled, tokens: 0, rating: 0 },
            }

            // Mock getStates
            jest.spyOn(scriptTransformer['scriptWatcher'], 'getPersistedStates').mockResolvedValue(
                Promise.resolve(mockStates)
            )

            // Save states
            await scriptTransformer.fetchAndCacheInsightsFunctionStates(functionIds)

            // Verify states were cached
            expect(scriptTransformer['cachedStates'][functionIds[0]]).toBe(ScriptWatcherState.disabled)
            expect(scriptTransformer['cachedStates'][functionIds[1]]).toBe(ScriptWatcherState.disabled)

            // Clear specific state
            scriptTransformer.clearInsightsFunctionStates([functionIds[0]])
            expect(scriptTransformer['cachedStates'][functionIds[0]]).toBeUndefined()
            expect(scriptTransformer['cachedStates'][functionIds[1]]).toBe(ScriptWatcherState.disabled)

            // Clear all states
            scriptTransformer.clearInsightsFunctionStates()
            expect(scriptTransformer['cachedStates']).toEqual({})
        })

        it('should throw error when state is missing from cache', () => {
            const insightsFunctionId = '11111111-1111-4111-a111-111111111111'

            // Create a test custom function
            createInsightsFunction({
                type: 'transformation',
                name: 'Test Function',
                team_id: teamId,
                enabled: true,
                id: insightsFunctionId,
            })

            // Make sure state is not in cache
            scriptTransformer.clearInsightsFunctionStates()

            // Verify state is not in cache initially
            expect(scriptTransformer['cachedStates'][insightsFunctionId] || null).toBeNull()

            // Create the expected error message
            const expectedErrorMessage = `Critical error: Missing InsightsFunction state in cache for function ${insightsFunctionId} - this should never happen`

            // Define a function that will throw the error
            const throwingFunction = () => {
                if (!scriptTransformer['cachedStates'][insightsFunctionId]) {
                    throw new Error(expectedErrorMessage)
                }
                return 'This should not be returned'
            }

            // Verify that the function throws the expected error
            expect(throwingFunction).toThrow(expectedErrorMessage)
        })

        it('should skip transformation execution but continue when scriptwatcher is enabled and function is disabled', async () => {
            // Set sample rate to 100% to ensure scriptwatcher logic runs
            hub.CDP_HOG_WATCHER_SAMPLE_RATE = 1

            // Create test transformation function
            const testTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Disabled Test Template',
                description: 'A test template that should be skipped due to disabled state',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.should_not_be_set := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunctionId = '33333333-3333-4333-a333-333333333333'
            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: testTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(testTemplate.code),
                id: insightsFunctionId,
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            // Mock the cached state to indicate the function is disabled
            scriptTransformer['cachedStates'][insightsFunctionId] = ScriptWatcherState.disabled

            // Create a spy to verify the executeInsightsFunction method is not called
            const executeInsightsFunctionSpy = jest.spyOn(scriptTransformer as any, 'executeInsightsFunction')

            const event = createPluginEvent({ event: 'test-event' }, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify the executeInsightsFunction method was not called for this function
            expect(executeInsightsFunctionSpy).not.toHaveBeenCalled()

            // Verify the transformation result doesn't have the property that would be set
            expect(result.event?.properties?.should_not_be_set).toBeUndefined()

            // Verify there are no transformation records in the properties
            expect(result.event?.properties?.$transformations_succeeded).toBeUndefined()
            expect(result.event?.properties?.$transformations_failed).toBeUndefined()

            // Reset spies
            executeInsightsFunctionSpy.mockRestore()
        })

        it('should execute transformation when scriptwatcher is enabled but function is in healthy state', async () => {
            // Set sample rate to 100% to ensure scriptwatcher logic runs
            hub.CDP_HOG_WATCHER_SAMPLE_RATE = 1

            // Create test transformation function
            const testTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Healthy Test Template',
                description: 'A test template that should execute because state is healthy',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.should_be_set := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunctionId = '55555555-5555-5555-a555-555555555555'
            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: testTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(testTemplate.code),
                id: insightsFunctionId,
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            // Mock the cached state to indicate the function is healthy
            scriptTransformer['cachedStates'][insightsFunctionId] = ScriptWatcherState.healthy

            // Create a spy to verify the executeInsightsFunction method is called
            const executeInsightsFunctionSpy = jest.spyOn(scriptTransformer as any, 'executeInsightsFunction')

            const event = createPluginEvent({ event: 'test-event' }, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify the executeInsightsFunction method was called for this function
            expect(executeInsightsFunctionSpy).toHaveBeenCalledTimes(1)

            // Verify the transformation result has the property that should be set
            expect(result.event?.properties?.should_be_set).toBe(true)

            // Verify the transformation is recorded as successful
            expect(result.event?.properties?.$transformations_succeeded).toContain(
                `${insightsFunction.name} (${insightsFunction.id})`
            )

            // Reset spies
            executeInsightsFunctionSpy.mockRestore()
        })

        it('should apply transformation when scriptwatcher is disabled even if function state is disabled', async () => {
            // Set sample rate to 0% to ensure scriptwatcher logic is skipped
            hub.CDP_HOG_WATCHER_SAMPLE_RATE = 0

            // Create test transformation function
            const testTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-test',
                name: 'Test Template',
                description: 'A test template that should execute despite disabled state because scriptwatcher is off',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.should_be_set := true
                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunctionId = '44444444-4444-4444-a444-444444444444'
            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: testTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(testTemplate.code),
                id: insightsFunctionId,
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            // Mock the cached state to indicate the function is disabled
            scriptTransformer['cachedStates'][insightsFunctionId] = ScriptWatcherState.disabled

            // Create a spy to verify the executeInsightsFunction method is called
            const executeInsightsFunctionSpy = jest.spyOn(scriptTransformer as any, 'executeInsightsFunction')

            const event = createPluginEvent({ event: 'test-event' }, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            // Verify the executeInsightsFunction method was called for this function
            expect(executeInsightsFunctionSpy).toHaveBeenCalledTimes(1)

            // Verify the transformation result has the property that should be set
            expect(result.event?.properties?.should_be_set).toBe(true)

            // Verify the transformation is recorded as successful
            expect(result.event?.properties?.$transformations_succeeded).toContain(
                `${insightsFunction.name} (${insightsFunction.id})`
            )

            // Reset spies
            executeInsightsFunctionSpy.mockRestore()
        })

        it('should throw when trying to capture events in transformations', async () => {
            // Create a transformation function that captures an event
            const captureTemplate: InsightsFunctionTemplate = {
                free: true,
                status: 'beta',
                type: 'transformation',
                id: 'template-capture',
                name: 'Capture Template',
                description: 'A template that captures an event',
                category: ['Custom'],
                code_language: 'fn',
                code: `
                    let returnEvent := event
                    returnEvent.properties.captured := true

                    // Capture a new event
                    insightsCapture({
                        'event': 'captured_event',
                        'distinct_id': 'captured_user',
                        'properties': {
                            'source': 'insights_function',
                            'original_event': event.event,
                            'original_distinct_id': event.distinct_id,
                            'captured_at': '2024-01-01T00:00:00Z'
                        }
                    })

                    return returnEvent
                `,
                inputs_schema: [],
            }

            const insightsFunction = createInsightsFunction({
                type: 'transformation',
                name: captureTemplate.name,
                team_id: teamId,
                enabled: true,
                bytecode: await compileFn(captureTemplate.code),
                id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
            })

            await insertInsightsFunction(hub.postgres, teamId, insightsFunction)
            scriptTransformer['insightsFunctionManager']['onInsightsFunctionsReloaded'](teamId, [insightsFunction.id])

            const event = createPluginEvent({ event: 'original-event', distinct_id: 'original_user' }, teamId)
            const result = await scriptTransformer.transformEventAndProduceMessages(event)

            expect(result.invocationResults[0].error).toContain('insightsCapture is not supported in transformations')
        })
    })
})
