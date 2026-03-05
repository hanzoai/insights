import { Node } from '@xyflow/react'
import { kea, key, path, props, propsChanged } from 'kea'
import { forms } from 'kea-forms'

import { templateToConfiguration } from 'scenes/custom-functions/configuration/customFunctionConfigurationLogic'

import { CustomFunctionTemplateType } from '~/types'

import { CustomFlowAction } from '../types'
import type { customFunctionStepLogicType } from './customFunctionStepLogicType'

export type StepFunctionNode = Node<
    Extract<CustomFlowAction, { type: 'function' } | { type: 'function_email' } | { type: 'function_sms' }>
>

export interface CustomFunctionStepLogicProps {
    node?: StepFunctionNode
    template?: CustomFunctionTemplateType
}

export const customFunctionStepLogic = kea<customFunctionStepLogicType>([
    path(['products', 'workflows', 'frontend', 'Workflows', 'customflows', 'steps']),
    props({} as CustomFunctionStepLogicProps),
    key(({ node }: CustomFunctionStepLogicProps) => `${node?.id}_${node?.data.config.template_id}`),
    forms(({ props }) => ({
        configuration: {
            defaults: {
                inputs: props.node?.data?.config?.inputs || {},
            },
        },
    })),

    propsChanged(({ actions, props, values }) => {
        const { template } = props
        if (template && Object.keys(values.configuration.inputs ?? {}).length === 0) {
            actions.setConfigurationValues({
                inputs: templateToConfiguration(template).inputs ?? {},
            })
        }
    }),
])
