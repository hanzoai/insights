import { Node } from '@xyflow/react'
import { kea, key, path, props, propsChanged } from 'kea'
import { forms } from 'kea-forms'

import { templateToConfiguration } from 'scenes/insights-functions/configuration/insightsFunctionConfigurationLogic'

import { InsightsFunctionTemplateType } from '~/types'

import { InsightsFlowAction } from '../types'
import type { insightsFunctionStepLogicType } from './insightsFunctionStepLogicType'

export type StepFunctionNode = Node<
    Extract<InsightsFlowAction, { type: 'function' } | { type: 'function_email' } | { type: 'function_sms' }>
>

export interface InsightsFunctionStepLogicProps {
    node?: StepFunctionNode
    template?: InsightsFunctionTemplateType
}

export const insightsFunctionStepLogic = kea<insightsFunctionStepLogicType>([
    path(['products', 'workflows', 'frontend', 'Workflows', 'insightsflows', 'steps']),
    props({} as InsightsFunctionStepLogicProps),
    key(({ node }: InsightsFunctionStepLogicProps) => `${node?.id}_${node?.data.config.template_id}`),
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
