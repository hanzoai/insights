import { createMockJobQueue } from '~/tests/helpers/mocks/job-queue.mock'
import { mockProducerObserver } from '~/tests/helpers/mocks/producer.mock'
import { mockFetch } from '~/tests/helpers/mocks/request.mock'

import { Server } from 'http'
import supertest from 'supertest'
import express from 'ultimate-express'

import { FN_EXAMPLES, FN_FILTERS_EXAMPLES, FN_INPUTS_EXAMPLES } from '~/cdp/_tests/examples'
import { insertInsightsFunction as _insertInsightsFunction, insertBatchExport } from '~/cdp/_tests/fixtures'
import { CdpApi } from '~/cdp/cdp-api'
import { InsightsFunctionType } from '~/cdp/types'
import { setupExpressApp } from '~/common/api/router'
import { GroupReadRepository } from '~/common/groups/repositories/group-repository.interface'
import { closeHub, createHub } from '~/common/utils/db/hub'
import { parseJSON } from '~/common/utils/json-parse'
import { UUIDT } from '~/common/utils/utils'
import { createCdpConsumerDeps } from '~/tests/helpers/cdp'
import { getFirstTeam, resetTestDatabase, updateOrganizationAvailableFeatures } from '~/tests/helpers/sql'
import { Hub, Team } from '~/types'

import { GroupTypeIndex, TeamId } from '../../types'
import { GroupsManagerService } from './managers/groups-manager.service'

