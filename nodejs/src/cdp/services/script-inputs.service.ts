import { convertScriptToJS } from '@posthog/scriptvm'

import { ACCESS_TOKEN_PLACEHOLDER } from '~/config/constants'
import { CyclotronInputType } from '~/schema/cyclotron'
import { Hub } from '~/types'

import { CustomFunctionInvocationGlobals, CustomFunctionInvocationGlobalsWithInputs, CustomFunctionType } from '../types'
import { execScript } from '../utils/script-exec'
import { LiquidRenderer } from '../utils/liquid'
import { RecipientTokensService } from './messaging/recipient-tokens.service'

export type ScriptInputsServiceHub = Pick<Hub, 'integrationManager' | 'ENCRYPTION_SALT_KEYS' | 'SITE_URL'>

export const EXTEND_OBJECT_KEY = '$$_extend_object'

export class ScriptInputsService {
    private recipientTokensService: RecipientTokensService

    constructor(private hub: ScriptInputsServiceHub) {
        this.recipientTokensService = new RecipientTokensService(hub)
    }

    public async buildInputs(
        customFunction: CustomFunctionType,
        globals: CustomFunctionInvocationGlobals,
        additionalInputs?: Record<string, any>
    ): Promise<Record<string, any>> {
        // TODO: Load the values from the integrationManager

        const inputs: CustomFunctionType['inputs'] = {
            // Include the inputs from the custom function
            ...customFunction.inputs,
            ...customFunction.encrypted_inputs,
            // Plus any additional inputs
            ...additionalInputs,
            // and decode any integration inputs
            ...(await this.loadIntegrationInputs(customFunction)),
        }

        const newGlobals: CustomFunctionInvocationGlobalsWithInputs = {
            ...globals,
            inputs: {},
        }

        const _formatInput = async (input: CyclotronInputType, key: string): Promise<any> => {
            const templating = input.templating ?? 'custom_script'

            if (templating === 'liquid') {
                return formatLiquidInput(input.value, newGlobals, key)
            }
            if (templating === 'custom_script' && input?.bytecode) {
                return await formatScriptInput(input.bytecode, newGlobals, key)
            }

            return input.value
        }

        // Add unsubscribe url if we have an email input here
        const emailInputSchema = customFunction.inputs_schema?.find((input) =>
            ['native_email', 'email'].includes(input.type)
        )
        const emailInput = customFunction.inputs?.[emailInputSchema?.key ?? '']

        if (emailInputSchema && emailInput) {
            // If we have an email value then we template it out to get the email address
            const emailValue = await _formatInput(emailInput, emailInputSchema.key)
            if (emailValue?.to?.email) {
                newGlobals.unsubscribe_url = this.recipientTokensService.generatePreferencesUrl({
                    team_id: customFunction.team_id,
                    identifier: emailValue.to.email,
                })
                newGlobals.unsubscribe_url_one_click = this.recipientTokensService.generateOneClickUnsubscribeUrl({
                    team_id: customFunction.team_id,
                    identifier: emailValue.to.email,
                })
            }
        }

        const orderedInputs = Object.entries(inputs ?? {}).sort(([_, input1], [__, input2]) => {
            return (input1?.order ?? -1) - (input2?.order ?? -1)
        })

        for (const [key, input] of orderedInputs) {
            if (!input) {
                continue
            }

            newGlobals.inputs[key] = await _formatInput(input, key)
        }

        return newGlobals.inputs
    }

    public async buildInputsWithGlobals(
        customFunction: CustomFunctionType,
        globals: CustomFunctionInvocationGlobals,
        additionalInputs?: Record<string, any>
    ): Promise<CustomFunctionInvocationGlobalsWithInputs> {
        return {
            ...globals,
            inputs: await this.buildInputs(customFunction, globals, additionalInputs),
        }
    }

