import { Flow } from '~/cdp/schema/flow'
import { PostgresRouter } from '~/common/utils/db/postgres'
import { UUIDT } from '~/common/utils/utils'
import { insertRow } from '~/tests/helpers/sql'

import { CyclotronJobInvocationFlow, CyclotronPerson, FlowInvocationContext } from '../types'
import { convertToInsightsFunctionFilterGlobal } from '../utils/script-function-filtering'
import { createHogExecutionGlobals } from './fixtures'

export const insertFlow = async (postgres: PostgresRouter, flow: Flow): Promise<Flow> => {
    // This is only used for testing so we need to override some values

    const res = await insertRow(postgres, 'insights_hogflow', {
        ...flow,
        description: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_id: 1001,
    })
    return res
}

export const createFlowInvocationContext = (
    data: Partial<FlowInvocationContext> = {}
): FlowInvocationContext => {
    return {
        event: {
            ...createHogExecutionGlobals().event,
            ...data.event,
        },
        actionStepCount: 0,
        ...data,
    }
}

export const createExampleFlowInvocation = (
    flow: Flow,
    _context: Partial<FlowInvocationContext> = {},
    _person: Partial<CyclotronPerson> | undefined = undefined
): CyclotronJobInvocationFlow => {
    // Add the source of the trigger to the globals

    const context = createFlowInvocationContext(_context)

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
        teamId: flow.team_id,
        functionId: flow.id,
        flow,
        person,
        filterGlobals: convertToInsightsFunctionFilterGlobal({
            event: context.event,
            person,
            groups: {},
            variables: context.variables || {},
        }),
        queue: 'hogflow',
        queuePriority: 0,
    }
}
