import {
    CyclotronJobInvocationInsightsFlow,
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobInvocationResult,
    InsightsFunctionInvocationGlobals,
    InsightsFunctionType,
} from '~/cdp/types'
import { InsightsFlow, InsightsFlowAction } from '~/schema/customflow'

import { ScriptExecutorExecuteAsyncOptions, ScriptExecutorService } from '../script-executor.service'
import { InsightsFunctionTemplateManagerService } from '../managers/insights-function-template-manager.service'

type FunctionActionType = 'function' | 'function_email' | 'function_sms'
type Action = Extract<InsightsFlowAction, { type: FunctionActionType }>

// Helper class that can turn a custom flow action into a custom function
export class InsightsFlowFunctionsService {
    constructor(
        private siteUrl: string,
        private insightsFunctionTemplateManager: InsightsFunctionTemplateManagerService,
        private insightsFunctionExecutor: ScriptExecutorService
    ) {}

    async buildInsightsFunction(insightsFlow: InsightsFlow, configuration: Action['config']): Promise<InsightsFunctionType> {
        const template = await this.insightsFunctionTemplateManager.getInsightsFunctionTemplate(configuration.template_id)

        if (!template) {
            throw new Error(`Template '${configuration.template_id}' not found`)
        }

        const { inputs, mappings, ...config } = configuration

        const insightsFunction: InsightsFunctionType = {
            id: insightsFlow.id,
            team_id: insightsFlow.team_id,
            name: `${insightsFlow.name} - ${template.name}`,
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

    async buildInsightsFunctionInvocation(
        invocation: CyclotronJobInvocationInsightsFlow,
        insightsFunction: InsightsFunctionType,
        globals: Omit<InsightsFunctionInvocationGlobals, 'source' | 'project'>
    ): Promise<CyclotronJobInvocationInsightsFunction> {
        const teamId = invocation.insightsFlow.team_id
        const projectUrl = `${this.siteUrl}/project/${teamId}`

        const globalsWithSource: InsightsFunctionInvocationGlobals = {
            ...globals,
            // Include workflow-level variables
            variables: invocation.state.variables,
            source: {
                name: insightsFunction.name ?? `Custom flow: ${invocation.insightsFlow.id}`,
                url: `${projectUrl}/workflows/${invocation.insightsFlow.id}/workflow?node=${insightsFunction.id}`,
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
        scriptExecutorOptions?: ScriptExecutorExecuteAsyncOptions
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationInsightsFunction>> {
        return this.insightsFunctionExecutor.executeWithAsyncFunctions(invocation, scriptExecutorOptions)
    }
}
