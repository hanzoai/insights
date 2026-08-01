import { InsightsFlow } from '~/cdp/schema/hogflow'
import { PostgresRouter } from '~/common/utils/db/postgres'
import { UUIDT } from '~/common/utils/utils'
import { insertRow } from '~/tests/helpers/sql'

import { CyclotronJobInvocationInsightsFlow, CyclotronPerson, InsightsFlowInvocationContext } from '../types'
import { convertToInsightsFunctionFilterGlobal } from '../utils/script-function-filtering'
import { createHogExecutionGlobals } from './fixtures'

export const insertInsightsFlow = async (postgres: PostgresRouter, hogFlow: InsightsFlow): Promise<InsightsFlow> => {
    // This is only used for testing so we need to override some values

    const res = await insertRow(postgres, 'insights_hogflow', {
        ...hogFlow,
        description: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_id: 1001,
    })
    return res
}

export const createInsightsFlowInvocationContext = (
    data: Partial<InsightsFlowInvocationContext> = {}
): InsightsFlowInvocationContext => {
    return {
        event: {
            ...createHogExecutionGlobals().event,
            ...data.event,
        },
        actionStepCount: 0,
        ...data,
    }
}

export const createExampleInsightsFlowInvocation = (
    hogFlow: InsightsFlow,
    _context: Partial<InsightsFlowInvocationContext> = {},
    _person: Partial<CyclotronPerson> | undefined = undefined
): CyclotronJobInvocationInsightsFlow => {
    // Add the source of the trigger to the globals

    const context = createInsightsFlowInvocationContext(_context)

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
        teamId: hogFlow.team_id,
        functionId: hogFlow.id,
        hogFlow,
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
