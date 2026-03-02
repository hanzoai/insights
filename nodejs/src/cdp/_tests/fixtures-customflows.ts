import { CustomFlow } from '~/schema/customflow'
import { insertRow } from '~/tests/helpers/sql'

import { PostgresRouter } from '../../utils/db/postgres'
import { UUIDT } from '../../utils/utils'
import { CyclotronJobInvocationCustomFlow, CyclotronPerson, CustomFlowInvocationContext } from '../types'
import { convertToCustomFunctionFilterGlobal } from '../utils/custom-function-filtering'
import { createScriptExecutionGlobals } from './fixtures'

export const insertCustomFlow = async (postgres: PostgresRouter, customFlow: CustomFlow): Promise<CustomFlow> => {
    // This is only used for testing so we need to override some values

    const res = await insertRow(postgres, 'posthog_customflow', {
        ...customFlow,
        description: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_id: 1001,
    })
    return res
}

export const createCustomFlowInvocationContext = (
    data: Partial<CustomFlowInvocationContext> = {}
): CustomFlowInvocationContext => {
    return {
        event: {
            ...createScriptExecutionGlobals().event,
            ...data.event,
        },
        actionStepCount: 0,
        ...data,
    }
}

export const createExampleCustomFlowInvocation = (
    customFlow: CustomFlow,
    _context: Partial<CustomFlowInvocationContext> = {},
    _person: CyclotronPerson | undefined = undefined
): CyclotronJobInvocationCustomFlow => {
    // Add the source of the trigger to the globals

    const context = createCustomFlowInvocationContext(_context)

    const person: CyclotronPerson = {
        id: 'person_id',
        properties: {
            name: 'John Doe',
        },
        name: 'John Doe',
        url: '',
        ..._person,
    }

    return {
        id: new UUIDT().toString(),
        state: {
            ...context,
        },
        teamId: customFlow.team_id,
        functionId: customFlow.id,
        customFlow,
        person,
        filterGlobals: convertToCustomFunctionFilterGlobal({
            event: context.event,
            person,
            groups: {},
            variables: context.variables || {},
        }),
        queue: 'customflow',
        queuePriority: 0,
    }
}
