import '../../tests/helpers/mocks/producer.mock'
import { mockFetch } from '../../tests/helpers/mocks/request.mock'

import { Server } from 'http'
import supertest from 'supertest'
import express from 'ultimate-express'

import { setupExpressApp } from '~/api/router'
import { createRedisV2PoolFromConfig } from '~/common/redis/redis-v2'
import { CustomFlow } from '~/schema/customflow'

import { forSnapshot } from '../../tests/helpers/snapshots'
import { getFirstTeam, resetTestDatabase } from '../../tests/helpers/sql'
import { Hub, Team } from '../types'
import { closeHub, createHub } from '../utils/db/hub'
import { UUIDT } from '../utils/utils'
import { CUSTOM_SCRIPT_EXAMPLES, CUSTOM_SCRIPT_FILTERS_EXAMPLES, CUSTOM_SCRIPT_INPUTS_EXAMPLES } from './_tests/examples'
import { insertCustomFunction as _insertCustomFunction, createCustomFunction } from './_tests/fixtures'
import { insertCustomFlow as _insertCustomFlow } from './_tests/fixtures-customflows'
import { deleteKeysWithPrefix } from './_tests/redis'
import { CdpApi } from './cdp-api'
import { insightsFilterOutPlugin } from './legacy-plugins/_transformations/insights-filter-out-plugin/template'
import { BASE_REDIS_KEY, ScriptWatcherState } from './services/monitoring/script-watcher.service'
import { CustomFunctionInvocationGlobals, CustomFunctionType } from './types'

