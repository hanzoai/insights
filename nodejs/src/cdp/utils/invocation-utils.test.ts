import { DateTime } from 'luxon'

import { FN_EXAMPLES, FN_FILTERS_EXAMPLES, FN_INPUTS_EXAMPLES } from '../_tests/examples'
import { createHogExecutionGlobals, createInsightsFunction } from '../_tests/fixtures'
import { cloneInvocation, createInvocation } from './invocation-utils'

describe('Invocation utils', () => {
    describe('cloneInvocation', () => {
        beforeEach(() => {
            const fixedTime = DateTime.fromObject({ year: 2025, month: 1, day: 1 }, { zone: 'UTC' })
            jest.spyOn(Date, 'now').mockReturnValue(fixedTime.toMillis())
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        const invocation = createInvocation(
            {
                ...createHogExecutionGlobals(),
                inputs: { foo: 'bar' },
            },
            createInsightsFunction({
                ...FN_EXAMPLES.simple_fetch,
                ...FN_INPUTS_EXAMPLES.simple_fetch,
                ...FN_FILTERS_EXAMPLES.elements_href_filter,
            })
        )

        invocation.queueSource = 'postgres'

        it('should clone an invocation', () => {
            const cloned = cloneInvocation(invocation)
            const { id, state, insightsFunction, functionId, ...rest } = cloned
            expect(id).toBe(invocation.id)
            expect(functionId).toBe(invocation.functionId)
            expect(state).toBe(invocation.state)
            expect(insightsFunction).toBe(invocation.insightsFunction)

            expect(rest).toMatchInlineSnapshot(`
                {
                  "queue": "script",
                  "queueMetadata": undefined,
                  "queueParameters": undefined,
                  "queuePriority": 0,
                  "queueScheduledAt": undefined,
                  "queueSource": "postgres",
                  "teamId": 1,
                }
            `)
        })

        it('should allow overriding properties', () => {
            const cloned = cloneInvocation(invocation, {
                queuePriority: 1,
                queueMetadata: { foo: 'bar' },
                queueScheduledAt: DateTime.utc(),
                queueParameters: {
                    type: 'fetch',
                    url: 'https://example.com',
                    method: 'GET',
                },
            })

            const { id, state, insightsFunction, functionId, ...rest } = cloned
            expect(id).toBe(invocation.id)
            expect(functionId).toBe(invocation.functionId)
            expect(state).toBe(invocation.state)
            expect(insightsFunction).toBe(invocation.insightsFunction)

            expect(rest).toMatchInlineSnapshot(`
                {
                  "queue": "script",
                  "queueMetadata": {
                    "foo": "bar",
                  },
                  "queueParameters": {
                    "method": "GET",
                    "type": "fetch",
                    "url": "https://example.com",
                  },
                  "queuePriority": 1,
                  "queueScheduledAt": "2025-01-01T00:00:00.000Z",
                  "queueSource": "postgres",
                  "teamId": 1,
                }
            `)
        })
    })
})
