import { Client, Connection } from '@hanzoai/tasks'

import { Hub, RawKafkaEvent } from '~/types'
import { closeHub, createHub } from '~/utils/db/hub'

import { TemporalService } from './temporal.service'

jest.mock('@hanzoai/tasks')

const createMockEvent = (overrides: Partial<RawKafkaEvent> = {}): RawKafkaEvent => {
    return {
        uuid: 'event-456',
        event: '$ai_generation',
        properties: '{}',
        timestamp: '2024-01-01T00:00:00Z',
        team_id: 1,
        distinct_id: 'test-user',
        elements_chain: '',
        created_at: '2024-01-01T00:00:00Z',
        project_id: 1,
        ...overrides,
    } as RawKafkaEvent
}

describe('TemporalService', () => {
    let hub: Hub
    let service: TemporalService
    let mockClient: jest.Mocked<Client>
    let mockConnection: jest.Mocked<Connection>
    let mockWorkflowHandle: any

    beforeEach(async () => {
        hub = await createHub()
        hub.TEMPORAL_HOST = 'localhost'
        hub.TEMPORAL_PORT = '7233'
        hub.TEMPORAL_NAMESPACE = 'test-namespace'

        mockWorkflowHandle = {
            workflowId: 'test-workflow-id',
        }

        mockConnection = {
            close: jest.fn().mockResolvedValue(undefined),
        } as any

        mockClient = {
            workflow: {
                start: jest.fn().mockResolvedValue(mockWorkflowHandle),
            },
            connection: mockConnection,
        } as any
        ;(Connection.connect as jest.Mock) = jest.fn().mockResolvedValue(mockConnection)
        ;(Client.create as jest.Mock) = jest.fn().mockResolvedValue(mockClient)

        service = new TemporalService(hub)
    })

    afterEach(async () => {
        await closeHub(hub)
        jest.clearAllMocks()
    })

    describe('connection management', () => {
        it('connects to the Hanzo Tasks engine with an IAM bearer', async () => {
            await service.startEvaluationRunWorkflow('test', createMockEvent({ uuid: 'test-uuid' }))

            expect(Connection.connect).toHaveBeenCalledWith({
                address: 'localhost:7233',
                token: expect.any(Function),
            })
            expect(Client.create).toHaveBeenCalledWith({
                connection: mockConnection,
                namespace: 'test-namespace',
            })
        })

        it('defaults to cloud.hanzo.svc:9999 when host/port are unset', async () => {
            hub.TEMPORAL_HOST = ''
            hub.TEMPORAL_PORT = ''
            const newService = new TemporalService(hub)

            await newService.startEvaluationRunWorkflow('test', createMockEvent({ uuid: 'test-uuid' }))

            expect(Connection.connect).toHaveBeenCalledWith({
                address: 'cloud.hanzo.svc:9999',
                token: expect.any(Function),
            })
        })

        it('disconnects the connection properly', async () => {
            await service.startEvaluationRunWorkflow('test', createMockEvent({ uuid: 'test-uuid' }))
            await service.disconnect()

            expect(mockConnection.close).toHaveBeenCalled()
        })
    })

    describe('workflow triggering', () => {
        it('starts evaluation run workflow with correct parameters', async () => {
            const mockEvent = createMockEvent({ properties: { $ai_input: 'test', $ai_output: 'response' } as any })

            await service.startEvaluationRunWorkflow('eval-123', mockEvent)

            expect(mockClient.workflow.start).toHaveBeenCalledWith('run-evaluation', {
                taskQueue: 'llm-analytics-evals-task-queue',
                workflowId: 'eval-123-event-456-ingestion',
                workflowIdConflictPolicy: 'USE_EXISTING',
                workflowTaskTimeout: '2 minutes',
                args: [
                    {
                        evaluation_id: 'eval-123',
                        event_data: mockEvent,
                    },
                ],
            })
        })

        it('generates deterministic workflow IDs', async () => {
            const mockEvent = createMockEvent()

            await service.startEvaluationRunWorkflow('eval-123', mockEvent)
            await service.startEvaluationRunWorkflow('eval-123', mockEvent)

            const calls = (mockClient.workflow.start as jest.Mock).mock.calls
            const workflowId1 = calls[0][1].workflowId
            const workflowId2 = calls[1][1].workflowId

            expect(workflowId1).toEqual(workflowId2)
            expect(workflowId1).toBe('eval-123-event-456-ingestion')
        })

        it('generates different workflow IDs for different events', async () => {
            const mockEvent1 = createMockEvent({ uuid: 'event-1' })
            const mockEvent2 = createMockEvent({ uuid: 'event-2' })

            await service.startEvaluationRunWorkflow('eval-123', mockEvent1)
            await service.startEvaluationRunWorkflow('eval-123', mockEvent2)

            const calls = (mockClient.workflow.start as jest.Mock).mock.calls
            const workflowId1 = calls[0][1].workflowId
            const workflowId2 = calls[1][1].workflowId

            expect(workflowId1).not.toEqual(workflowId2)
            expect(workflowId1).toBe('eval-123-event-1-ingestion')
            expect(workflowId2).toBe('eval-123-event-2-ingestion')
        })

        it('returns workflow handle on success', async () => {
            const handle = await service.startEvaluationRunWorkflow('eval-123', createMockEvent())

            expect(handle).toBeDefined()
            expect(handle).toBe(mockWorkflowHandle)
        })

        it('throws on workflow start failure', async () => {
            ;(mockClient.workflow.start as jest.Mock).mockRejectedValue(new Error('Hanzo Tasks unavailable'))

            await expect(service.startEvaluationRunWorkflow('eval-123', createMockEvent())).rejects.toThrow(
                'Hanzo Tasks unavailable'
            )
        })
    })
})