describe('CDP API', () => {
    let hub: Hub
    let team: Team
    let app: express.Application
    let server: Server
    let api: CdpApi
    let customFunction: CustomFunctionType
    let customFunctionMultiFetch: CustomFunctionType

    const globals: Partial<CustomFunctionInvocationGlobals> = {
        groups: {},
        person: {
            id: '123',
            name: 'Jane Doe',
            url: 'https://example.com/person/123',
            properties: {
                email: 'example@hanzo.ai',
            },
        },
        event: {
            uuid: 'b3a1fe86-b10c-43cc-acaf-d208977608d0',
            event: '$pageview',
            elements_chain: '',
            distinct_id: '123',
            timestamp: '2021-09-28T14:00:00Z',
            url: 'https://example.com/events/b3a1fe86-b10c-43cc-acaf-d208977608d0/2021-09-28T14:00:00Z',
            properties: {
                $lib_version: '1.0.0',
            },
        },
    }

    const insertCustomFunction = async (customFunction: Partial<CustomFunctionType>) => {
        const item = await _insertCustomFunction(hub.postgres, team.id, customFunction)
        // Trigger the reload that django would do
        api['customFunctionManager']['onCustomFunctionsReloaded'](team.id, [item.id])
        return item
    }

    const insertCustomFlow = async (customFlow: Partial<CustomFlow>) => {
        const item = await _insertCustomFlow(hub.postgres, { team_id: team.id, ...customFlow } as CustomFlow)
        // Trigger the reload that django would do
        api['customFlowManager']['onCustomFlowsReloaded'](team.id, [item.id])
        return item
    }

    beforeAll(async () => {
        hub = await createHub({
            SITE_URL: 'http://localhost:8000',
        })
        hub.CDP_GOOGLE_ADWORDS_DEVELOPER_TOKEN = 'ADWORDS_TOKEN'
        team = await getFirstTeam(hub)

        api = new CdpApi(hub)
        app = setupExpressApp()
        app.use('/', api.router())
        server = app.listen(0, () => {})
    })

    beforeEach(async () => {
        await resetTestDatabase()

        mockFetch.mockClear()

        customFunction = await insertCustomFunction({
            name: 'test custom function',
            ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
            ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
            ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.no_filters,
        })

        customFunctionMultiFetch = await insertCustomFunction({
            name: 'test custom function multi fetch',
            ...CUSTOM_SCRIPT_EXAMPLES.recursive_fetch,
            ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
            ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.no_filters,
        })
    })

    afterAll(async () => {
        server.close()
        await closeHub(hub)
    })

    it('errors if missing custom function', async () => {
        const res = await supertest(app)
            .post(`/api/projects/${customFunction.team_id}/custom_functions/${new UUIDT().toString()}/invocations`)
            .send({ globals })

        expect(res.status).toEqual(404)
    })

    it('errors if missing team', async () => {
        const res = await supertest(app)
            .post(`/api/projects/${new UUIDT().toString()}/custom_functions/${customFunction.id}/invocations`)
            .send({ globals })

        expect(res.status).toEqual(404)
    })

    it('errors if missing values', async () => {
        const res = await supertest(app)
            .post(`/api/projects/${customFunction.team_id}/custom_functions/${customFunction.id}/invocations`)
            .send({})

        expect(res.status).toEqual(400)
        expect(res.body).toEqual({
            error: 'Missing event',
        })
    })

    it("does not error if custom function is 'new'", async () => {
        const res = await supertest(app)
            .post(`/api/projects/${customFunction.team_id}/custom_functions/new/invocations`)
            .send({ globals })

        expect(res.status).toEqual(400)
    })

    it('can invoke a function via the API with mocks', async () => {
        const res = await supertest(app)
            .post(`/api/projects/${customFunction.team_id}/custom_functions/${customFunction.id}/invocations`)
            .send({ globals, mock_async_functions: true })

        expect(res.status).toEqual(200)
        expect(res.body.errors).toEqual([])
        expect(res.body.logs.map((log: any) => log.message).slice(0, -1)).toMatchInlineSnapshot(`
            [
              "Async function 'fetch' was mocked with arguments:",
              "fetch('https://example.com/insights-webhook', {
              "headers": {
                "version": "v=1.0.0"
              },
              "body": {
                "event": {
                  "uuid": "b3a1fe86-b10c-43cc-acaf-d208977608d0",
                  "event": "$pageview",
                  "elements_chain": "",
                  "distinct_id": "123",
                  "timestamp": "2021-09-28T14:00:00Z",
                  "url": "https://example.com/events/b3a1fe86-b10c-43cc-acaf-d208977608d0/2021-09-28T14:00:00Z",
                  "properties": {
                    "$lib_version": "1.0.0"
                  }
                },
                "groups": {},
                "nested": {
                  "foo": "https://example.com/events/b3a1fe86-b10c-43cc-acaf-d208977608d0/2021-09-28T14:00:00Z"
                },
                "person": {
                  "id": "123",
                  "name": "Jane Doe",
                  "url": "https://example.com/person/123",
                  "properties": {
                    "email": "example@hanzo.ai"
                  }
                },
                "event_url": "https://example.com/events/b3a1fe86-b10c-43cc-acaf-d208977608d0/2021-09-28T14:00:00Z-test"
              },
              "method": "POST"
            })",
              "Fetch response:, {"status":200,"body":{}}",
            ]
        `)
    })

    it('can invoke a function via the API with real fetch', async () => {
        mockFetch.mockImplementationOnce(() =>
            Promise.resolve({
                status: 201,
                headers: { 'Content-Type': 'application/json' },
                json: () => Promise.resolve({ real: true }),
                text: () => Promise.resolve(JSON.stringify({ real: true })),
                dump: () => Promise.resolve(),
            })
        )

        const res = await supertest(app)
            .post(`/api/projects/${customFunction.team_id}/custom_functions/${customFunction.id}/invocations`)
            .send({ globals, mock_async_functions: false })

        expect(res.status).toEqual(200)
        expect(res.body).toMatchObject({
            errors: [],
            logs: [
                {
                    level: 'info',
                    message: 'Fetch response:, {"status":201,"body":{"real":true}}',
                },
                {
                    level: 'debug',
                    message: expect.stringContaining('Function completed in'),
                },
            ],
        })
    })

    it('function will return skipped if no invocations', async () => {
        mockFetch.mockImplementationOnce(() =>
            Promise.resolve({
                status: 201,
                headers: { 'Content-Type': 'application/json' },
                json: () => Promise.resolve({ real: true }),
                text: () => Promise.resolve(JSON.stringify({ real: true })),
                dump: () => Promise.resolve(),
            })
        )

        customFunction = await insertCustomFunction({
            name: 'test custom function',
            ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
            ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
            ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.elements_text_filter,
        })

        const res = await supertest(app)
            .post(`/api/projects/${customFunction.team_id}/custom_functions/${customFunction.id}/invocations`)
            .send({ globals, mock_async_functions: false })

        expect(res.status).toEqual(200)

        expect(res.body.status).toMatchInlineSnapshot(`"skipped"`)

        expect(res.body).toMatchObject({
            errors: [],
            logs: [
                {
                    level: 'info',
                    message: 'Mapping trigger not matching filters was ignored.',
                },
            ],
        })
    })

    it('can invoke a function with multiple fetches', async () => {
        mockFetch.mockImplementation(() =>
            Promise.resolve({
                status: 201,
                headers: { 'Content-Type': 'application/json' },
                json: () => Promise.resolve({ real: true }),
                text: () => Promise.resolve(JSON.stringify({ real: true })),
                dump: () => Promise.resolve(),
            })
        )
        const res = await supertest(app)
            .post(
                `/api/projects/${customFunctionMultiFetch.team_id}/custom_functions/${customFunctionMultiFetch.id}/invocations`
            )
            .send({ globals, mock_async_functions: false })

        expect(res.body.errors).toMatchInlineSnapshot(`
            [
              "Exceeded maximum number of async steps: 5",
            ]
        `)

        expect(mockFetch).toHaveBeenCalledTimes(5)
        expect(res.body).toMatchObject({
            logs: [
                {
                    level: 'error',
                    message: expect.stringContaining('Error executing function'),
                },
            ],
        })
    })

    it('includes enriched values in the request', async () => {
        mockFetch.mockImplementationOnce(() => {
            return Promise.resolve({
                status: 201,
                headers: { 'Content-Type': 'application/json' },
                json: () => Promise.resolve({ real: true }),
                text: () => Promise.resolve(JSON.stringify({ real: true })),
                dump: () => Promise.resolve(),
            })
        })

        customFunction = await insertCustomFunction({
            ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
            ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_google_fetch,
            ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.no_filters,
        })

        const res = await supertest(app)
            .post(`/api/projects/${customFunction.team_id}/custom_functions/${customFunction.id}/invocations`)
            .send({ globals, mock_async_functions: false })

        expect(mockFetch).toHaveBeenCalledWith(
            'https://googleads.googleapis.com/',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'developer-token': 'ADWORDS_TOKEN',
                }),
            })
        )

        expect(res.status).toEqual(200)
        expect(res.body).toMatchObject({
            logs: [
                {
                    level: 'info',
                    message: 'Fetch response:, {"status":201,"body":{"real":true}}',
                },
                {
                    level: 'debug',
                    message: expect.stringContaining('Function completed in'),
                },
            ],
        })
    })

    it('doesnt include enriched values in the mock response', async () => {
        customFunction = await insertCustomFunction({
            ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
            ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_google_fetch,
            ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.no_filters,
        })

        const res = await supertest(app)
            .post(`/api/projects/${customFunction.team_id}/custom_functions/${customFunction.id}/invocations`)
            .send({ globals, mock_async_functions: true })

        expect(res.status).toEqual(200)
        expect(res.body).toMatchObject({
            logs: [
                {
                    level: 'info',
                    message: "Async function 'fetch' was mocked with arguments:",
                },
                {
                    level: 'info',
                    message: expect.not.stringContaining('developer-token'),
                },
                {
                    level: 'info',
                    message: 'Fetch response:, {"status":200,"body":{}}',
                },
                {
                    level: 'debug',
                    message: expect.stringContaining('Function completed in '),
                },
            ],
        })
    })

    it('handles mappings', async () => {
        const customFunction = await insertCustomFunction({
            ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
            ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_fetch,
            ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.no_filters,
            mappings: [
                {
                    // Filters for pageview or autocapture
                    ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                },
                {
                    // No filters so should match all events
                    ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.no_filters,
                },
                {
                    // Broken filters so shouldn't match
                    ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.broken_filters,
                },
            ],
        })

        const res = await supertest(app)
            .post(`/api/projects/${customFunction.team_id}/custom_functions/${customFunction.id}/invocations`)
            .send({ globals, mock_async_functions: true })

        expect(res.status).toEqual(200)

        const minimalLogs = res.body.logs.map((log: any) => ({
            level: log.level,
            message: log.message,
        }))

        expect(res.body.status).toMatchInlineSnapshot(`"success"`)

        expect(minimalLogs).toMatchObject([
            { level: 'info', message: 'Mapping trigger not matching filters was ignored.' },
            {
                level: 'error',
                message:
                    'Error filtering event b3a1fe86-b10c-43cc-acaf-d208977608d0: Invalid InsightsQL bytecode, stack is empty, can not pop',
            },
            {
                level: 'info',
                message: "Async function 'fetch' was mocked with arguments:",
            },
            {
                level: 'info',
                message: expect.stringContaining("fetch('"),
            },
            {
                level: 'info',
                message: 'Fetch response:, {"status":200,"body":{}}',
            },
            {
                level: 'debug',
                message: expect.stringContaining('Function completed in '),
            },
        ])
    })

    it('doesnt include enriched values in the mock response', async () => {
        customFunction = await insertCustomFunction({
            ...CUSTOM_SCRIPT_EXAMPLES.simple_fetch,
            ...CUSTOM_SCRIPT_INPUTS_EXAMPLES.simple_google_fetch,
            ...CUSTOM_SCRIPT_FILTERS_EXAMPLES.no_filters,
        })

        const res = await supertest(app)
            .post(`/api/projects/${customFunction.team_id}/custom_functions/${customFunction.id}/invocations`)
            .send({ globals, mock_async_functions: true })

        expect(res.status).toEqual(200)

        expect(res.body.status).toMatchInlineSnapshot(`"success"`)

        expect(res.body.logs.map((log: any) => log.message).slice(0, -1)).toMatchInlineSnapshot(`
            [
              "Async function 'fetch' was mocked with arguments:",
              "fetch('https://googleads.googleapis.com/', {
              "headers": {
                "version": "v=1.0.0"
              },
              "body": {
                "event": {
                  "uuid": "b3a1fe86-b10c-43cc-acaf-d208977608d0",
                  "event": "$pageview",
                  "elements_chain": "",
                  "distinct_id": "123",
                  "timestamp": "2021-09-28T14:00:00Z",
                  "url": "https://example.com/events/b3a1fe86-b10c-43cc-acaf-d208977608d0/2021-09-28T14:00:00Z",
                  "properties": {
                    "$lib_version": "1.0.0"
                  }
                },
                "groups": {},
                "nested": {
                  "foo": "https://example.com/events/b3a1fe86-b10c-43cc-acaf-d208977608d0/2021-09-28T14:00:00Z"
                },
                "person": {
                  "id": "123",
                  "name": "Jane Doe",
                  "url": "https://example.com/person/123",
                  "properties": {
                    "email": "example@hanzo.ai"
                  }
                },
                "event_url": "https://example.com/events/b3a1fe86-b10c-43cc-acaf-d208977608d0/2021-09-28T14:00:00Z-test"
              },
              "method": "POST"
            })",
              "Fetch response:, {"status":200,"body":{}}",
            ]
        `)
    })

    describe('transformations', () => {
        let configuration: CustomFunctionType

        beforeEach(() => {
            configuration = createCustomFunction({
                type: 'transformation',
                name: insightsFilterOutPlugin.template.name,
                template_id: 'plugin-insights-filter-out-plugin',
                inputs: {
                    eventsToDrop: {
                        value: 'drop me',
                    },
                },
                team_id: team.id,
                enabled: true,
                script: insightsFilterOutPlugin.template.code,
                inputs_schema: insightsFilterOutPlugin.template.inputs_schema,
            })
        })

        it('processes transformations and returns the result if not null', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${customFunction.team_id}/custom_functions/new/invocations`)
                .send({ globals, mock_async_functions: true, configuration })

            expect(res.status).toEqual(200)

            expect(res.body.logs.map((log: any) => log.message)).toMatchInlineSnapshot(`[]`)

            expect(forSnapshot(res.body.result)).toMatchInlineSnapshot(`
                {
                  "distinct_id": "123",
                  "elements_chain": "",
                  "event": "$pageview",
                  "ip": null,
                  "now": "",
                  "properties": {
                    "$lib_version": "1.0.0",
                    "$transformations_succeeded": [
                      "Filter Out Plugin (<REPLACED-UUID-1>)",
                    ],
                  },
                  "site_url": "http://localhost:8000/project/2",
                  "team_id": 2,
                  "timestamp": "2021-09-28T14:00:00Z",
                  "url": "https://example.com/events/<REPLACED-UUID-0>/2021-09-28T14:00:00Z",
                  "uuid": "<REPLACED-UUID-0>",
                }
            `)
        })

        it('processes transformations and returns the result if null', async () => {
            globals.event!.event = 'drop me'

            const res = await supertest(app)
                .post(`/api/projects/${customFunction.team_id}/custom_functions/new/invocations`)
                .send({ globals, mock_async_functions: true, configuration })

            expect(res.status).toEqual(200)
            expect(res.body.logs.map((log: any) => log.message)).toMatchInlineSnapshot(`[]`)
            expect(res.body.result).toMatchInlineSnapshot(`null`)
        })
    })

    describe('custom function states', () => {
        beforeEach(async () => {
            jest.spyOn(hub.teamManager, 'getTeam').mockResolvedValue(team)
            const redis = createRedisV2PoolFromConfig({
                connection: hub.CDP_REDIS_HOST
                    ? {
                          url: hub.CDP_REDIS_HOST,
                          options: { port: hub.CDP_REDIS_PORT, password: hub.CDP_REDIS_PASSWORD },
                      }
                    : { url: hub.REDIS_URL },
                poolMinSize: hub.REDIS_POOL_MIN_SIZE,
                poolMaxSize: hub.REDIS_POOL_MAX_SIZE,
            })
            await deleteKeysWithPrefix(redis, BASE_REDIS_KEY)
        })

        afterAll(() => {
            jest.restoreAllMocks()
        })

        it('returns the states of all custom functions', async () => {
            await api['scriptWatcher'].forceStateChange(customFunction, ScriptWatcherState.degraded)
            await api['scriptWatcher'].forceStateChange(customFunctionMultiFetch, ScriptWatcherState.disabled)

            const res = await supertest(app).get('/api/custom_functions/states')
            expect(res.status).toEqual(200)
            expect(res.body).toEqual({
                results: [
                    {
                        function_enabled: true,
                        function_id: customFunctionMultiFetch.id,
                        function_name: 'test custom function multi fetch',
                        function_team_id: customFunctionMultiFetch.team_id,
                        function_type: 'destination',
                        state: 'disabled',
                        state_numeric: 3,
                        tokens: 10000,
                    },
                    {
                        function_enabled: true,
                        function_id: customFunction.id,
                        function_name: 'test custom function',
                        function_team_id: customFunction.team_id,
                        function_type: 'destination',
                        state: 'degraded',
                        state_numeric: 2,
                        tokens: 10000,
                    },
                ],
                total: 2,
            })
        })
    })

    describe('body size limits', () => {
        const largePayload = 'x'.repeat(600 * 1024)

        it('accepts large payloads on custom function invocations endpoint', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${customFunction.team_id}/custom_functions/${customFunction.id}/invocations`)
                .send({ globals, mock_async_functions: true, configuration: { large_field: largePayload } })

            expect(res.status).toEqual(200)
        })

        it('accepts large payloads on custom flow invocations endpoint', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${customFunction.team_id}/custom_flows/new/invocations`)
                .send({ globals, mock_async_functions: true, configuration: { large_field: largePayload } })

            // 400 from missing flow config, not 413/500 from body size
            expect(res.status).not.toEqual(413)
            expect(res.status).not.toEqual(500)
        })

        it('rejects large payloads on public webhooks endpoint', async () => {
            const res = await supertest(app).post('/public/webhooks/test-webhook').send({ large_field: largePayload })

            expect(res.status).toEqual(413)
            expect(res.body).toEqual({ error: 'Request entity too large' })
        })
    })

    describe('batch customflow invocations', () => {
        let batchCustomFlow: CustomFlow
        let originalKafkaProducer: any

        beforeEach(async () => {
            originalKafkaProducer = hub.kafkaProducer
            batchCustomFlow = await insertCustomFlow({
                id: new UUIDT().toString(),
                name: 'test batch custom flow',
                status: 'active',
                version: 1,
                exit_condition: 'exit_on_conversion',
                edges: [],
                actions: [],
                trigger: {
                    type: 'batch',
                    filters: {
                        properties: [
                            {
                                key: 'email',
                                value: 'test@hanzo.ai',
                                operator: 'exact',
                                type: 'person',
                            },
                        ],
                    },
                },
            })
        })

        afterEach(() => {
            hub.kafkaProducer = originalKafkaProducer
        })

        it('errors if missing team', async () => {
            const nonExistentTeamId = new UUIDT().toString()
            const res = await supertest(app)
                .post(`/api/projects/${nonExistentTeamId}/custom_flows/${batchCustomFlow.id}/batch_invocations/job-123`)
                .send({})

            expect(res.status).toEqual(404)
            expect(res.body.error).toEqual('Team not found')
        })

        it('errors if missing custom flow', async () => {
            const nonExistentUuid = new UUIDT().toString()
            const res = await supertest(app)
                .post(`/api/projects/${batchCustomFlow.team_id}/custom_flows/${nonExistentUuid}/batch_invocations/job-123`)
                .send({})

            expect(res.status).toEqual(404)
            expect(res.body.error).toEqual('Workflow not found')
        })

        it('errors if custom flow is not a batch trigger type', async () => {
            const nonBatchCustomFlow = await insertCustomFlow({
                id: new UUIDT().toString(),
                name: 'test non-batch custom flow',
                status: 'active',
                version: 1,
                exit_condition: 'exit_on_conversion',
                edges: [],
                actions: [],
                trigger: {
                    type: 'event',
                    filters: {},
                },
            })

            const res = await supertest(app)
                .post(
                    `/api/projects/${nonBatchCustomFlow.team_id}/custom_flows/${nonBatchCustomFlow.id}/batch_invocations/job-123`
                )
                .send({})

            expect(res.status).toEqual(400)
            expect(res.body.error).toEqual('Only batch Workflows are supported for batch jobs')
        })

        it('queues batch job request to kafka', async () => {
            const mockProduce = jest.fn().mockResolvedValue(undefined)
            hub.kafkaProducer = { produce: mockProduce } as any

            const res = await supertest(app)
                .post(`/api/projects/${batchCustomFlow.team_id}/custom_flows/${batchCustomFlow.id}/batch_invocations/job-123`)
                .send({
                    filters: {
                        filter_test_accounts: true,
                    },
                })

            expect(res.status).toEqual(200)
            expect(res.body).toEqual({ status: 'queued' })
            expect(mockProduce).toHaveBeenCalledWith({
                topic: 'cdp_batch_customflow_requests_test',
                value: Buffer.from(
                    JSON.stringify({
                        teamId: batchCustomFlow.team_id,
                        customFlowId: batchCustomFlow.id,
                        parentRunId: 'job-123',
                        filters: {
                            properties: (batchCustomFlow as any).trigger.filters.properties,
                            filter_test_accounts: true,
                        },
                    })
                ),
                key: `${batchCustomFlow.team_id}_${batchCustomFlow.id}`,
            })
        })

        it('queues batch job with filters from custom flow config when not provided', async () => {
            const mockProduce = jest.fn().mockResolvedValue(undefined)
            hub.kafkaProducer = { produce: mockProduce } as any

            const res = await supertest(app)
                .post(`/api/projects/${batchCustomFlow.team_id}/custom_flows/${batchCustomFlow.id}/batch_invocations/job-456`)
                .send({})

            expect(res.status).toEqual(200)
            expect(res.body).toEqual({ status: 'queued' })
            expect(mockProduce).toHaveBeenCalledWith({
                topic: 'cdp_batch_customflow_requests_test',
                value: Buffer.from(
                    JSON.stringify({
                        teamId: batchCustomFlow.team_id,
                        customFlowId: batchCustomFlow.id,
                        parentRunId: 'job-456',
                        filters: {
                            properties: (batchCustomFlow as any).trigger.filters.properties,
                            filter_test_accounts: false,
                        },
                    })
                ),
                key: `${batchCustomFlow.team_id}_${batchCustomFlow.id}`,
            })
        })

        it('errors if kafka producer not available', async () => {
            hub.kafkaProducer = undefined as any

            const res = await supertest(app)
                .post(`/api/projects/${batchCustomFlow.team_id}/custom_flows/${batchCustomFlow.id}/batch_invocations/job-123`)
                .send({})

            expect(res.status).toEqual(500)
            expect(res.body.error).toEqual('Kafka producer not available')
        })
    })
})
