import { createMockJobQueue } from '../../tests/helpers/mocks/job-queue.mock'
import { mockFetch } from '../../tests/helpers/mocks/request.mock'

import { Server } from 'http'
import jwt from 'jsonwebtoken'
import supertest from 'supertest'
import express from 'ultimate-express'

import { Flow } from '~/cdp/schema/flow'
import { setupExpressApp } from '~/common/api/router'
import { deleteKeysWithPrefix } from '~/common/redis/_tests/redis'
import { createRedisV2PoolFromConfig } from '~/common/redis/redis-v2'
import { closeHub, createHub } from '~/common/utils/db/hub'
import { parseJSON } from '~/common/utils/json-parse'
import { UUIDT } from '~/common/utils/utils'

import { createCdpConsumerDeps } from '../../tests/helpers/cdp'
import { forSnapshot } from '../../tests/helpers/snapshots'
import { createTeam, getFirstTeam, resetTestDatabase } from '../../tests/helpers/sql'
import { Hub, Team } from '../types'
import { FixtureFlowBuilder } from './_tests/builders/flow.builder'
import { INSIGHTS_EXAMPLES, INSIGHTS_FILTERS_EXAMPLES, INSIGHTS_INPUTS_EXAMPLES } from './_tests/examples'
import {
    insertInsightsFunction as _insertInsightsFunction,
    createInsightsFunction,
    insertInsightsFunctionTemplate,
    insertIntegration,
} from './_tests/fixtures'
import { insertFlow as _insertFlow } from './_tests/fixtures-flows'
import { CdpApi } from './cdp-api'
import { CdpConsumerBaseDeps } from './consumers/cdp-base.consumer'
import { insightsFilterOutPlugin } from './legacy-plugins/_transformations/insights-filter-out-plugin/template'
import { BASE_REDIS_KEY, ScriptWatcherState } from './services/monitoring/script-watcher.service'
import { compileScript } from './templates/compiler'
import { InsightsFunctionInvocationGlobals, InsightsFunctionType } from './types'

// Email MX validation runs on every email send, so without a mock the test-panel
// email tests would do live DNS lookups for their fixture recipients (and
// example.com publishes a null MX, which validation correctly blocks). Resolve
// everything as deliverable — validation behavior is covered by
// email-validation.service.test.ts.
jest.mock('node:dns/promises', () => ({
    Resolver: jest.fn().mockImplementation(() => ({
        resolveMx: jest.fn().mockResolvedValue([{ exchange: 'mx.example.com', priority: 10 }]),
        resolve4: jest.fn().mockResolvedValue(['1.2.3.4']),
        resolve6: jest.fn().mockResolvedValue([]),
    })),
}))

