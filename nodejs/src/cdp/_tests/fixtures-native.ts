import { UUIDT } from '~/utils/utils'

import { CyclotronJobInvocationInsightsFunction, InsightsFunctionType } from '../types'
import { createInsightsFunction } from './fixtures'
import { SAMPLE_GLOBALS } from './fixtures'

export const createExampleNativeInvocation = (
    insightsFunctionOverrides: Partial<InsightsFunctionType> = {},
    inputs: Record<string, any> = {}
): CyclotronJobInvocationInsightsFunction => {
    const insightsFunction = createInsightsFunction(insightsFunctionOverrides)

    return {
        id: new UUIDT().toString(),
        state: {
            globals: {
                inputs,
                ...SAMPLE_GLOBALS,
            },
            timings: [],
            attempts: 0,
        },
        teamId: insightsFunction.team_id,
        functionId: insightsFunction.id,
        insightsFunction,
        queue: 'fn',
        queuePriority: 0,
    }
}
