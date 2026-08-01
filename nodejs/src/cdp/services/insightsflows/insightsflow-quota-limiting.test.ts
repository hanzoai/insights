import { InsightsFlow } from '~/cdp/schema/hogflow'

import { QuotaLimiting } from '../../../common/services/quota-limiting.service'
import { CyclotronJobInvocationInsightsFlow } from '../../types'
import { InsightsFunctionMonitoringService } from '../monitoring/script-function-monitoring.service'
import {
    checkInsightsFlowQuotaLimits,
    counterInsightsFlowQuotaLimited,
    shouldBlockInsightsFlowDueToQuota,
} from './hogflow-quota-limiting'

describe('InsightsFlow Quota Limiting', () => {
    let mockQuotaLimiting: jest.Mocked<QuotaLimiting>

    beforeEach(() => {
        mockQuotaLimiting = {
            isTeamQuotaLimited: jest.fn(),
        } as any
    })

    describe('checkInsightsFlowQuotaLimits', () => {
        const teamId = 123
        const baseInsightsFlow: InsightsFlow = {
            id: 'test-flow',
            team_id: teamId,
            name: 'Test Flow',
            description: '',
            enabled: true,
            actions: [],
            trigger: { type: 'event' },
            billable_action_types: [],
        } as unknown as InsightsFlow

        it('should not limit workflow when team has no quota limits', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(false)

            const hogFlow: InsightsFlow = {
                ...baseInsightsFlow,
                actions: [{ type: 'function_email' } as any, { type: 'function' } as any],
                billable_action_types: ['function_email', 'function'],
            }

            const result = await checkInsightsFlowQuotaLimits(hogFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledTimes(3)
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(teamId, 'workflow_emails')
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(teamId, 'workflow_push')
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(
                teamId,
                'workflow_destinations_dispatched'
            )
        })

        it('should limit workflow with email action when team has email quota limit', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockImplementation((_teamId, resource) => {
                return Promise.resolve(resource === 'workflow_emails')
            })

            const hogFlow: InsightsFlow = {
                ...baseInsightsFlow,
                actions: [{ type: 'function_email' } as any, { type: 'function' } as any],
                billable_action_types: ['function_email', 'function'],
            }

            const result = await checkInsightsFlowQuotaLimits(hogFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(true)
        })

        it('should limit workflow with push action when team has push quota limit', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockImplementation((_teamId, resource) => {
                return Promise.resolve(resource === 'workflow_push')
            })

            const hogFlow: InsightsFlow = {
                ...baseInsightsFlow,
                actions: [{ type: 'function_push' } as any, { type: 'function' } as any],
                billable_action_types: ['function_push', 'function'],
            }

            const result = await checkInsightsFlowQuotaLimits(hogFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(true)
        })

        it('should limit workflow with destination action when team has destination quota limit', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockImplementation((_teamId, resource) => {
                return Promise.resolve(resource === 'workflow_destinations_dispatched')
            })

            const hogFlow: InsightsFlow = {
                ...baseInsightsFlow,
                actions: [{ type: 'delay' } as any, { type: 'function' } as any, { type: 'function_email' } as any],
                billable_action_types: ['function', 'function_email'],
            }

            const result = await checkInsightsFlowQuotaLimits(hogFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(true)
        })

        it('should not limit workflow with no billable action types', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(true)

            const hogFlow: InsightsFlow = {
                ...baseInsightsFlow,
                actions: [{ type: 'delay' } as any, { type: 'conditional_branch' } as any],
                billable_action_types: [],
            }

            const result = await checkInsightsFlowQuotaLimits(hogFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).not.toHaveBeenCalled()
        })

        it('should not limit workflow when billable_action_types is null', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(true)

            const hogFlow: InsightsFlow = {
                ...baseInsightsFlow,
                actions: [{ type: 'function' } as any],
                billable_action_types: null,
            }

            const result = await checkInsightsFlowQuotaLimits(hogFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).not.toHaveBeenCalled()
        })

        it('should not check quota limits when billable_action_types is undefined', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(true)

            const hogFlow: InsightsFlow = {
                ...baseInsightsFlow,
                actions: [{ type: 'function' } as any],
                billable_action_types: undefined,
            }

            const result = await checkInsightsFlowQuotaLimits(hogFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).not.toHaveBeenCalled()
        })

        it('should only check relevant quota limits based on billable action types', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(false)

            const hogFlow: InsightsFlow = {
                ...baseInsightsFlow,
                actions: [{ type: 'function' } as any, { type: 'delay' } as any],
                billable_action_types: ['function'],
            }

            const result = await checkInsightsFlowQuotaLimits(hogFlow, teamId, mockQuotaLimiting)

            expect(result.isLimited).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledTimes(3)
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(teamId, 'workflow_emails')
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(teamId, 'workflow_push')
            expect(mockQuotaLimiting.isTeamQuotaLimited).toHaveBeenCalledWith(
                teamId,
                'workflow_destinations_dispatched'
            )
        })
    })

    describe('shouldBlockInsightsFlowDueToQuota', () => {
        let mockInsightsFunctionMonitoringService: jest.Mocked<InsightsFunctionMonitoringService>
        const teamId = 123
        const baseItem: CyclotronJobInvocationInsightsFlow = {
            teamId,
            functionId: 'test-flow-id',
            hogFlow: {
                id: 'test-flow',
                team_id: teamId,
                name: 'Test Flow',
                description: '',
                enabled: true,
                actions: [],
                trigger: { type: 'event' },
                billable_action_types: [],
            } as unknown as InsightsFlow,
        } as CyclotronJobInvocationInsightsFlow

        beforeEach(() => {
            jest.clearAllMocks()
            mockInsightsFunctionMonitoringService = {
                queueAppMetric: jest.fn(),
            } as any
            // Reset the counter spy
            jest.spyOn(counterInsightsFlowQuotaLimited, 'labels').mockReturnValue({
                inc: jest.fn(),
            } as any)
        })

        it('should not block invocation when not quota limited', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(false)

            const item: CyclotronJobInvocationInsightsFlow = {
                ...baseItem,
                hogFlow: {
                    ...baseItem.hogFlow,
                    billable_action_types: ['function_email'],
                },
            }

            const result = await shouldBlockInsightsFlowDueToQuota(item, {
                quotaLimiting: mockQuotaLimiting,
                insightsFunctionMonitoringService: mockInsightsFunctionMonitoringService,
            })

            expect(result).toBe(false)
            expect(mockInsightsFunctionMonitoringService.queueAppMetric).not.toHaveBeenCalled()
            expect(counterInsightsFlowQuotaLimited.labels).not.toHaveBeenCalled()
        })

        it('should block invocation and emit metrics when quota limited', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockImplementation((_teamId, resource) => {
                return Promise.resolve(resource === 'workflow_emails')
            })

            const item: CyclotronJobInvocationInsightsFlow = {
                ...baseItem,
                hogFlow: {
                    ...baseItem.hogFlow,
                    billable_action_types: ['function_email'],
                },
            }

            const result = await shouldBlockInsightsFlowDueToQuota(item, {
                quotaLimiting: mockQuotaLimiting,
                insightsFunctionMonitoringService: mockInsightsFunctionMonitoringService,
            })

            expect(result).toBe(true)
            expect(counterInsightsFlowQuotaLimited.labels).toHaveBeenCalledWith({ team_id: teamId })
            expect(mockInsightsFunctionMonitoringService.queueAppMetric).toHaveBeenCalledWith(
                {
                    team_id: teamId,
                    app_source_id: 'test-flow-id',
                    metric_kind: 'failure',
                    metric_name: 'quota_limited',
                    count: 1,
                },
                'hog_flow'
            )
        })

        it('should handle workflow with no billable actions', async () => {
            mockQuotaLimiting.isTeamQuotaLimited.mockResolvedValue(false)

            const item: CyclotronJobInvocationInsightsFlow = {
                ...baseItem,
                hogFlow: {
                    ...baseItem.hogFlow,
                    billable_action_types: [],
                },
            }

            const result = await shouldBlockInsightsFlowDueToQuota(item, {
                quotaLimiting: mockQuotaLimiting,
                insightsFunctionMonitoringService: mockInsightsFunctionMonitoringService,
            })

            expect(result).toBe(false)
            expect(mockQuotaLimiting.isTeamQuotaLimited).not.toHaveBeenCalled()
            expect(mockInsightsFunctionMonitoringService.queueAppMetric).not.toHaveBeenCalled()
        })
    })
})
