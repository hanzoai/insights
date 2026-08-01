import { InsightsFlow, InsightsFlowAction } from '~/cdp/schema/hogflow'
import {
    CyclotronJobInvocationInsightsFlow,
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    InsightsFunctionInvocationGlobals,
    InsightsFunctionType,
} from '~/cdp/types'

import { HogExecutorExecuteAsyncOptions, HogExecutorService } from '../script-executor.service'
import { InsightsFunctionTemplateManagerService } from '../managers/script-function-template-manager.service'

type FunctionActionType = 'function' | 'function_email' | 'function_sms'
type Action = Extract<InsightsFlowAction, { type: FunctionActionType }>

// Helper class that can turn a script flow action into a script function
export class InsightsFlowFunctionsService {
    constructor(
        private siteUrl: string,
        private insightsFunctionTemplateManager: InsightsFunctionTemplateManagerService,
        private insightsFunctionExecutor: HogExecutorService
    ) {}

    async buildInsightsFunction(hogFlow: InsightsFlow, configuration: Action['config']): Promise<InsightsFunctionType> {
        const template = await this.insightsFunctionTemplateManager.getInsightsFunctionTemplate(configuration.template_id)

        if (!template) {
            throw new Error(`Template '${configuration.template_id}' not found`)
        }

        const { inputs, mappings, ...config } = configuration

        const insightsFunction: InsightsFunctionType = {
            id: hogFlow.id,
            team_id: hogFlow.team_id,
            name: `${hogFlow.name} - ${template.name}`,
            enabled: true,
            type: template.type,
            deleted: false,
            script: '<<TEMPLATE>>',
            bytecode: template.bytecode,
            inputs,
            inputs_schema: template.inputs_schema,
            template_id: template.template_id,
            mappings,
            created_at: '',
            updated_at: '',
            metadata: config,
        }

        return insightsFunction
    }

    // Collect the decrypted secret input values across a flow's function actions, so a test
    // invocation with mocked async functions can redact them from the fetch args it echoes into logs
    // (otherwise a workflow editor could read a stored credential they were never shown).
    async getSensitiveValues(hogFlow: InsightsFlow): Promise<string[]> {
        const functionActionTypes: FunctionActionType[] = ['function', 'function_email', 'function_sms']
        const values: string[] = []
        for (const action of hogFlow.actions ?? []) {
            if (!functionActionTypes.includes(action.type as FunctionActionType)) {
                continue
            }
            const config = (action as Action).config
            const template = await this.insightsFunctionTemplateManager.getInsightsFunctionTemplate(config.template_id)
            for (const schema of template?.inputs_schema ?? []) {
                if (!schema.secret) {
                    continue
                }
                const value = config.inputs?.[schema.key]?.value
                if (typeof value === 'string') {
                    values.push(value)
                } else if (value && typeof value === 'object') {
                    // e.g. a headers dict {Authorization: "Bearer <key>"} - mask each string leaf
                    Object.values(value).forEach((leaf) => {
                        if (typeof leaf === 'string') {
                            values.push(leaf)
                        }
                    })
                }
            }
        }
        return values
    }

    async buildInsightsFunctionInvocation(
        invocation: CyclotronJobInvocationInsightsFlow,
        insightsFunction: InsightsFunctionType,
        globals: Omit<InsightsFunctionInvocationGlobals, 'source' | 'project'>
    ): Promise<CyclotronJobInvocationInsightsFunction> {
        const teamId = invocation.hogFlow.team_id
        const projectUrl = `${this.siteUrl}/project/${teamId}`

        const globalsWithSource: InsightsFunctionInvocationGlobals = {
            ...globals,
            // Include workflow-level variables
            variables: invocation.state.variables,
            source: {
                name: insightsFunction.name ?? `Script flow: ${invocation.hogFlow.id}`,
                url: `${projectUrl}/workflows/${invocation.hogFlow.id}/workflow?node=${insightsFunction.id}`,
            },
            project: {
                id: insightsFunction.team_id,
                name: '',
                url: '',
            },
        }

        const insightsFunctionInvocation: CyclotronJobInvocationInsightsFunction = {
            ...invocation,
            insightsFunction,
            state: invocation.state.currentAction?.insightsFunctionState ?? {
                globals: await this.insightsFunctionExecutor.buildInputsWithGlobals(insightsFunction, globalsWithSource),
                timings: [],
                attempts: 0,
                actionId: invocation.state.currentAction?.id,
            },
        }

        return insightsFunctionInvocation
    }

    async execute(
        invocation: CyclotronJobInvocationInsightsFunction
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        return this.insightsFunctionExecutor.execute(invocation)
    }

    async executeWithAsyncFunctions(
        invocation: CyclotronJobInvocationInsightsFunction,
        hogExecutorOptions?: HogExecutorExecuteAsyncOptions
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        return this.insightsFunctionExecutor.executeWithAsyncFunctions(invocation, hogExecutorOptions)
    }
}
