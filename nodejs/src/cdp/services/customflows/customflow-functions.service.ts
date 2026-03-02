import {
    CyclotronJobInvocationCustomFlow,
    CyclotronJobInvocationCustomFunction,
    CyclotronJobInvocationResult,
    CustomFunctionInvocationGlobals,
    CustomFunctionType,
} from '~/cdp/types'
import { CustomFlow, CustomFlowAction } from '~/schema/customflow'

import { ScriptExecutorExecuteAsyncOptions, ScriptExecutorService } from '../script-executor.service'
import { CustomFunctionTemplateManagerService } from '../managers/custom-function-template-manager.service'

type FunctionActionType = 'function' | 'function_email' | 'function_sms'
type Action = Extract<CustomFlowAction, { type: FunctionActionType }>

// Helper class that can turn a custom flow action into a custom function
export class CustomFlowFunctionsService {
    constructor(
        private siteUrl: string,
        private customFunctionTemplateManager: CustomFunctionTemplateManagerService,
        private customFunctionExecutor: ScriptExecutorService
    ) {}

    async buildCustomFunction(customFlow: CustomFlow, configuration: Action['config']): Promise<CustomFunctionType> {
        const template = await this.customFunctionTemplateManager.getCustomFunctionTemplate(configuration.template_id)

        if (!template) {
            throw new Error(`Template '${configuration.template_id}' not found`)
        }

        const { inputs, mappings, ...config } = configuration

        const customFunction: CustomFunctionType = {
            id: customFlow.id,
            team_id: customFlow.team_id,
            name: `${customFlow.name} - ${template.name}`,
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

        return customFunction
    }

    async buildCustomFunctionInvocation(
        invocation: CyclotronJobInvocationCustomFlow,
        customFunction: CustomFunctionType,
        globals: Omit<CustomFunctionInvocationGlobals, 'source' | 'project'>
    ): Promise<CyclotronJobInvocationCustomFunction> {
        const teamId = invocation.customFlow.team_id
        const projectUrl = `${this.siteUrl}/project/${teamId}`

        const globalsWithSource: CustomFunctionInvocationGlobals = {
            ...globals,
            // Include workflow-level variables
            variables: invocation.state.variables,
            source: {
                name: customFunction.name ?? `Custom flow: ${invocation.customFlow.id}`,
                url: `${projectUrl}/workflows/${invocation.customFlow.id}/workflow?node=${customFunction.id}`,
            },
            project: {
                id: customFunction.team_id,
                name: '',
                url: '',
            },
        }

        const customFunctionInvocation: CyclotronJobInvocationCustomFunction = {
            ...invocation,
            customFunction,
            state: invocation.state.currentAction?.customFunctionState ?? {
                globals: await this.customFunctionExecutor.buildInputsWithGlobals(customFunction, globalsWithSource),
                timings: [],
                attempts: 0,
            },
        }

        return customFunctionInvocation
    }

    async execute(
        invocation: CyclotronJobInvocationCustomFunction
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationCustomFunction>> {
        return this.customFunctionExecutor.execute(invocation)
    }

    async executeWithAsyncFunctions(
        invocation: CyclotronJobInvocationCustomFunction,
        scriptExecutorOptions?: ScriptExecutorExecuteAsyncOptions
    ): Promise<CyclotronJobInvocationResult<CyclotronJobInvocationCustomFunction>> {
        return this.customFunctionExecutor.executeWithAsyncFunctions(invocation, scriptExecutorOptions)
    }
}