describe('CDP API', () => {
    let hub: Hub
    let cdpDeps: CdpConsumerBaseDeps
    let team: Team
    let app: express.Application
    let server: Server
    let api: CdpApi
    let insightsFunction: InsightsFunctionType
    let insightsFunctionMultiFetch: InsightsFunctionType

    const globals: Partial<InsightsFunctionInvocationGlobals> = {
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

    const insertInsightsFunction = async (insightsFunction: Partial<InsightsFunctionType>) => {
        const item = await _insertInsightsFunction(hub.postgres, team.id, insightsFunction)
        // Trigger the reload that django would do
        api['insightsFunctionManager']['onInsightsFunctionsReloaded'](team.id, [item.id])
        return item
    }

    const insertFlow = async (flow: Partial<Flow>) => {
        const item = await _insertFlow(hub.postgres, { team_id: team.id, ...flow } as Flow)
        // Trigger the reload that django would do
        api['flowManager']['onFlowsReloaded'](team.id, [item.id])
        return item
    }

    beforeAll(async () => {
        hub = await createHub({
            SITE_URL: 'http://localhost:8000',
        })
        hub.CDP_GOOGLE_ADWORDS_DEVELOPER_TOKEN = 'ADWORDS_TOKEN'
        team = await getFirstTeam(hub.postgres)

        cdpDeps = createCdpConsumerDeps(hub)
        api = new CdpApi(hub, cdpDeps, {
            scriptQueue: createMockJobQueue(),
            flowQueue: createMockJobQueue(),
        })
        app = setupExpressApp()
        app.use('/', api.router())
        server = app.listen(0, () => {})
    })

    beforeEach(async () => {
        await resetTestDatabase()

        mockFetch.mockClear()

        insightsFunction = await insertInsightsFunction({
            name: 'test script function',
            ...INSIGHTS_EXAMPLES.simple_fetch,
            ...INSIGHTS_INPUTS_EXAMPLES.simple_fetch,
            ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
        })

        insightsFunctionMultiFetch = await insertInsightsFunction({
            name: 'test script function multi fetch',
            ...INSIGHTS_EXAMPLES.recursive_fetch,
            ...INSIGHTS_INPUTS_EXAMPLES.simple_fetch,
            ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
        })
    })

    afterAll(async () => {
        server.close()
        await closeHub(hub)
    })

    it('errors if missing script function', async () => {
        const res = await supertest(app)
            .post(`/api/projects/${insightsFunction.team_id}/insights_functions/${new UUIDT().toString()}/invocations`)
            .send({ globals })

        expect(res.status).toEqual(404)
    })

    it('errors if missing team', async () => {
        const res = await supertest(app)
            .post(`/api/projects/${new UUIDT().toString()}/insights_functions/${insightsFunction.id}/invocations`)
            .send({ globals })

        expect(res.status).toEqual(404)
    })

    it('errors if missing values', async () => {
        const res = await supertest(app)
            .post(`/api/projects/${insightsFunction.team_id}/insights_functions/${insightsFunction.id}/invocations`)
            .send({})

        expect(res.status).toEqual(400)
        expect(res.body).toEqual({
            error: 'Missing event',
        })
    })

    it("does not error if script function is 'new'", async () => {
        const res = await supertest(app)
            .post(`/api/projects/${insightsFunction.team_id}/insights_functions/new/invocations`)
            .send({ globals })

        expect(res.status).toEqual(400)
    })

    it('can invoke a function via the API with mocks', async () => {
        const res = await supertest(app)
            .post(`/api/projects/${insightsFunction.team_id}/insights_functions/${insightsFunction.id}/invocations`)
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
            .post(`/api/projects/${insightsFunction.team_id}/insights_functions/${insightsFunction.id}/invocations`)
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

        insightsFunction = await insertInsightsFunction({
            name: 'test script function',
            ...INSIGHTS_EXAMPLES.simple_fetch,
            ...INSIGHTS_INPUTS_EXAMPLES.simple_fetch,
            ...INSIGHTS_FILTERS_EXAMPLES.elements_text_filter,
        })

        const res = await supertest(app)
            .post(`/api/projects/${insightsFunction.team_id}/insights_functions/${insightsFunction.id}/invocations`)
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
                `/api/projects/${insightsFunctionMultiFetch.team_id}/insights_functions/${insightsFunctionMultiFetch.id}/invocations`
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

        insightsFunction = await insertInsightsFunction({
            ...INSIGHTS_EXAMPLES.simple_fetch,
            ...INSIGHTS_INPUTS_EXAMPLES.simple_google_fetch,
            ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
        })

        const res = await supertest(app)
            .post(`/api/projects/${insightsFunction.team_id}/insights_functions/${insightsFunction.id}/invocations`)
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
        insightsFunction = await insertInsightsFunction({
            ...INSIGHTS_EXAMPLES.simple_fetch,
            ...INSIGHTS_INPUTS_EXAMPLES.simple_google_fetch,
            ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
        })

        const res = await supertest(app)
            .post(`/api/projects/${insightsFunction.team_id}/insights_functions/${insightsFunction.id}/invocations`)
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
        const insightsFunction = await insertInsightsFunction({
            ...INSIGHTS_EXAMPLES.simple_fetch,
            ...INSIGHTS_INPUTS_EXAMPLES.simple_fetch,
            ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
            mappings: [
                {
                    // Filters for pageview or autocapture
                    ...INSIGHTS_FILTERS_EXAMPLES.pageview_or_autocapture_filter,
                },
                {
                    // No filters so should match all events
                    ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
                },
                {
                    // Broken filters so shouldn't match
                    ...INSIGHTS_FILTERS_EXAMPLES.broken_filters,
                },
            ],
        })

        const res = await supertest(app)
            .post(`/api/projects/${insightsFunction.team_id}/insights_functions/${insightsFunction.id}/invocations`)
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
        insightsFunction = await insertInsightsFunction({
            ...INSIGHTS_EXAMPLES.simple_fetch,
            ...INSIGHTS_INPUTS_EXAMPLES.simple_google_fetch,
            ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
        })

        const res = await supertest(app)
            .post(`/api/projects/${insightsFunction.team_id}/insights_functions/${insightsFunction.id}/invocations`)
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

    it('redacts secret input values in mocked async function logs', async () => {
        const SECRET_TOKEN = 'super-secret-bearer-token-xyz'

        const insightsFunctionWithSecret = await insertInsightsFunction({
            name: 'test script function with secret in headers',
            ...INSIGHTS_EXAMPLES.simple_fetch,
            ...INSIGHTS_FILTERS_EXAMPLES.no_filters,
            inputs_schema: [
                { key: 'url', type: 'string', label: 'URL', secret: false, required: true },
                { key: 'access_token', type: 'string', label: 'Access token', secret: true, required: true },
                {
                    key: 'method',
                    type: 'choice',
                    label: 'HTTP Method',
                    secret: false,
                    choices: [
                        { label: 'POST', value: 'POST' },
                        { label: 'GET', value: 'GET' },
                    ],
                    required: true,
                },
                { key: 'headers', type: 'dictionary', label: 'Headers', secret: false, required: false },
                { key: 'body', type: 'json', label: 'Body', secret: false, required: true },
            ],
            inputs: {
                url: { value: 'https://example.com/insights-webhook' },
                access_token: { value: SECRET_TOKEN },
                method: { value: 'POST' },
                headers: { value: { Authorization: `Bearer ${SECRET_TOKEN}` } },
                body: { value: {} },
            },
        })

        const res = await supertest(app)
            .post(
                `/api/projects/${insightsFunctionWithSecret.team_id}/insights_functions/${insightsFunctionWithSecret.id}/invocations`
            )
            .send({ globals, mock_async_functions: true })

        expect(res.status).toEqual(200)
        expect(res.body.errors).toEqual([])

        const allLogText = res.body.logs.map((log: any) => log.message).join('\n')
        expect(allLogText).not.toContain(SECRET_TOKEN)
        // Confirm the sanitization path actually ran rather than the test passing by virtue of
        // no fetch log being emitted at all.
        expect(allLogText).toContain('***REDACTED***')
    })

    describe('transformations', () => {
        let configuration: InsightsFunctionType

        beforeEach(() => {
            configuration = createInsightsFunction({
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
                .post(`/api/projects/${insightsFunction.team_id}/insights_functions/new/invocations`)
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
                .post(`/api/projects/${insightsFunction.team_id}/insights_functions/new/invocations`)
                .send({ globals, mock_async_functions: true, configuration })

            expect(res.status).toEqual(200)
            expect(res.body.logs.map((log: any) => log.message)).toMatchInlineSnapshot(`[]`)
            expect(res.body.result).toMatchInlineSnapshot(`null`)
        })
    })

    describe('log transformations', () => {
        let configuration: InsightsFunctionType

        const logRecordGlobals = {
            record: {
                body: 'login ok password=hunter2',
                severity_text: 'info',
                severity_number: 9,
                service_name: 'payments-api',
                attributes: { 'http.method': 'POST' },
                resource_attributes: { 'k8s.namespace.name': 'payments' },
            },
        }

        beforeEach(async () => {
            const script = `
                let r := record
                if (r.severity_text == 'debug') {
                    return null
                }
                if (r.body != null) {
                    r.body := replaceAll(r.body, inputs.needle, '[REDACTED]')
                }
                r.attributes.transformed := 'true'
                return r
            `
            configuration = createInsightsFunction({
                type: 'transformation_log',
                name: 'Test log transformation',
                team_id: team.id,
                enabled: true,
                script,
                bytecode: await compileScript(script),
                inputs: { needle: { value: 'hunter2' } },
            })
        })

        it('transforms a mock log record', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${team.id}/insights_functions/new/invocations`)
                .send({ globals: logRecordGlobals, configuration })

            expect(res.status).toEqual(200)
            expect(res.body.status).toEqual('success')
            expect(res.body.errors).toEqual([])
            expect(res.body.result.body).toEqual('login ok password=[REDACTED]')
            expect(res.body.result.severity_text).toEqual('info')
            expect(res.body.result.attributes).toEqual({ 'http.method': 'POST', transformed: 'true' })
        })

        it('returns null result when the record is dropped', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${team.id}/insights_functions/new/invocations`)
                .send({
                    globals: { record: { ...logRecordGlobals.record, severity_text: 'debug' } },
                    configuration,
                })

            expect(res.status).toEqual(200)
            expect(res.body.status).toEqual('success')
            expect(res.body.result).toEqual(null)
            expect(res.body.logs.map((log: any) => log.message)).toContain('Record dropped by transformation.')
        })

        it('returns 400 when the record global is missing', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${team.id}/insights_functions/new/invocations`)
                .send({ globals: {}, configuration })

            expect(res.status).toEqual(400)
            expect(res.body.error).toEqual('Missing record')
        })

        it('reports a malformed return value as an error', async () => {
            // Returning a non-record, non-null value is a customer mistake the endpoint must surface
            const script = `return 42`
            const res = await supertest(app)
                .post(`/api/projects/${team.id}/insights_functions/new/invocations`)
                .send({
                    globals: logRecordGlobals,
                    configuration: { ...configuration, script, bytecode: await compileScript(script) },
                })

            expect(res.status).toEqual(200)
            expect(res.body.status).toEqual('error')
            expect(res.body.errors.length).toBeGreaterThan(0)
        })

        it('captures print output from the transformation', async () => {
            const script = `
                print('inspecting', record.service_name)
                return record
            `
            const res = await supertest(app)
                .post(`/api/projects/${team.id}/insights_functions/new/invocations`)
                .send({
                    globals: logRecordGlobals,
                    configuration: { ...configuration, script, bytecode: await compileScript(script) },
                })

            expect(res.status).toEqual(200)
            expect(res.body.status).toEqual('success')
            expect(res.body.logs.map((log: any) => log.message)).toContain('inspecting, payments-api')
        })
    })

    describe('script function states', () => {
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

        it('returns the states of all script functions', async () => {
            await api['scriptWatcher'].forceStateChange(insightsFunction, ScriptWatcherState.degraded)
            await api['scriptWatcher'].forceStateChange(insightsFunctionMultiFetch, ScriptWatcherState.disabled)

            const res = await supertest(app).get('/api/insights_functions/states')
            expect(res.status).toEqual(200)
            expect(res.body).toEqual({
                results: [
                    {
                        function_enabled: true,
                        function_id: insightsFunctionMultiFetch.id,
                        function_name: 'test script function multi fetch',
                        function_team_id: insightsFunctionMultiFetch.team_id,
                        function_type: 'destination',
                        state: 'disabled',
                        state_numeric: 3,
                        tokens: 10000,
                    },
                    {
                        function_enabled: true,
                        function_id: insightsFunction.id,
                        function_name: 'test script function',
                        function_team_id: insightsFunction.team_id,
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

        it('accepts large payloads on script function invocations endpoint', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${insightsFunction.team_id}/insights_functions/${insightsFunction.id}/invocations`)
                .send({ globals, mock_async_functions: true, configuration: { large_field: largePayload } })

            expect(res.status).toEqual(200)
        })

        it('accepts large payloads on script flow invocations endpoint', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${insightsFunction.team_id}/hog_flows/new/invocations`)
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

    describe('flow invocation groups', () => {
        const resolvedGroup = {
            id: 'org-1',
            type: 'organization',
            index: 0,
            url: 'http://localhost:8000/groups/0/org-1',
            properties: { plan: 'enterprise' },
        }

        const groupGlobals: Partial<InsightsFunctionInvocationGlobals> = {
            ...globals,
            groups: {},
            event: {
                ...globals.event!,
                properties: { $groups: { organization: 'org-1' } },
            },
        }

        let executeSpy: jest.SpyInstance
        let getGroupsSpy: jest.SpyInstance

        beforeEach(() => {
            executeSpy = jest.spyOn(api['flowExecutor'], 'executeCurrentAction').mockImplementation(((
                invocation: any
            ) =>
                Promise.resolve({
                    invocation,
                    error: null,
                    logs: [],
                    execResult: null,
                })) as any)
            getGroupsSpy = jest
                .spyOn(api['groupsManager'], 'getGroupsForEvent')
                .mockResolvedValue({ organization: resolvedGroup })
        })

        afterEach(() => {
            executeSpy.mockRestore()
            getGroupsSpy.mockRestore()
        })

        it('resolves groups from the event when none are provided', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${team.id}/hog_flows/new/invocations`)
                .send({ globals: groupGlobals, mock_async_functions: true, configuration: {} })

            expect(res.status).toEqual(200)
            expect(getGroupsSpy).toHaveBeenCalledWith(
                team.id,
                expect.objectContaining({ $groups: { organization: 'org-1' } }),
                expect.stringContaining(`/project/${team.id}`)
            )
            // Resolved groups flow into filterGlobals so conditional branches can evaluate them
            const invocation = executeSpy.mock.calls[0][0]
            expect(invocation.filterGlobals.group_0).toEqual({ properties: { plan: 'enterprise' } })
            expect(invocation.filterGlobals.$group_0).toEqual('org-1')
        })

        it('does not override groups provided in the payload', async () => {
            const providedGroups = {
                organization: { ...resolvedGroup, id: 'org-provided', properties: { plan: 'startup' } },
            }
            const res = await supertest(app)
                .post(`/api/projects/${team.id}/hog_flows/new/invocations`)
                .send({
                    globals: { ...groupGlobals, groups: providedGroups },
                    mock_async_functions: true,
                    configuration: {},
                })

            expect(res.status).toEqual(200)
            expect(getGroupsSpy).not.toHaveBeenCalled()
            const invocation = executeSpy.mock.calls[0][0]
            expect(invocation.filterGlobals.$group_0).toEqual('org-provided')
        })
    })

    describe('flow wait_until_condition test invocations', () => {
        // Matches events whose name equals `eventName` - same shape the serializer compiles
        // for an "events to wait for" entry.
        const eventBytecode = (eventName: string): any[] => ['_H', 1, 32, eventName, 32, 'event', 1, 1, 11]

        const waitFlowConfiguration = {
            name: 'Wait flow',
            actions: [
                { id: 'trigger_node', name: 'Trigger', type: 'trigger', config: { type: 'event', filters: {} } },
                {
                    id: 'wait_node',
                    name: 'Wait',
                    type: 'wait_until_condition',
                    config: {
                        events: [
                            {
                                filters: {
                                    bytecode: eventBytecode('follow_up'),
                                    events: [{ id: 'follow_up', name: 'follow_up', type: 'events', order: 0 }],
                                },
                            },
                        ],
                        condition: { filters: null },
                        max_wait_duration: '5m',
                    },
                },
                { id: 'exit_node', name: 'Exit', type: 'exit', config: {} },
            ],
            edges: [
                { from: 'wait_node', to: 'exit_node', type: 'branch', index: 0 },
                { from: 'wait_node', to: 'exit_node', type: 'continue' },
            ],
        }

        it.each([
            ['matching', 'follow_up', 'exit_node'],
            ['non-matching', 'some_other_event', 'wait_node'],
        ])('a %s test event resolves the wait step correctly', async (_, eventName, expectedNextActionId) => {
            const res = await supertest(app)
                .post(`/api/projects/${team.id}/hog_flows/new/invocations`)
                .send({
                    globals: { ...globals, event: { ...globals.event!, event: eventName } },
                    mock_async_functions: true,
                    configuration: waitFlowConfiguration,
                    current_action_id: 'wait_node',
                })

            expect(res.status).toEqual(200)
            expect(res.body.status).toEqual('success')
            expect(res.body.nextActionId).toEqual(expectedNextActionId)
        })
    })

    it('redacts a flow function action secret from mocked async function logs', async () => {
        const SECRET_TOKEN = 'super-secret-flow-token-xyz'

        await insertInsightsFunctionTemplate(hub.postgres, {
            id: 'template-cdp-api-flow-secret-fetch',
            name: 'Flow secret fetch',
            code: `fetch(inputs.url, { 'method': 'POST', 'headers': { 'Authorization': f'Bearer {inputs.access_token}' } })`,
            inputs_schema: [
                { key: 'url', type: 'string', label: 'URL', secret: false, required: true },
                { key: 'access_token', type: 'string', label: 'Access token', secret: true, required: true },
            ],
        })

        const flowConfiguration = {
            name: 'Flow with secret fetch',
            actions: [
                { id: 'trigger_node', name: 'Trigger', type: 'trigger', config: { type: 'event', filters: {} } },
                {
                    id: 'fetch_node',
                    name: 'Fetch',
                    type: 'function',
                    config: {
                        template_id: 'template-cdp-api-flow-secret-fetch',
                        inputs: {
                            url: { value: 'https://example.com/hook' },
                            access_token: { value: SECRET_TOKEN },
                        },
                    },
                },
                { id: 'exit_node', name: 'Exit', type: 'exit', config: {} },
            ],
            edges: [
                { from: 'trigger_node', to: 'fetch_node', type: 'continue' },
                { from: 'fetch_node', to: 'exit_node', type: 'continue' },
            ],
        }

        const res = await supertest(app).post(`/api/projects/${team.id}/hog_flows/new/invocations`).send({
            globals,
            mock_async_functions: true,
            configuration: flowConfiguration,
            current_action_id: 'fetch_node',
        })

        expect(res.status).toEqual(200)
        const allLogText = res.body.logs.map((log: any) => log.message).join('\n')
        expect(allLogText).not.toContain(SECRET_TOKEN)
        // Confirm redaction actually ran, rather than passing because no fetch log was emitted.
        expect(allLogText).toContain('***REDACTED***')
    })

    describe('batch flow invocations', () => {
        let batchFlow: Flow

        beforeEach(async () => {
            batchFlow = await insertFlow({
                id: new UUIDT().toString(),
                name: 'test batch script flow',
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

        it('errors if missing team', async () => {
            const nonExistentTeamId = new UUIDT().toString()
            const res = await supertest(app)
                .post(`/api/projects/${nonExistentTeamId}/hog_flows/${batchFlow.id}/batch_invocations/job-123`)
                .send({})

            expect(res.status).toEqual(404)
            expect(res.body.error).toEqual('Team not found')
        })

        it('errors if missing script flow', async () => {
            const nonExistentUuid = new UUIDT().toString()
            const res = await supertest(app)
                .post(`/api/projects/${batchFlow.team_id}/hog_flows/${nonExistentUuid}/batch_invocations/job-123`)
                .send({})

            expect(res.status).toEqual(404)
            expect(res.body.error).toEqual('Workflow not found')
        })

        it('errors if script flow is not a batch trigger type', async () => {
            const nonBatchFlow = await insertFlow({
                id: new UUIDT().toString(),
                name: 'test non-batch script flow',
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
                    `/api/projects/${nonBatchFlow.team_id}/hog_flows/${nonBatchFlow.id}/batch_invocations/job-123`
                )
                .send({})

            expect(res.status).toEqual(400)
            expect(res.body.error).toEqual('Only batch Workflows are supported for batch jobs')
        })

        it('queues batch job to the cyclotron resolver', async () => {
            const createJobMock = jest.fn().mockResolvedValue('resolver-job-id')
            api['batchResolverProducer'] = {
                createJob: createJobMock,
                countInFlightJobs: jest.fn().mockResolvedValue({ count: 0, byAction: {}, positionUnknown: 0 }),
                rescheduleParkedJobs: jest.fn(),
                disconnect: jest.fn().mockResolvedValue(undefined),
            }

            try {
                const res = await supertest(app)
                    .post(
                        `/api/projects/${batchFlow.team_id}/hog_flows/${batchFlow.id}/batch_invocations/job-789`
                    )
                    .send({
                        filters: { filter_test_accounts: true },
                        max_audience_size: 1234,
                        variables: { foo: 'bar' },
                    })

                expect(res.status).toEqual(200)
                expect(res.body).toEqual({ status: 'queued' })

                expect(createJobMock).toHaveBeenCalledTimes(1)
                const arg = createJobMock.mock.calls[0][0]
                expect(arg).toMatchObject({
                    teamId: batchFlow.team_id,
                    queueName: 'hogflow_batch_resolve',
                    parentRunId: 'job-789',
                    functionId: batchFlow.id,
                })
                expect(arg.state).toBeInstanceOf(Buffer)
                const state = parseJSON((arg.state as Buffer).toString('utf-8')) as Record<string, unknown>
                expect(state).toMatchObject({
                    batchJobId: 'job-789',
                    teamId: batchFlow.team_id,
                    flowId: batchFlow.id,
                    filters: {
                        properties: (batchFlow as any).trigger.filters.properties,
                        filter_test_accounts: true,
                    },
                    maxAudienceSize: 1234,
                    variables: { foo: 'bar' },
                    cursor: null,
                    totalEnqueued: 0,
                    pagesProcessed: 0,
                })
                // No email action in the flow, so the audience must not be deduped by email
                expect(state.dedupeKey).toBeUndefined()
            } finally {
                api['batchResolverProducer'] = null
            }
        })

        it('resolves the audience from the posted snapshot, not the live trigger filters', async () => {
            // The snapshot was validated at confirm time - re-reading the trigger here would let an
            // edit racing the dispatch widen the send past what was previewed.
            const snapshotProperties = [{ key: 'email', type: 'person', value: 'a', operator: 'icontains' }]

            const createJobMock = jest.fn().mockResolvedValue('resolver-job-id')
            api['batchResolverProducer'] = {
                createJob: createJobMock,
                countInFlightJobs: jest.fn().mockResolvedValue({ count: 0, byAction: {}, positionUnknown: 0 }),
                rescheduleParkedJobs: jest.fn(),
                disconnect: jest.fn().mockResolvedValue(undefined),
            }

            try {
                const res = await supertest(app)
                    .post(
                        `/api/projects/${batchFlow.team_id}/hog_flows/${batchFlow.id}/batch_invocations/job-791`
                    )
                    .send({ filters: { properties: snapshotProperties } })

                expect(res.status).toEqual(200)
                const arg = createJobMock.mock.calls[0][0]
                const state = parseJSON((arg.state as Buffer).toString('utf-8')) as Record<string, any>
                expect(state.filters.properties).toEqual(snapshotProperties)
                expect(state.filters.properties).not.toEqual((batchFlow as any).trigger.filters.properties)
            } finally {
                api['batchResolverProducer'] = null
            }
        })

        it('sets email dedupe on the resolver state when the flow sends email to the default {{person.properties.email}}', async () => {
            const emailFlow = await insertFlow({
                id: new UUIDT().toString(),
                name: 'test batch email script flow',
                status: 'active',
                version: 1,
                exit_condition: 'exit_on_conversion',
                edges: [],
                actions: [
                    {
                        id: 'email_1',
                        type: 'function_email',
                        name: 'Send email',
                        config: {
                            template_id: 'template-email',
                            inputs: {
                                email: {
                                    value: {
                                        to: { email: '{{ person.properties.email }}', name: '' },
                                        from: {},
                                        subject: 'Hi',
                                        text: 'Hello',
                                        html: '<p>Hello</p>',
                                    },
                                },
                            },
                        },
                    },
                ] as any,
                trigger: {
                    type: 'batch',
                    filters: { properties: [] },
                },
            })

            const createJobMock = jest.fn().mockResolvedValue('resolver-job-id')
            api['batchResolverProducer'] = {
                createJob: createJobMock,
                countInFlightJobs: jest.fn().mockResolvedValue({ count: 0, byAction: {}, positionUnknown: 0 }),
                rescheduleParkedJobs: jest.fn(),
                disconnect: jest.fn().mockResolvedValue(undefined),
            }

            try {
                const res = await supertest(app)
                    .post(
                        `/api/projects/${emailFlow.team_id}/hog_flows/${emailFlow.id}/batch_invocations/job-790`
                    )
                    .send({})

                expect(res.status).toEqual(200)
                const arg = createJobMock.mock.calls[0][0]
                const state = parseJSON((arg.state as Buffer).toString('utf-8')) as Record<string, unknown>
                expect(state.dedupeKey).toEqual('email')
            } finally {
                api['batchResolverProducer'] = null
            }
        })

        it('skips email dedupe when the flow sends to a customized recipient (e.g. work_email)', async () => {
            // Regression guard for the wrong-property footgun: if the customer wired their
            // email action to send to `person.properties.work_email`, deduping on
            // `person.properties.email` would collapse the wrong groups. Better to skip dedupe.
            const emailFlow = await insertFlow({
                id: new UUIDT().toString(),
                name: 'test batch email script flow (custom recipient)',
                status: 'active',
                version: 1,
                exit_condition: 'exit_on_conversion',
                edges: [],
                actions: [
                    {
                        id: 'email_1',
                        type: 'function_email',
                        name: 'Send email',
                        config: {
                            template_id: 'template-email',
                            inputs: {
                                email: {
                                    value: {
                                        to: { email: '{{ person.properties.work_email }}', name: '' },
                                        from: {},
                                        subject: 'Hi',
                                        text: 'Hello',
                                        html: '<p>Hello</p>',
                                    },
                                },
                            },
                        },
                    },
                ] as any,
                trigger: {
                    type: 'batch',
                    filters: { properties: [] },
                },
            })

            const createJobMock = jest.fn().mockResolvedValue('resolver-job-id')
            api['batchResolverProducer'] = {
                createJob: createJobMock,
                countInFlightJobs: jest.fn().mockResolvedValue({ count: 0, byAction: {}, positionUnknown: 0 }),
                rescheduleParkedJobs: jest.fn(),
                disconnect: jest.fn().mockResolvedValue(undefined),
            }

            try {
                const res = await supertest(app)
                    .post(
                        `/api/projects/${emailFlow.team_id}/hog_flows/${emailFlow.id}/batch_invocations/job-791`
                    )
                    .send({})

                expect(res.status).toEqual(200)
                const arg = createJobMock.mock.calls[0][0]
                const state = parseJSON((arg.state as Buffer).toString('utf-8')) as Record<string, unknown>
                expect(state.dedupeKey).toBeUndefined()
            } finally {
                api['batchResolverProducer'] = null
            }
        })
    })

    describe('scheduled flow invocations', () => {
        let scheduleFlow: Flow
        let mockQueueInvocations: jest.Mock

        beforeEach(async () => {
            mockQueueInvocations = jest.fn().mockResolvedValue(undefined)
            api['flowQueue'] = { queueInvocations: mockQueueInvocations } as any

            scheduleFlow = await insertFlow({
                id: new UUIDT().toString(),
                name: 'test schedule script flow',
                status: 'active',
                version: 1,
                exit_condition: 'exit_only_at_end',
                edges: [],
                actions: [],
                trigger: {
                    type: 'schedule',
                },
            })
        })

        it('errors if missing team', async () => {
            const nonExistentTeamId = new UUIDT().toString()
            const res = await supertest(app)
                .post(`/api/projects/${nonExistentTeamId}/hog_flows/${scheduleFlow.id}/scheduled_invocations`)
                .send({})

            expect(res.status).toEqual(404)
            expect(res.body.error).toEqual('Team not found')
        })

        it('errors if missing script flow', async () => {
            const nonExistentUuid = new UUIDT().toString()
            const res = await supertest(app)
                .post(`/api/projects/${scheduleFlow.team_id}/hog_flows/${nonExistentUuid}/scheduled_invocations`)
                .send({})

            expect(res.status).toEqual(404)
            expect(res.body.error).toEqual('Workflow not found')
        })

        it('errors if trigger type is not schedule', async () => {
            const eventFlow = await insertFlow({
                id: new UUIDT().toString(),
                name: 'test event script flow',
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
                .post(`/api/projects/${eventFlow.team_id}/hog_flows/${eventFlow.id}/scheduled_invocations`)
                .send({})

            expect(res.status).toEqual(400)
            expect(res.body.error).toEqual('Workflow trigger must be of type "schedule"')
        })

        it('queues invocation and returns queued status', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${scheduleFlow.team_id}/hog_flows/${scheduleFlow.id}/scheduled_invocations`)
                .send({ variables: { greeting: 'Hello' } })

            expect(res.status).toEqual(200)
            expect(res.body.status).toEqual('queued')
            expect(res.body.invocation_id).toBeDefined()
            expect(mockQueueInvocations).toHaveBeenCalledTimes(1)
        })

        it('queues invocation with empty variables when none provided', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${scheduleFlow.team_id}/hog_flows/${scheduleFlow.id}/scheduled_invocations`)
                .send({})

            expect(res.status).toEqual(200)
            expect(res.body.status).toEqual('queued')
            expect(res.body.invocation_id).toBeDefined()
            expect(mockQueueInvocations).toHaveBeenCalledTimes(1)
        })
    })

    describe('flow in-flight count', () => {
        let countFlow: Flow
        let mockCountInFlightJobs: jest.Mock

        beforeEach(async () => {
            mockCountInFlightJobs = jest
                .fn()
                .mockResolvedValue({ count: 3, byAction: { delay_1: 2 }, positionUnknown: 1 })
            api['batchResolverProducer'] = {
                createJob: jest.fn(),
                disconnect: jest.fn(),
                countInFlightJobs: mockCountInFlightJobs,
                rescheduleParkedJobs: jest.fn(),
            }

            countFlow = await insertFlow({
                id: new UUIDT().toString(),
                name: 'test in-flight count script flow',
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
        })

        afterEach(() => {
            api['batchResolverProducer'] = null
        })

        it('returns the in-flight job count for a workflow', async () => {
            const res = await supertest(app).get(
                `/api/projects/${countFlow.team_id}/hog_flows/${countFlow.id}/in_flight_count`
            )

            expect(res.status).toEqual(200)
            expect(res.body).toEqual({ count: 3, by_action: { delay_1: 2 }, position_unknown: 1 })
            expect(mockCountInFlightJobs).toHaveBeenCalledWith(countFlow.team_id, countFlow.id)
        })

        it('errors if missing script flow', async () => {
            const res = await supertest(app).get(
                `/api/projects/${countFlow.team_id}/hog_flows/${new UUIDT().toString()}/in_flight_count`
            )

            expect(res.status).toEqual(404)
            expect(res.body.error).toEqual('Workflow not found')
        })

        it("errors when requesting another team's script flow", async () => {
            const otherTeamId = await createTeam(hub.postgres, team.organization_id)

            const res = await supertest(app).get(
                `/api/projects/${otherTeamId}/hog_flows/${countFlow.id}/in_flight_count`
            )

            expect(res.status).toEqual(404)
            expect(res.body.error).toEqual('Workflow not found')
            expect(mockCountInFlightJobs).not.toHaveBeenCalled()
        })

        it('errors if the cyclotron producer is not configured', async () => {
            api['batchResolverProducer'] = null

            const res = await supertest(app).get(
                `/api/projects/${countFlow.team_id}/hog_flows/${countFlow.id}/in_flight_count`
            )

            expect(res.status).toEqual(503)
        })
    })

    describe('flow reschedule parked', () => {
        let rescheduleFlow: Flow
        let mockRescheduleParkedJobs: jest.Mock
        const sweepFloor = new Date('2025-06-01T00:10:00.000Z')
        const sweepUntil = new Date('2025-06-01T00:40:00.000Z')

        // Mirrors Django's mint (insights/plugins/plugin_server_api.py) with the shared dev/test key.
        const mintToken = (teamId: number, flowId: string, secret = 'local-dev-workflows-reschedule-jwt') =>
            jwt.sign({ team_id: teamId, hog_flow_id: flowId }, secret, {
                audience: 'insights:workflows:reschedule_parked',
                expiresIn: '2m',
            })
        const authFor = (teamId: number, flowId: string) => ({
            Authorization: `Bearer ${mintToken(teamId, flowId)}`,
        })

        beforeEach(async () => {
            mockRescheduleParkedJobs = jest.fn().mockResolvedValue({
                swept: 5,
                remaining: 2,
                done: false,
                sweepFloor,
                sweepUntil,
            })
            api['batchResolverProducer'] = {
                createJob: jest.fn(),
                disconnect: jest.fn(),
                countInFlightJobs: jest.fn(),
                rescheduleParkedJobs: mockRescheduleParkedJobs,
            }

            rescheduleFlow = await insertFlow({
                id: new UUIDT().toString(),
                name: 'test reschedule script flow',
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
        })

        afterEach(() => {
            api['batchResolverProducer'] = null
        })

        it('runs a sweep slice and returns the bounds for follow-up slices', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${rescheduleFlow.team_id}/hog_flows/${rescheduleFlow.id}/reschedule_parked`)
                .set(authFor(rescheduleFlow.team_id, rescheduleFlow.id))
                .send({ action_ids: ['delay_1', 'wait_1'] })

            expect(res.status).toEqual(200)
            expect(res.body).toEqual({
                swept: 5,
                remaining: 2,
                done: false,
                sweep_floor: sweepFloor.toISOString(),
                sweep_until: sweepUntil.toISOString(),
            })
            expect(mockRescheduleParkedJobs).toHaveBeenCalledWith({
                teamId: rescheduleFlow.team_id,
                functionId: rescheduleFlow.id,
                actionIds: ['delay_1', 'wait_1'],
                sweepFloor: undefined,
                sweepUntil: undefined,
            })
        })

        it('parses passed-through bounds into dates', async () => {
            const res = await supertest(app)
                .post(`/api/projects/${rescheduleFlow.team_id}/hog_flows/${rescheduleFlow.id}/reschedule_parked`)
                .set(authFor(rescheduleFlow.team_id, rescheduleFlow.id))
                .send({
                    action_ids: ['delay_1'],
                    sweep_floor: sweepFloor.toISOString(),
                    sweep_until: sweepUntil.toISOString(),
                })

            expect(res.status).toEqual(200)
            expect(mockRescheduleParkedJobs).toHaveBeenCalledWith(expect.objectContaining({ sweepFloor, sweepUntil }))
        })

        it.each([
            ['missing action_ids', {}],
            ['empty action_ids', { action_ids: [] }],
            ['non-string action_ids', { action_ids: [42] }],
            ['too many action_ids', { action_ids: Array.from({ length: 101 }, (_, i) => `a${i}`) }],
            ['unparseable bounds', { action_ids: ['a'], sweep_floor: 'nope', sweep_until: 'nope' }],
            ['only one bound', { action_ids: ['a'], sweep_floor: '2025-06-01T00:10:00.000Z' }],
            [
                'floor after until',
                {
                    action_ids: ['a'],
                    sweep_floor: '2025-06-01T00:40:00.000Z',
                    sweep_until: '2025-06-01T00:10:00.000Z',
                },
            ],
        ])('rejects a bad body: %s', async (_desc, body) => {
            const res = await supertest(app)
                .post(`/api/projects/${rescheduleFlow.team_id}/hog_flows/${rescheduleFlow.id}/reschedule_parked`)
                .set(authFor(rescheduleFlow.team_id, rescheduleFlow.id))
                .send(body)

            expect(res.status).toEqual(400)
            expect(mockRescheduleParkedJobs).not.toHaveBeenCalled()
        })

        it("errors when requesting another team's script flow", async () => {
            const otherTeamId = await createTeam(hub.postgres, team.organization_id)

            const res = await supertest(app)
                .post(`/api/projects/${otherTeamId}/hog_flows/${rescheduleFlow.id}/reschedule_parked`)
                .set(authFor(otherTeamId, rescheduleFlow.id))
                .send({ action_ids: ['delay_1'] })

            expect(res.status).toEqual(404)
            expect(mockRescheduleParkedJobs).not.toHaveBeenCalled()
        })

        it.each([
            ['no token', () => ({})],
            [
                'a token signed with the wrong key',
                () => ({
                    Authorization: `Bearer ${mintToken(rescheduleFlow.team_id, rescheduleFlow.id, 'wrong-key')}`,
                }),
            ],
            [
                "another workflow's token",
                () => ({ Authorization: `Bearer ${mintToken(rescheduleFlow.team_id, new UUIDT().toString())}` }),
            ],
            [
                "another team's token",
                () => ({ Authorization: `Bearer ${mintToken(rescheduleFlow.team_id + 1, rescheduleFlow.id)}` }),
            ],
        ])('rejects a request with %s', async (_desc, headers) => {
            const res = await supertest(app)
                .post(`/api/projects/${rescheduleFlow.team_id}/hog_flows/${rescheduleFlow.id}/reschedule_parked`)
                .set(headers())
                .send({ action_ids: ['delay_1'] })

            expect(res.status).toEqual(401)
            expect(mockRescheduleParkedJobs).not.toHaveBeenCalled()
        })

        it('fails closed when the reschedule JWT key is not provisioned', async () => {
            const savedJwt = api['rescheduleJwt']
            api['rescheduleJwt'] = null
            try {
                const res = await supertest(app)
                    .post(
                        `/api/projects/${rescheduleFlow.team_id}/hog_flows/${rescheduleFlow.id}/reschedule_parked`
                    )
                    .set(authFor(rescheduleFlow.team_id, rescheduleFlow.id))
                    .send({ action_ids: ['delay_1'] })

                expect(res.status).toEqual(503)
                expect(mockRescheduleParkedJobs).not.toHaveBeenCalled()
            } finally {
                api['rescheduleJwt'] = savedJwt
            }
        })

        it('errors if the cyclotron producer is not configured', async () => {
            api['batchResolverProducer'] = null

            const res = await supertest(app)
                .post(`/api/projects/${rescheduleFlow.team_id}/hog_flows/${rescheduleFlow.id}/reschedule_parked`)
                .send({ action_ids: ['delay_1'] })

            expect(res.status).toEqual(503)
        })
    })

    // The test panel POSTs to /hog_flows/:id/invocations and runs the executor in-process —
    // it never enqueues into cyclotron. If the executor routes an email action onto the
    // dedicated email queue, nothing services that job and the workflow stalls on a
    // "Workflow will pause until …" log. The handler forces `isTest: true` so the
    // email branch always goes through EmailService directly on this path.
    describe('hog_flows/:id/invocations — email actions are sent inline despite queue routing', () => {
        let emailSpy: jest.SpyInstance
        let flowId: string

        beforeEach(async () => {
            await insertIntegration(hub.postgres, team.id, {
                id: 1,
                kind: 'email',
                config: {
                    email: 'sender@hanzo.ai',
                    name: 'Test Sender',
                    domain: 'hanzo.ai',
                    verified: true,
                    provider: 'maildev',
                },
            })

            await insertInsightsFunctionTemplate(hub.postgres, {
                id: 'template-cdp-api-test-panel-email',
                name: 'CDP API Test Panel Email',
                code: `sendEmail(inputs.email)`,
                inputs_schema: [
                    {
                        type: 'native_email',
                        key: 'email',
                        label: 'Email message',
                        integration: 'email',
                        required: true,
                        default: {
                            to: { email: '', name: '' },
                            from: { email: '', name: '' },
                            subject: '',
                            text: 'Hello!',
                            html: '<div>Hello!</div>',
                        },
                        secret: false,
                        description: '',
                        templating: 'liquid',
                    },
                ],
            })

            const flow = new FixtureFlowBuilder()
                .withTeamId(team.id)
                .withStatus('active')
                .withExitCondition('exit_only_at_end')
                .withWorkflow({
                    actions: {
                        trigger: {
                            type: 'trigger',
                            config: { type: 'event', filters: INSIGHTS_FILTERS_EXAMPLES.no_filters.filters ?? {} },
                        },
                        email_1: {
                            type: 'function_email',
                            config: {
                                template_id: 'template-cdp-api-test-panel-email',
                                inputs: {
                                    email: {
                                        value: {
                                            to: { email: 'recipient@example.com', name: 'Recipient' },
                                            from: { integrationId: 1, email: 'sender@hanzo.ai' },
                                            subject: 'Test panel email',
                                            text: 'hello from test panel',
                                            html: '<p>hello from test panel</p>',
                                        },
                                    },
                                },
                            },
                        },
                        exit: { type: 'exit', config: {} },
                    },
                    edges: [
                        { from: 'trigger', to: 'email_1', type: 'continue' },
                        { from: 'email_1', to: 'exit', type: 'continue' },
                    ],
                })
                .build()
            const inserted = await insertFlow(flow)
            flowId = inserted.id

            // Stub EmailService so the test doesn't depend on a running maildev SMTP. The spy
            // captures whether the inline path was taken — that's the assertion that proves the fix.
            emailSpy = jest
                .spyOn(api['scriptExecutorAsync']['deps'].emailService, 'executeSendEmail')
                .mockImplementation((invocation: any) =>
                    Promise.resolve({
                        invocation,
                        finished: true,
                        logs: [],
                        metrics: [
                            {
                                team_id: invocation.teamId,
                                app_source_id: invocation.parentRunId ?? invocation.functionId,
                                instance_id: invocation.state.actionId || invocation.id,
                                metric_kind: 'email',
                                metric_name: 'email_sent',
                                count: 1,
                            },
                        ],
                        capturedInsightsEvents: [],
                        warehouseWebhookPayloads: [],
                        messageAssets: [],
                    })
                )
        })

        afterEach(() => {
            emailSpy.mockRestore()
        })

        it('sends the email inline via EmailService instead of routing to the email queue', async () => {
            const res = await supertest(app).post(`/api/projects/${team.id}/hog_flows/${flowId}/invocations`).send({
                globals,
                configuration: {},
                current_action_id: 'email_1',
            })

            expect(res.status).toBe(200)
            expect(res.body.status).toBe('success')
            expect(res.body.errors).toEqual([])
            // EmailService was called inline — proving the test endpoint forced inline delivery
            // even though the team would normally be routed to the email queue.
            expect(emailSpy).toHaveBeenCalledTimes(1)
            // The "Workflow will pause until …" log only appears when the executor routes the
            // invocation to a different queue. It must NOT be present on the test panel response.
            const pauseLog = res.body.logs.find((l: any) =>
                String(l.message ?? '').startsWith('Workflow will pause until')
            )
            expect(pauseLog).toBeUndefined()
            // executeCurrentAction advances past the email step after the inline send — the
            // response's nextActionId proves the workflow continued to the next action.
            expect(res.body.nextActionId).toBe('exit')
        })
    })
})