describe('BatchExportInsightsFunctionService', () => {
    let hub: Hub
    let team: Team
    let api: CdpApi
    let app: express.Application
    let server: Server

    let batchExportId: string
    let insightsFunction: InsightsFunctionType
    let datastoreEvent: Record<string, any>

    const insertInsightsFunction = async (insightsFunction: Partial<InsightsFunctionType>) => {
        const item = await _insertInsightsFunction(hub.postgres, team.id, insightsFunction)
        api['insightsFunctionManager']['onInsightsFunctionsReloaded'](team.id, [item.id])
        return item
    }

    const invocationUrl = () => `/api/projects/${team.id}/insights_functions/${insightsFunction.id}/batch_export_invocations`

    const postInvocation = (body: any) => supertest(app).post(invocationUrl()).send(body)

    beforeAll(async () => {
        hub = await createHub({ SITE_URL: 'http://localhost:8000' })
        team = await getFirstTeam(hub.postgres)

        api = new CdpApi(hub, createCdpConsumerDeps(hub), {
            hogQueue: createMockJobQueue(),
            hogflowQueue: createMockJobQueue(),
        })
        app = setupExpressApp()
        app.use('/', api.router())
        server = app.listen(0, () => {})
    })

    beforeEach(async () => {
        await resetTestDatabase()
        mockFetch.mockClear()

        datastoreEvent = {
            uuid: 'b3a1fe86-b10c-43cc-acaf-d208977608d0',
            event: '$pageview',
            team_id: team.id,
            distinct_id: '123',
            timestamp: '2021-09-28T14:00:00Z',
            created_at: '2021-09-28T14:00:00Z',
            properties: JSON.stringify({ $lib_version: '1.0.0' }),
            elements_chain: '',
        }

        batchExportId = new UUIDT().toString()
        await insertBatchExport(hub.postgres, team.id, batchExportId)

        insightsFunction = await insertInsightsFunction({
            name: 'test batch export script function',
            ...FN_EXAMPLES.simple_fetch,
            ...FN_INPUTS_EXAMPLES.simple_fetch,
            ...FN_FILTERS_EXAMPLES.no_filters,
            batch_export_id: batchExportId,
        })
    })

    afterAll(async () => {
        await api.stop()
        server.close()
        await closeHub(hub)
    })

    describe('request body validation', () => {
        it.each([
            ['empty body', {}, 'datastore_event'],
            [
                'missing event uuid',
                { datastore_event: { event: '$pageview', team_id: 1, distinct_id: 'x', timestamp: 't' } },
                'uuid',
            ],
            [
                'missing event name',
                {
                    datastore_event: {
                        uuid: 'b3a1fe86-b10c-43cc-acaf-d208977608d0',
                        team_id: 1,
                        distinct_id: 'x',
                        timestamp: 't',
                    },
                },
                'event',
            ],
        ])('rejects %s', async (_label, body, expectedField) => {
            const res = await postInvocation(body)
            expect(res.status).toEqual(400)
            expect(res.body.errors[0]).toContain('Invalid request body')
            expect(res.body.errors[0]).toContain(expectedField)
        })

        it('rejects non-string invocation_id', async () => {
            const res = await postInvocation({ datastore_event: datastoreEvent, invocation_id: 12345 })
            expect(res.status).toEqual(400)
            expect(res.body.errors[0]).toContain('Invalid request body')
            expect(res.body.errors[0]).toContain('invocation_id')
        })

        it('rejects invalid uuid invocation_id', async () => {
            const res = await postInvocation({ datastore_event: datastoreEvent, invocation_id: 'not-a-uuid' })
            expect(res.status).toEqual(400)
            expect(res.body.errors[0]).toContain('Invalid request body')
            expect(res.body.errors[0]).toContain('invocation_id')
        })
    })

    describe('resource lookup errors', () => {
        it('returns 404 for non-existent team', async () => {
            const res = await supertest(app)
                .post(`/api/projects/99999/insights_functions/${insightsFunction.id}/batch_export_invocations`)
                .send({ datastore_event: datastoreEvent })

            expect(res.status).toEqual(404)
            expect(res.body.errors[0]).toContain('99999')
        })

        it('returns 404 for non-existent script function', async () => {
            const fakeId = new UUIDT().toString()
            const res = await supertest(app)
                .post(`/api/projects/${team.id}/insights_functions/${fakeId}/batch_export_invocations`)
                .send({ datastore_event: datastoreEvent })

            expect(res.status).toEqual(404)
            expect(res.body.errors[0]).toContain(fakeId)
        })

        it('returns 404 for script function without batch_export_id', async () => {
            const nonBatchFunction = await insertInsightsFunction({
                name: 'non-batch script function',
                ...FN_EXAMPLES.simple_fetch,
                ...FN_INPUTS_EXAMPLES.simple_fetch,
                ...FN_FILTERS_EXAMPLES.no_filters,
            })

            const res = await supertest(app)
                .post(`/api/projects/${team.id}/insights_functions/${nonBatchFunction.id}/batch_export_invocations`)
                .send({ datastore_event: datastoreEvent })

            expect(res.status).toEqual(404)
            expect(res.body.errors[0]).toContain(nonBatchFunction.id)
        })
    })

    describe('successful invocation', () => {
        it('executes the script function and returns success', async () => {
            mockFetch.mockImplementationOnce(() =>
                Promise.resolve({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    json: () => Promise.resolve({ ok: true }),
                    text: () => Promise.resolve(JSON.stringify({ ok: true })),
                    dump: () => Promise.resolve(),
                })
            )

            const res = await postInvocation({ datastore_event: datastoreEvent })

            expect(res.status).toEqual(200)
            expect(res.body.status).toEqual('success')
            expect(res.body.errors).toEqual([])
            expect(res.body.logs).toMatchObject([
                { level: 'info', message: expect.stringContaining('Fetch response:') },
                { level: 'debug', message: expect.stringContaining('Function completed in') },
            ])
        })

        it('uses provided invocation_id', async () => {
            mockFetch.mockImplementationOnce(() =>
                Promise.resolve({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    json: () => Promise.resolve({ ok: true }),
                    text: () => Promise.resolve(JSON.stringify({ ok: true })),
                    dump: () => Promise.resolve(),
                })
            )

            const invocationId = new UUIDT().toString()
            const res = await postInvocation({
                datastore_event: datastoreEvent,
                invocation_id: invocationId,
            })

            expect(res.status).toEqual(200)
            expect(res.body.status).toEqual('success')
        })

        it('generates globals with source metadata', async () => {
            mockFetch.mockImplementationOnce(() =>
                Promise.resolve({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    json: () => Promise.resolve({ ok: true }),
                    text: () => Promise.resolve(JSON.stringify({ ok: true })),
                    dump: () => Promise.resolve(),
                })
            )

            const res = await postInvocation({ datastore_event: datastoreEvent })

            expect(res.status).toEqual(200)

            expect(mockFetch).toHaveBeenCalledTimes(1)
            const fetchBody = parseJSON(mockFetch.mock.calls[0][1].body)
            expect(fetchBody).toMatchObject({
                event: expect.objectContaining({
                    uuid: 'b3a1fe86-b10c-43cc-acaf-d208977608d0',
                    event: '$pageview',
                    distinct_id: '123',
                }),
            })
        })

        it('produces monitoring metrics', async () => {
            mockFetch.mockImplementationOnce(() =>
                Promise.resolve({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    json: () => Promise.resolve({ ok: true }),
                    text: () => Promise.resolve(JSON.stringify({ ok: true })),
                    dump: () => Promise.resolve(),
                })
            )

            await postInvocation({ datastore_event: datastoreEvent })
            await api['batchExportInsightsFunctionService'].stop()

            const metrics = mockProducerObserver
                .getProducedKafkaMessagesForTopic('datastore_app_metrics2_test')
                .map((x) => x.value) as any[]

            expect(metrics).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        metric_name: 'succeeded',
                    }),
                ])
            )
        })
    })

    describe('execution errors', () => {
        it('returns error log when fetch returns 500', async () => {
            mockFetch.mockImplementation(() =>
                Promise.resolve({
                    status: 500,
                    headers: { 'Content-Type': 'text/plain' },
                    json: () => Promise.reject(new Error('not json')),
                    text: () => Promise.resolve('Internal Server Error'),
                    dump: () => Promise.resolve(),
                })
            )

            const res = await postInvocation({ datastore_event: datastoreEvent })

            expect(res.status).toEqual(200)
            expect(res.body.logs).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        level: 'error',
                        message: expect.stringContaining('HTTP fetch failed'),
                    }),
                ])
            )
        })
    })

    describe('groups enrichment', () => {
        let originalGroupsManager: GroupsManagerService

        beforeEach(() => {
            originalGroupsManager = api['batchExportInsightsFunctionService']['groupsManager']
        })

        afterEach(() => {
            api['batchExportInsightsFunctionService']['groupsManager'] = originalGroupsManager
        })

        const setupGroups = async () => {
            await updateOrganizationAvailableFeatures(hub.postgres, team.organization_id, [
                { key: 'data_pipelines', name: 'Data Pipelines' },
                { key: 'group_analytics', name: 'Group Analytics' },
            ])
            hub.teamManager['lazyLoader'].clear()

            const mockGroupRepo: GroupReadRepository = {
                fetchGroupsByKeys: jest.fn().mockResolvedValue([
                    {
                        team_id: team.id as TeamId,
                        group_type_index: 0 as GroupTypeIndex,
                        group_key: 'acme-inc',
                        group_properties: { name: 'Acme Inc', industry: 'Tech' },
                    },
                ]),
                fetchGroupTypesByTeamIds: jest.fn().mockImplementation((teamIds: number[]) => {
                    const result: Record<string, { group_type: string; group_type_index: GroupTypeIndex }[]> = {}
                    for (const id of teamIds) {
                        result[id.toString()] = [{ group_type: 'company', group_type_index: 0 as GroupTypeIndex }]
                    }
                    return Promise.resolve(result)
                }),
                fetchGroupTypesByProjectIds: jest.fn().mockResolvedValue({}),
            }

            api['batchExportInsightsFunctionService']['groupsManager'] = new GroupsManagerService(
                hub.teamManager,
                mockGroupRepo
            )
        }

        it('enriches globals with group properties when event has $groups', async () => {
            await setupGroups()

            datastoreEvent.properties = JSON.stringify({
                $lib_version: '1.0.0',
                $groups: { company: 'acme-inc' },
            })

            mockFetch.mockImplementationOnce(() =>
                Promise.resolve({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    json: () => Promise.resolve({ ok: true }),
                    text: () => Promise.resolve(JSON.stringify({ ok: true })),
                    dump: () => Promise.resolve(),
                })
            )

            const res = await postInvocation({ datastore_event: datastoreEvent })

            expect(res.status).toEqual(200)
            expect(res.body.status).toEqual('success')

            const fetchBody = parseJSON(mockFetch.mock.calls[0][1].body)
            expect(fetchBody.groups).toMatchObject({
                company: expect.objectContaining({
                    id: 'acme-inc',
                    type: 'company',
                    properties: { name: 'Acme Inc', industry: 'Tech' },
                }),
            })
        })

        it('returns empty groups when event has no $groups property', async () => {
            await setupGroups()

            mockFetch.mockImplementationOnce(() =>
                Promise.resolve({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    json: () => Promise.resolve({ ok: true }),
                    text: () => Promise.resolve(JSON.stringify({ ok: true })),
                    dump: () => Promise.resolve(),
                })
            )

            const res = await postInvocation({ datastore_event: datastoreEvent })

            expect(res.status).toEqual(200)

            const fetchBody = parseJSON(mockFetch.mock.calls[0][1].body)
            expect(fetchBody.groups).toEqual({})
        })

        it('returns empty groups when team lacks group_analytics feature', async () => {
            datastoreEvent.properties = JSON.stringify({
                $lib_version: '1.0.0',
                $groups: { company: 'acme-inc' },
            })

            mockFetch.mockImplementationOnce(() =>
                Promise.resolve({
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                    json: () => Promise.resolve({ ok: true }),
                    text: () => Promise.resolve(JSON.stringify({ ok: true })),
                    dump: () => Promise.resolve(),
                })
            )

            const res = await postInvocation({ datastore_event: datastoreEvent })

            expect(res.status).toEqual(200)

            const fetchBody = parseJSON(mockFetch.mock.calls[0][1].body)
            expect(fetchBody.groups).toEqual({})
        })
    })
})
