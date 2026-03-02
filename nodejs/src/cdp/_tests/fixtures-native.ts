import { UUIDT } from '~/utils/utils'

import { CyclotronJobInvocationCustomFunction, CustomFunctionType } from '../types'
import { createCustomFunction } from './fixtures'
import { SAMPLE_GLOBALS } from './fixtures'

export const createExampleNativeInvocation = (
    customFunctionOverrides: Partial<CustomFunctionType> = {},
    inputs: Record<string, any> = {}
): CyclotronJobInvocationCustomFunction => {
    const customFunction = createCustomFunction(customFunctionOverrides)

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
        teamId: customFunction.team_id,
        functionId: customFunction.id,
        customFunction,
        queue: 'custom_script',
        queuePriority: 0,
    }
}
