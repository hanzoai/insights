import { QuotaLimiting } from '../../../common/services/quota-limiting.service'
import { CustomFlow } from '../../../schema/customflow'
import { CyclotronJobInvocationCustomFlow } from '../../types'
import { CustomFunctionMonitoringService } from '../monitoring/custom-function-monitoring.service'
import {
    checkCustomFlowQuotaLimits,
    counterCustomFlowQuotaLimited,
    shouldBlockCustomFlowDueToQuota,
} from './customflow-quota-limiting'

describe('CustomFlow Quota Limiting', () => {
    let mockQuotaLimiting: jest.Mocked<QuotaLimiting>

    beforeEach(() => {
        mockQuotaLimiting = {
            isTeamQuotaLimited: jest.fn(),
        } as any
    })

    describe('checkCustomFlowQuotaLimits', () => {
        const teamId = 123
        const baseCustomFlow: CustomFlow = {
            id: 'test-flow',
            team_id: teamId,
            name: 'Test Flow',
            description: '',
            enabled: true,
            actions: [],
            trigger: { type: 'event' },
            billable_action_types: [],
        } as unknown as CustomFlow

        it('should not limit workflow when team has no quota limits', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(false)

            const customFlow: CustomFlow = {
                ...baseCustomFlow,
                actions: [{ type: 'function_email' } as any, { type: 'function' } as any],
                billable_action_types: ['function_email', 'function'],
            }

            const result = await checkCustomFlowQuotaLimits(customFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledTimes(2)
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(teamId, 'workflow_emails')
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(
                teamId,
                'workflow_destinations_dispatched'
            )
        })

        it('should limit workflow with email action when team has email quota limit', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockImplementation((_teamId, resource) => {
                return Promise.resolve(resource === 'workflow_emails')
            })

            const customFlow: CustomFlow = {
                ...baseCustomFlow,
                actions: [{ type: 'function_email' } as any, { type: 'function' } as any],
                billable_action_types: ['function_email', 'function'],
            }

            const result = await checkCustomFlowQuotaLimits(customFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(true)
        })

        it('should limit workflow with destination action when team has destination quota limit', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockImplementation((_teamId, resource) => {
                return Promise.resolve(resource === 'workflow_destinations_dispatched')
            })

            const customFlow: CustomFlow = {
                ...baseCustomFlow,
                actions: [{ type: 'delay' } as any, { type: 'function' } as any, { type: 'function_email' } as any],
                billable_action_types: ['function', 'function_email'],
            }

            const result = await checkCustomFlowQuotaLimits(customFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(true)
        })

        it('should not limit workflow with no billable action types', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(true)

            const customFlow: CustomFlow = {
                ...baseCustomFlow,
                actions: [{ type: 'delay' } as any, { type: 'conditional_branch' } as any],
                billable_action_types: [],
            }

            const result = await checkCustomFlowQuotaLimits(customFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).not.toHaveBeenCalled()
        })

        it('should not limit workflow when billable_action_types is null', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(true)

            const customFlow: CustomFlow = {
                ...baseCustomFlow,
                actions: [{ type: 'function' } as any],
                billable_action_types: null,
            }

            const result = await checkCustomFlowQuotaLimits(customFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).not.toHaveBeenCalled()
        })

        it('should not check quota limits when billable_action_types is undefined', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(true)

            const customFlow: CustomFlow = {
                ...baseCustomFlow,
                actions: [{ type: 'function' } as any],
                billable_action_types: undefined,
            }

            const result = await checkCustomFlowQuotaLimits(customFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).not.toHaveBeenCalled()
        })

        it('should only check relevant quota limits based on billable action types', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(false)

            const customFlow: CustomFlow = {
                ...baseCustomFlow,
                actions: [{ type: 'function' } as any, { type: 'delay' } as any],
                billable_action_types: ['function'],
            }

            const result = await checkCustomFlowQuotaLimits(customFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledTimes(2)
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(teamId, 'workflow_emails')
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(
                teamId,
                'workflow_destinations_dispatched'
            )
        })
    })

    describe('shouldBlockCustomFlowDueToQuota', () => {
        let mockCustomFunctionMonitoringService: jest.Mocked<CustomFunctionMonitoringService>
        const teamId = 123
        const baseItem: CyclotronJobInvocationCustomFlow = {
            teamId,
            functionId: 'test-flow-id',
            customFlow: {
                id: 'test-flow',
                team_id: teamId,
                name: 'Test Flow',
                description: '',
                enabled: true,
                actions: [],
                trigger: { type: 'event' },
                billable_action_types: [],
            } as unknown as CustomFlow,
        } as CyclotronJobInvocationCustomFlow

        beforeEach(() => {
            jest.clearAllMocks()
            mockCustomFunctionMonitoringService = {
                queueAppMetric: jest.fn(),
            } as any
            // Reset the counter spy
            jest.spyOn(counterCustomFlowQuotaLimited, 'labels').mockReturnValue({
                inc: jest.fn(),
            } as any)
        })

        it('should not block invocation when not quota limited', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(false)

            const item: CyclotronJobInvocationCustomFlow = {
                ...baseItem,
                customFlow: {
                    ...baseItem.customFlow,
                    billable_action_types: ['function_email'],
                },
            }

            const result = await shouldBlockCustomFlowDueToQuota(item, {
                hub: { quotaLimiting: mockQuotaLimiting },
                customFunctionMonitoringService: mockCustomFunctionMonitoringService,
            })

            expect(result).toBe(false)
            expect(mockCustomFunctionMonitoringService.queueAppMetric).not.toHaveBeenCalled()
            expect(counterCustomFlowQuotaLimited.labels).not.toHaveBeenCalled()
        })

        it('should block invocation and emit metrics when quota limited', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockImplementation((_teamId, resource) => {
                return Promise.resolve(resource === 'workflow_emails')
            })

            const item: CyclotronJobInvocationCustomFlow = {
                ...baseItem,
                customFlow: {
                    ...baseItem.customFlow,
                    billable_action_types: ['function_email'],
                },
            }

            const result = await shouldBlockCustomFlowDueToQuota(item, {
                hub: { quotaLimiting: mockQuotaLimiting },
                customFunctionMonitoringService: mockCustomFunctionMonitoringService,
            })

            expect(result).toBe(true)
            expect(counterCustomFlowQuotaLimited.labels).toHaveBeenCalledWith({ team_id: teamId })
            expect(mockCustomFunctionMonitoringService.queueAppMetric).toHaveBeenCalledWith(
                {
                    team_id: teamId,
                    app_source_id: 'test-flow-id',
                    metric_kind: 'failure',
                    metric_name: 'quota_limited',
                    count: 1,
                },
                'custom_flow'
            )
        })

        it('should handle workflow with no billable actions', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(false)

            const item: CyclotronJobInvocationCustomFlow = {
                ...baseItem,
                customFlow: {
                    ...baseItem.customFlow,
                    billable_action_types: [],
                },
            }

            const result = await shouldBlockCustomFlowDueToQuota(item, {
                hub: { quotaLimiting: mockQuotaLimiting },
                customFunctionMonitoringService: mockCustomFunctionMonitoringService,
            })

            expect(result).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).not.toHaveBeenCalled()
            expect(mockCustomFunctionMonitoringService.queueAppMetric).not.toHaveBeenCalled()
        })
    })
})
