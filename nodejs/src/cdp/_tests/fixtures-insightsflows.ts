import { InsightsFlow } from '~/schema/customflow'
import { insertRow } from '~/tests/helpers/sql'

import { PostgresRouter } from '../../utils/db/postgres'
import { UUIDT } from '../../utils/utils'
import { CyclotronJobInvocationInsightsFlow, CyclotronPerson, InsightsFlowInvocationContext } from '../types'
import { convertToInsightsFunctionFilterGlobal } from '../utils/insights-function-filtering'
import { createScriptExecutionGlobals } from './fixtures'

export const insertInsightsFlow = async (postgres: PostgresRouter, insightsFlow: InsightsFlow): Promise<InsightsFlow> => {
    // This is only used for testing so we need to override some values

    const res = await insertRow(postgres, 'insights_flow', {
        ...insightsFlow,
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
            ...createScriptExecutionGlobals().event,
            ...data.event,
        },
        actionStepCount: 0,
        ...data,
    }
}

export const createExampleInsightsFlowInvocation = (
    insightsFlow: InsightsFlow,
    _context: Partial<InsightsFlowInvocationContext> = {},
    _person: CyclotronPerson | undefined = undefined
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
        teamId: insightsFlow.team_id,
        functionId: insightsFlow.id,
        insightsFlow,
        person,
        filterGlobals: convertToInsightsFunctionFilterGlobal({
            event: context.event,
            person,
            groups: {},
            variables: context.variables || {},
        }),
        queue: 'customflow',
        queuePriority: 0,
    }
}