    public async loadIntegrationInputs(
        customFunction: CustomFunctionType
    ): Promise<Record<string, { value: Record<string, any> | null }>> {
        const inputsToLoad: Record<string, number> = {}

        customFunction.inputs_schema?.forEach((schema) => {
            if (schema.type === 'integration') {
                const input = customFunction.inputs?.[schema.key]
                const value = input?.value?.integrationId ?? input?.value
                if (value && typeof value === 'number') {
                    inputsToLoad[schema.key] = value
                }
            }
        })

        if (Object.keys(inputsToLoad).length === 0) {
            return {}
        }

        const integrations = await this.hub.integrationManager.getMany(Object.values(inputsToLoad))
        const returnInputs: Record<string, { value: Record<string, any> | null }> = {}

        Object.entries(inputsToLoad).forEach(([key, value]) => {
            returnInputs[key] = {
                value: null,
            }

            const integration = integrations[value]
            // IMPORTANT: Check the team ID is correct
            if (integration && integration.team_id === customFunction.team_id) {
                returnInputs[key] = {
                    value: {
                        ...integration.config,
                        ...integration.sensitive_config,
                        ...(integration.sensitive_config.access_token || integration.config.access_token
                            ? {
                                  access_token: ACCESS_TOKEN_PLACEHOLDER + integration.id,
                                  access_token_raw:
                                      integration.sensitive_config.access_token ?? integration.config.access_token,
                              }
                            : {}),
                    },
                }
            }
        })

        return returnInputs
    }
}

export const formatScriptInput = async (
    bytecode: any,
    globals: CustomFunctionInvocationGlobalsWithInputs,
    key?: string
): Promise<any> => {
    // Similar to how we generate the bytecode by iterating over the values,
    // here we iterate over the object and replace the bytecode with the actual values
    // bytecode is indicated as an array beginning with ["_H"] (versions 1+) or ["_h"] (version 0)

    if (bytecode === null || bytecode === undefined) {
        return bytecode // Preserve null and undefined values
    }

    if (Array.isArray(bytecode) && (bytecode[0] === '_h' || bytecode[0] === '_H')) {
        const { execResult: result, error } = await execScript(bytecode, { globals })
        if (!result || error) {
            throw error ?? result?.error
        }
        if (!result?.finished) {
            // NOT ALLOWED
            throw new Error(`Could not execute bytecode for input field: ${key}`)
        }
        return convertScriptToJS(result.result)
    }

    if (Array.isArray(bytecode)) {
        return await Promise.all(bytecode.map((item) => formatScriptInput(item, globals, key)))
    } else if (typeof bytecode === 'object' && bytecode !== null) {
        let ret: Record<string, any> = {}

        if (bytecode[EXTEND_OBJECT_KEY]) {
            const res = await formatScriptInput(bytecode[EXTEND_OBJECT_KEY], globals, key)
            if (res && typeof res === 'object') {
                ret = {
                    ...res,
                }
            }
        }

        await Promise.all(
            Object.entries(bytecode).map(async ([subkey, value]) => {
                if (subkey === EXTEND_OBJECT_KEY) {
                    return
                }
                ret[subkey] = await formatScriptInput(value, globals, key ? `${key}.${subkey}` : subkey)
            })
        )

        return ret
    }

    return bytecode
}

export const formatLiquidInput = (
    value: unknown,
    globals: CustomFunctionInvocationGlobalsWithInputs,
    key?: string
): any => {
    if (value === null || value === undefined) {
        return value
    }

    if (typeof value === 'string') {
        return LiquidRenderer.renderWithCustomFunctionGlobals(value, globals)
    }

    if (Array.isArray(value)) {
        return value.map((item) => formatLiquidInput(item, globals, key))
    }

    if (typeof value === 'object' && value !== null) {
        return Object.fromEntries(
            Object.entries(value).map(([key2, value]) => [
                key2,
                formatLiquidInput(value, globals, key ? `${key}.${key2}` : key2),
            ])
        )
    }

    return value
}
