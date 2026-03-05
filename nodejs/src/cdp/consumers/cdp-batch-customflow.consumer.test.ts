import { CustomFlow } from '~/schema/customflow'
import { UUIDT } from '~/utils/utils'

import { getFirstTeam, resetTestDatabase } from '../../../tests/helpers/sql'
import { Hub, Team } from '../../types'
import { closeHub, createHub } from '../../utils/db/hub'
import { FixtureCustomFlowBuilder } from '../_tests/builders/customflow.builder'
import { createKafkaMessage } from '../_tests/fixtures'
import { insertCustomFlow as _insertCustomFlow } from '../_tests/fixtures-customflows'
import { CyclotronJobQueue } from '../services/job-queue/job-queue'
import { BatchCustomFlowRequest, CdpBatchCustomFlowRequestsConsumer } from './cdp-batch-customflow.consumer'

jest.setTimeout(1000)

describe('CdpBatchCustomFlowRequestsConsumer', () => {
    let processor: CdpBatchCustomFlowRequestsConsumer
    let hub: Hub
    let team: Team
    let mockQueueInvocations: jest.Mock

    const insertCustomFlow = async (customFlow: CustomFlow) => {
        const teamId = customFlow.team_id ?? team.id
        const item = await _insertCustomFlow(hub.postgres, {
            ...customFlow,
            team_id: teamId,
        })
        // Trigger the reload that django would do
        processor['customFunctionManager']['onCustomFunctionsReloaded'](teamId, [item.id])
        return item
    }

    beforeEach(async () => {
        await resetTestDatabase()
        hub = await createHub()
        team = await getFirstTeam(hub)

        processor = new CdpBatchCustomFlowRequestsConsumer(hub)

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

    describe('_parseKafkaBatch', () => {
        it('should parse valid batch custom flow request messages', async () => {
            const customFlow = await insertCustomFlow(
                new FixtureCustomFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'batch',
                            filters: { properties: [] },
                        },
                    })
                    .build()
            )

            const batchRequest: BatchCustomFlowRequest = {
                teamId: team.id,
                customFlowId: customFlow.id,
                parentRunId: new UUIDT().toString(),
                filters: {
                    properties: [{ key: 'email', value: 'test@example.com', operator: 'exact', type: 'person' }],
                    filter_test_accounts: false,
                },
            }

            const messages = [createKafkaMessage(batchRequest)]

            const result = await processor._parseKafkaBatch(messages)

            expect(result).toHaveLength(1)
            expect(result[0]).toMatchObject({
                batchCustomFlowRequest: batchRequest,
                team: expect.objectContaining({ id: team.id }),
                customFlow: expect.objectContaining({ id: customFlow.id }),
            })
        })

        it('should filter out messages with missing custom flows', async () => {
            const batchRequest: BatchCustomFlowRequest = {
                teamId: team.id,
                customFlowId: 'non-existent-id',
                parentRunId: new UUIDT().toString(),
                filters: {
                    properties: [{ key: 'email', value: 'test@example.com', operator: 'exact', type: 'person' }],
                },
            }

            const messages = [createKafkaMessage(batchRequest)]

            const result = await processor._parseKafkaBatch(messages)

            expect(result).toHaveLength(0)
        })

        it('should filter out messages with missing teams', async () => {
            const customFlow = await insertCustomFlow(
                new FixtureCustomFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'batch',
                            filters: { properties: [] },
                        },
                    })
                    .build()
            )

            const batchRequest: BatchCustomFlowRequest = {
                teamId: 999999, // Non-existent team
                customFlowId: customFlow.id,
                parentRunId: new UUIDT().toString(),
                filters: {
                    properties: [{ key: 'email', value: 'test@example.com', operator: 'exact', type: 'person' }],
                },
            }

            const messages = [createKafkaMessage(batchRequest)]

            const result = await processor._parseKafkaBatch(messages)

            expect(result).toHaveLength(0)
        })

        it('should handle malformed messages gracefully', async () => {
            const messages = [
                {
                    partition: 1,
                    topic: 'test',
                    offset: 0,
                    timestamp: Date.now(),
                    size: 1,
                    value: Buffer.from('invalid json'),
                },
            ]

            const result = await processor._parseKafkaBatch(messages as any)

            expect(result).toHaveLength(0)
        })

        it('should filter out messages with draft customflow status', async () => {
            const customFlow = await insertCustomFlow(
                new FixtureCustomFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'batch',
                            filters: { properties: [] },
                        },
                    })
                    .withStatus('draft')
                    .build()
            )

            const batchRequest: BatchCustomFlowRequest = {
                teamId: team.id,
                customFlowId: customFlow.id,
                parentRunId: new UUIDT().toString(),
                filters: {
                    properties: [{ key: 'email', value: 'test@example.com', operator: 'exact', type: 'person' }],
                },
            }

            const messages = [createKafkaMessage(batchRequest)]

            const result = await processor._parseKafkaBatch(messages)

            expect(result).toHaveLength(0)
        })

        it('should filter out messages with archived customflow status', async () => {
            const customFlow = await insertCustomFlow(
                new FixtureCustomFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'batch',
                            filters: { properties: [] },
                        },
                    })
                    .withStatus('archived')
                    .build()
            )

            const batchRequest: BatchCustomFlowRequest = {
                teamId: team.id,
                customFlowId: customFlow.id,
                parentRunId: new UUIDT().toString(),
                filters: {
                    properties: [{ key: 'email', value: 'test@example.com', operator: 'exact', type: 'person' }],
                },
            }

            const messages = [createKafkaMessage(batchRequest)]

            const result = await processor._parseKafkaBatch(messages)

            expect(result).toHaveLength(0)
        })
    })

    describe('createCustomFlowInvocations', () => {
        it('should return empty array if filters.properties is missing', async () => {
            const customFlow = await insertCustomFlow(
                new FixtureCustomFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'batch',
                            filters: {} as any,
                        },
                    })
                    .build()
            )

            const batchRequest: BatchCustomFlowRequest = {
                teamId: team.id,
                customFlowId: customFlow.id,
                parentRunId: new UUIDT().toString(),
                filters: {},
            }

            const result = await processor['createCustomFlowInvocations']({
                batchCustomFlowRequest: batchRequest,
                team,
                customFlow,
            })

            expect(result).toHaveLength(0)
        })

        it('should create invocations for matching persons', async () => {
            const customFlow = await insertCustomFlow(
                new FixtureCustomFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'batch',
                            filters: { properties: [] },
                        },
                    })
                    .build()
            )

            // Mock the personsManager to return some persons
            const mockCountMany = jest.fn().mockResolvedValue(2)
            const mockStreamMany = jest.fn().mockImplementation(async ({ onPersonBatch }: any) => {
                await onPersonBatch([
                    { personId: 'person-1', distinctId: 'distinct-1' },
                    { personId: 'person-2', distinctId: 'distinct-2' },
                ])
            })

            processor['clickHousePersonsManager'].countMany = mockCountMany
            processor['clickHousePersonsManager'].streamMany = mockStreamMany

            // Mock rate limiter to not limit
            jest.spyOn(processor['scriptRateLimiter'], 'rateLimitMany').mockResolvedValue([
                [customFlow.id, { isRateLimited: false, tokens: 100 }],
            ])

            const batchRequest: BatchCustomFlowRequest = {
                teamId: team.id,
                customFlowId: customFlow.id,
                parentRunId: new UUIDT().toString(),
                filters: {
                    properties: [{ key: 'email', value: 'test@example.com', operator: 'exact', type: 'person' }],
                },
            }

            const result = await processor['createCustomFlowInvocations']({
                batchCustomFlowRequest: batchRequest,
                team,
                customFlow,
            })

            expect(result).toHaveLength(2)
            expect(result[0]).toMatchObject({
                id: expect.any(String),
                teamId: team.id,
                functionId: customFlow.id,
                parentRunId: batchRequest.parentRunId,
                queue: 'customflow',
                queuePriority: 1,
                state: {
                    event: expect.objectContaining({
                        event: '$batch_custom_flow_invocation',
                        distinct_id: 'distinct-1',
                    }),
                    actionStepCount: 0,
                },
                person: expect.objectContaining({
                    id: 'person-1',
                }),
            })
            expect(result[1]).toMatchObject({
                id: expect.any(String),
                teamId: team.id,
                parentRunId: batchRequest.parentRunId,
                functionId: customFlow.id,
                queue: 'customflow',
                queuePriority: 1,
                state: {
                    event: expect.objectContaining({
                        event: '$batch_custom_flow_invocation',
                        distinct_id: 'distinct-2',
                    }),
                    actionStepCount: 0,
                },
                person: expect.objectContaining({
                    id: 'person-2',
                }),
            })

            expect(mockCountMany).toHaveBeenCalledWith({
                teamId: team.id,
                properties: batchRequest.filters.properties,
            })
            expect(mockStreamMany).toHaveBeenCalledWith({
                filters: {
                    teamId: team.id,
                    properties: batchRequest.filters.properties,
                },
                onPersonBatch: expect.any(Function),
            })
        })

        it('should include default variables from customFlow', async () => {
            const customFlow = await insertCustomFlow(
                new FixtureCustomFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'batch',
                            filters: { properties: [] },
                        },
                    })
                    .build()
            )

            // Add variables to customFlow
            customFlow.variables = [
                { key: 'customVar1', type: 'string', label: 'Custom Var 1', default: 'defaultValue1' },
                { key: 'customVar2', type: 'number', label: 'Custom Var 2', default: 42 },
                { key: 'customVar3', type: 'string', label: 'Custom Var 3' }, // No default
            ]

            // Mock the personsManager
            const mockStreamMany = jest.fn().mockImplementation(async ({ onPersonBatch }: any) => {
                await onPersonBatch([{ personId: 'person-1', distinctId: 'distinct-1' }])
            })
            jest.spyOn(processor['clickHousePersonsManager'], 'countMany').mockResolvedValue(1)
            processor['clickHousePersonsManager'].streamMany = mockStreamMany

            // Mock rate limiter
            jest.spyOn(processor['scriptRateLimiter'], 'rateLimitMany').mockResolvedValue([
                [customFlow.id, { isRateLimited: false, tokens: 100 }],
            ])

            const batchRequest: BatchCustomFlowRequest = {
                teamId: team.id,
                customFlowId: customFlow.id,
                parentRunId: new UUIDT().toString(),
                filters: {
                    properties: [{ key: 'email', value: 'test@example.com', operator: 'exact', type: 'person' }],
                },
            }

            const result = await processor['createCustomFlowInvocations']({
                batchCustomFlowRequest: batchRequest,
                team,
                customFlow,
            })

            expect(result).toHaveLength(1)
            expect(result[0].state?.variables).toEqual({
                customVar1: 'defaultValue1',
                customVar2: 42,
                customVar3: null,
            })
        })
    })

    describe('processBatch', () => {
        it('should process batch and queue invocations', async () => {
            const customFlow = await insertCustomFlow(
                new FixtureCustomFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'batch',
                            filters: { properties: [] },
                        },
                    })
                    .build()
            )

            // Mock the personsManager
            const mockStreamMany = jest.fn().mockImplementation(async ({ onPersonBatch }: any) => {
                await onPersonBatch([{ personId: 'person-1', distinctId: 'distinct-1' }])
            })
            jest.spyOn(processor['clickHousePersonsManager'], 'countMany').mockResolvedValue(1)
            processor['clickHousePersonsManager'].streamMany = mockStreamMany

            // Mock rate limiter
            jest.spyOn(processor['scriptRateLimiter'], 'rateLimitMany').mockResolvedValue([
                [customFlow.id, { isRateLimited: false, tokens: 100 }],
            ])

            const batchRequest: BatchCustomFlowRequest = {
                teamId: team.id,
                customFlowId: customFlow.id,
                parentRunId: new UUIDT().toString(),
                filters: {
                    properties: [{ key: 'email', value: 'test@example.com', operator: 'exact', type: 'person' }],
                },
            }

            const batchCustomFlowRequestMessages = [
                {
                    batchCustomFlowRequest: batchRequest,
                    team,
                    customFlow,
                },
            ]

            const { invocations, backgroundTask } = await processor['processBatch'](batchCustomFlowRequestMessages)

            expect(invocations).toHaveLength(1)
            expect(mockQueueInvocations).toHaveBeenCalledWith(invocations)

            // Wait for background task to complete
            await backgroundTask
        })

        it('should handle empty batch', async () => {
            const { invocations, backgroundTask } = await processor['processBatch']([])

            expect(invocations).toHaveLength(0)
            expect(mockQueueInvocations).not.toHaveBeenCalled()

            await backgroundTask
        })

        it('should process multiple requests in batch', async () => {
            const customFlow1 = await insertCustomFlow(
                new FixtureCustomFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'batch',
                            filters: { properties: [] },
                        },
                    })
                    .build()
            )

            const customFlow2 = await insertCustomFlow(
                new FixtureCustomFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'batch',
                            filters: { properties: [] },
                        },
                    })
                    .build()
            )

            // Mock the personsManager
            const mockStreamMany = jest.fn().mockImplementation(async ({ onPersonBatch }: any) => {
                await onPersonBatch([{ personId: 'person-1', distinctId: 'distinct-1' }])
            })
            jest.spyOn(processor['clickHousePersonsManager'], 'countMany').mockResolvedValue(1)
            processor['clickHousePersonsManager'].streamMany = mockStreamMany

            // Mock rate limiter
            jest.spyOn(processor['scriptRateLimiter'], 'rateLimitMany').mockResolvedValue([
                [customFlow1.id, { isRateLimited: false, tokens: 100 }],
                [customFlow2.id, { isRateLimited: false, tokens: 100 }],
            ])

            const batchRequest1: BatchCustomFlowRequest = {
                teamId: team.id,
                customFlowId: customFlow1.id,
                parentRunId: new UUIDT().toString(),
                filters: {
                    properties: [{ key: 'email', value: 'test1@example.com', operator: 'exact', type: 'person' }],
                },
            }

            const batchRequest2: BatchCustomFlowRequest = {
                teamId: team.id,
                customFlowId: customFlow2.id,
                parentRunId: new UUIDT().toString(),
                filters: {
                    properties: [{ key: 'email', value: 'test2@example.com', operator: 'exact', type: 'person' }],
                },
            }

            const batchCustomFlowRequestMessages = [
                { batchCustomFlowRequest: batchRequest1, team, customFlow: customFlow1 },
                { batchCustomFlowRequest: batchRequest2, team, customFlow: customFlow2 },
            ]

            const { invocations, backgroundTask } = await processor['processBatch'](batchCustomFlowRequestMessages)

            expect(invocations).toHaveLength(2)
            expect(mockQueueInvocations).toHaveBeenCalledWith(invocations)
            expect(invocations[0].functionId).toBe(customFlow1.id)
            expect(invocations[1].functionId).toBe(customFlow2.id)

            await backgroundTask
        })
    })

    describe('integration', () => {
        it('should process end-to-end from kafka messages to queued invocations', async () => {
            const customFlow = await insertCustomFlow(
                new FixtureCustomFlowBuilder()
                    .withTeamId(team.id)
                    .withSimpleWorkflow({
                        trigger: {
                            type: 'batch',
                            filters: { properties: [] },
                        },
                    })
                    .build()
            )

            // Mock the personsManager
            const mockStreamMany = jest.fn().mockImplementation(async ({ onPersonBatch }: any) => {
                await onPersonBatch([
                    { personId: 'person-1', distinctId: 'distinct-1' },
                    { personId: 'person-2', distinctId: 'distinct-2' },
                ])
            })
            jest.spyOn(processor['clickHousePersonsManager'], 'countMany').mockResolvedValue(2)
            processor['clickHousePersonsManager'].streamMany = mockStreamMany

            // Mock rate limiter
            jest.spyOn(processor['scriptRateLimiter'], 'rateLimitMany').mockResolvedValue([
                [customFlow.id, { isRateLimited: false, tokens: 100 }],
            ])

            const batchRequest: BatchCustomFlowRequest = {
                teamId: team.id,
                customFlowId: customFlow.id,
                parentRunId: new UUIDT().toString(),
                filters: {
                    properties: [{ key: 'email', value: 'test@example.com', operator: 'exact', type: 'person' }],
                },
            }

            const messages = [createKafkaMessage(batchRequest)]

            // Parse Kafka messages
            const parsedMessages = await processor._parseKafkaBatch(messages)
            expect(parsedMessages).toHaveLength(1)

            // Process the batch
            const { invocations, backgroundTask } = await processor['processBatch'](parsedMessages)

            expect(invocations).toHaveLength(2)
            expect(invocations[0]).toMatchObject({
                teamId: team.id,
                functionId: customFlow.id,
                queue: 'customflow',
                state: {
                    event: expect.objectContaining({
                        distinct_id: 'distinct-1',
                    }),
                },
            })
            expect(invocations[1]).toMatchObject({
                teamId: team.id,
                functionId: customFlow.id,
                queue: 'customflow',
                state: {
                    event: expect.objectContaining({
                        distinct_id: 'distinct-2',
                    }),
                },
            })

            expect(mockQueueInvocations).toHaveBeenCalledWith(invocations)

            await backgroundTask
        })
    })
})
