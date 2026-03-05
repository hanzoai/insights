import { DateTime } from 'luxon'

import { FixtureInsightsFlowBuilder } from '~/cdp/_tests/builders/customflow.builder'
import { FN_FILTERS_EXAMPLES } from '~/cdp/_tests/examples'
import { createExampleInsightsFlowInvocation } from '~/cdp/_tests/fixtures-insightsflows'
import { CyclotronJobInvocationInsightsFlow } from '~/cdp/types'
import { InsightsFlow, InsightsFlowAction } from '~/schema/customflow'

import { findActionById, findActionByType } from '../customflow-utils'
import { checkConditions } from './conditional_branch'

describe('action.conditional_branch', () => {
    let invocation: CyclotronJobInvocationInsightsFlow
    let action: Extract<InsightsFlowAction, { type: 'conditional_branch' }>
    let insightsFlow: InsightsFlow

    beforeEach(() => {
        const fixedTime = DateTime.fromObject({ year: 2025, month: 1, day: 1 }, { zone: 'UTC' })
        jest.spyOn(Date, 'now').mockReturnValue(fixedTime.toMillis())

        insightsFlow = new FixtureInsightsFlowBuilder()
            .withWorkflow({
                actions: {
                    conditional_branch: {
                        type: 'conditional_branch',
                        config: {
                            conditions: [
                                {
                                    filters: FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter.filters, // Match for pageviews
                                },
                            ], // Filled by tests
                        },
                    },
                    condition_1: {
                        type: 'delay',
                        config: {
                            delay_duration: '2h',
                        },
                    },
                    condition_2: {
                        type: 'delay',
                        config: {
                            delay_duration: '2h',
                        },
                    },
                },
                edges: [
                    {
                        from: 'conditional_branch',
                        to: 'condition_2',
                        type: 'branch',
                        index: 1,
                    },
                    {
                        from: 'conditional_branch',
                        to: 'condition_1',
                        type: 'branch',
                        index: 0,
                    },
                ],
            })
            .build()

        action = findActionByType(insightsFlow, 'conditional_branch')!
        invocation = createExampleInsightsFlowInvocation(insightsFlow)

        invocation.state.currentAction = {
            id: action.id,
            startedAtTimestamp: DateTime.utc().toMillis(),
        }
    })

    describe('no matching events', () => {
        it('should return finished if no matches', async () => {
            invocation.state.event!.event = 'no-match'
            const result = await checkConditions(invocation, action)
            expect(result).toEqual({})
        })

        describe('wait logic', () => {
            it('should handle wait duration and schedule next check', async () => {
                action.config.delay_duration = '2h'
                const result = await checkConditions(invocation, action)
                expect(result).toEqual({
                    // Should schedule for 10 minutes from now
                    scheduledAt: DateTime.utc().plus({ minutes: 10 }),
                })
            })

            it('should not schedule for later than the max wait duration', async () => {
                action.config.delay_duration = '5m'
                const result = await checkConditions(invocation, action)
                expect(result).toEqual({
                    // Should schedule for 5 minutes from now
                    scheduledAt: DateTime.utc().plus({ minutes: 5 }),
                })
            })

            it('should throw error if action started at timestamp is invalid', async () => {
                invocation.state.currentAction = undefined
                action.config.delay_duration = '300s'
                await expect(async () => checkConditions(invocation, action)).rejects.toThrow(
                    "'startedAtTimestamp' is not set or is invalid"
                )
            })
        })
    })

    describe('matching events', () => {
        beforeEach(() => {
            invocation = createExampleInsightsFlowInvocation(insightsFlow, {
                // These values match the pageview_or_autocapture_filter
                event: {
                    event: '$pageview',
                    properties: {
                        $current_url: 'https://hanzo.ai',
                    },
                } as any,
            })
        })

        it('should match condition and go to action', async () => {
            const result = await checkConditions(invocation, action)
            expect(result).toEqual({
                nextAction: findActionById(invocation.insightsFlow, 'condition_1'),
            })
        })

        it('should ignore conditions that do not match', async () => {
            action.config.conditions = [
                {
                    filters: FN_FILTERS_EXAMPLES.elements_text_filter.filters, // No match
                },
                {
                    filters: FN_FILTERS_EXAMPLES.pageview_or_autocapture_filter.filters, // No match
                },
            ]

            const result = await checkConditions(invocation, action)
            expect(result).toEqual({
                nextAction: findActionById(invocation.insightsFlow, 'condition_2'),
            })
        })
    })
})
