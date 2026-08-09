import { FixtureFlowBuilder } from '~/cdp/_tests/builders/flow.builder'
import { createExampleFlowInvocation } from '~/cdp/_tests/fixtures-flows'
import { FlowAction } from '~/cdp/schema/flow'
import { CyclotronJobInvocationFlow } from '~/cdp/types'

import { findActionById, findActionByType } from '../flow-utils'
import { getRandomCohort } from './random_cohort_branch'

describe('getRandomCohort', () => {
    let action: Extract<FlowAction, { type: 'random_cohort_branch' }>
    let invocation: CyclotronJobInvocationFlow

    beforeEach(() => {
        jest.useFakeTimers()
        jest.spyOn(Math, 'random')

        const flow = new FixtureFlowBuilder()
            .withWorkflow({
                actions: {
                    random_cohort_branch: {
                        type: 'random_cohort_branch',
                        config: {
                            cohorts: [{ percentage: 30 }, { percentage: 40 }, { percentage: 30 }],
                        },
                    },
                    cohort_a: {
                        type: 'delay',
                        config: { delay_duration: '2h' },
                    },
                    cohort_b: {
                        type: 'delay',
                        config: { delay_duration: '2h' },
                    },
                    cohort_c: {
                        type: 'delay',
                        config: { delay_duration: '2h' },
                    },
                },
                edges: [
                    {
                        from: 'random_cohort_branch',
                        to: 'cohort_a',
                        type: 'branch',
                        index: 0,
                    },
                    {
                        from: 'random_cohort_branch',
                        to: 'cohort_b',
                        type: 'branch',
                        index: 1,
                    },
                    {
                        from: 'random_cohort_branch',
                        to: 'cohort_c',
                        type: 'branch',
                        index: 2,
                    },
                ],
            })
            .build()

        action = findActionByType(flow, 'random_cohort_branch')!
        invocation = createExampleFlowInvocation(flow)
    })

    it('should select first cohort when random is in first range', () => {
        ;(Math.random as jest.Mock).mockReturnValue(0.2) // 20% - in first cohort range
        const result = getRandomCohort(invocation, action)
        expect(result).toEqual(findActionById(invocation.flow, 'cohort_a'))
    })

    it('should select second cohort when random is in second range', () => {
        ;(Math.random as jest.Mock).mockReturnValue(0.4) // 40% - in second cohort range
        const result = getRandomCohort(invocation, action)
        expect(result).toEqual(findActionById(invocation.flow, 'cohort_b'))
    })

    it('should select third cohort when random is in third range', () => {
        ;(Math.random as jest.Mock).mockReturnValue(0.8) // 80% - in third cohort range
        const result = getRandomCohort(invocation, action)
        expect(result).toEqual(findActionById(invocation.flow, 'cohort_c'))
    })

    it('should handle edge cases at boundaries', () => {
        ;(Math.random as jest.Mock).mockReturnValue(0.3) // Exactly at first boundary
        const result = getRandomCohort(invocation, action)
        expect(result).toEqual(findActionById(invocation.flow, 'cohort_a'))
        ;(Math.random as jest.Mock).mockReturnValue(0.7) // Exactly at second boundary
        const result2 = getRandomCohort(invocation, action)
        expect(result2).toEqual(findActionById(invocation.flow, 'cohort_b'))
    })

    it.each([
        ['missing', undefined],
        ['empty', []],
        ['not an array', { percentage: 50 }],
        ['all zero', [{ percentage: 0 }, { percentage: 0 }]],
    ])('should fall through the continue edge when cohorts is %s', (_name, cohorts) => {
        const flow = new FixtureFlowBuilder()
            .withWorkflow({
                actions: {
                    broken_branch: {
                        type: 'random_cohort_branch',
                        config: { cohorts: [] },
                    },
                    after: {
                        type: 'delay',
                        config: { delay_duration: '2h' },
                    },
                },
                edges: [
                    {
                        from: 'broken_branch',
                        to: 'after',
                        type: 'continue',
                    },
                ],
            })
            .build()
        const brokenAction = findActionByType(flow, 'random_cohort_branch')!
        ;(brokenAction.config as any).cohorts = cohorts

        const result = getRandomCohort(createExampleFlowInvocation(flow), brokenAction)
        expect(result).toEqual(findActionById(flow, 'after'))
    })

    it('should handle single cohort', () => {
        action.config.cohorts = [{ percentage: 100 }]
        ;(Math.random as jest.Mock).mockReturnValue(0.9)
        const result = getRandomCohort(invocation, action)
        expect(result).toEqual(findActionById(invocation.flow, 'cohort_a'))
    })

    it('should handle uneven percentages', () => {
        action.config.cohorts = [{ percentage: 25 }, { percentage: 75 }]
        ;(Math.random as jest.Mock).mockReturnValue(0.5) // 50% - in second cohort range
        const result = getRandomCohort(invocation, action)
        expect(result).toEqual(findActionById(invocation.flow, 'cohort_b'))
    })

    it.each([
        ['first', 0.49, 'cohort_a'],
        ['second', 0.51, 'cohort_b'],
    ])(
        'should keep an even split proportional when percentages dont add up to 100 (%s half)',
        (_name, random, expected) => {
            // Two cohorts at 30% each are a 50/50 split, not 30/30/40-to-the-last-cohort.
            action.config.cohorts = [{ percentage: 30 }, { percentage: 30 }]
            ;(Math.random as jest.Mock).mockReturnValue(random)
            expect(getRandomCohort(invocation, action)).toEqual(findActionById(invocation.flow, expected))
        }
    )
})
