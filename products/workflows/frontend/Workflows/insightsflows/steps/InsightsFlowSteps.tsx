import { Node } from '@xyflow/react'
import { useValues } from 'kea'
import { useMemo } from 'react'

import {
    IconBolt,
    IconClock,
    IconDay,
    IconDecisionTree,
    IconHourglass,
    IconLeave,
    IconLetter,
    IconNotification,
    IconPercentage,
    IconWebhooks,
} from '@hanzo/icons'

import { IconTwilio } from 'lib/elements/icons'

import { themeLogic } from '~/layout/navigation-3000/themeLogic'
import { InsightsFunctionTemplateType } from '~/types'

import { workflowLogic } from '../../workflowLogic'
import { InsightsFlowAction } from '../types'
import { StepConditionalBranchConfiguration } from './StepConditionalBranch'
import { StepDelayConfiguration } from './StepDelay'
import { StepExitConfiguration } from './StepExit'
import { StepFunctionConfiguration } from './StepFunction'
import { StepRandomCohortBranchConfiguration } from './StepRandomCohortBranch'
import { StepTriggerConfiguration } from './StepTrigger'
import { StepWaitUntilConditionConfiguration } from './StepWaitUntilCondition'
import { StepWaitUntilTimeWindowConfiguration } from './StepWaitUntilTimeWindow'

type InsightsFlowStepBuilder<T extends InsightsFlowAction['type']> = {
    type: T
    icon: (
        action: Extract<InsightsFlowAction, { type: T }>,
        insightsFunctionTemplatesById: Record<string, InsightsFunctionTemplateType>
    ) => JSX.Element
    color: (action: Extract<InsightsFlowAction, { type: T }>, isDarkModeOn: boolean) => string
    renderConfiguration: (node: Node<Extract<InsightsFlowAction, { type: T }>>) => JSX.Element
}

type InsightsFlowStep<T extends InsightsFlowAction['type']> = {
    type: T
    icon: JSX.Element
    color: string
    renderConfiguration: (node: Node<Extract<InsightsFlowAction, { type: T }>>) => JSX.Element
}

const InsightsFlowStepConfigs: Partial<{
    [K in InsightsFlowAction['type']]: InsightsFlowStepBuilder<K>
}> = {
    conditional_branch: {
        type: 'conditional_branch',
        icon: () => <IconDecisionTree />,
        color: (_, isDarkModeOn) => (isDarkModeOn ? '#35C46F' : '#005841'),
        renderConfiguration: (node) => <StepConditionalBranchConfiguration key={node.id} node={node} />,
    },
    delay: {
        type: 'delay',
        icon: () => <IconClock />,
        color: () => '#a20031',
        renderConfiguration: (node) => <StepDelayConfiguration key={node.id} node={node} />,
    },
    exit: {
        type: 'exit',
        icon: () => <IconLeave />,
        color: () => '#4b4b4b',
        renderConfiguration: (node) => <StepExitConfiguration key={node.id} node={node} />,
    },

    random_cohort_branch: {
        type: 'random_cohort_branch',
        icon: () => <IconPercentage />,
        color: (_, isDarkModeOn) => (isDarkModeOn ? '#D6247B' : '#9a004d'),
        renderConfiguration: (node) => <StepRandomCohortBranchConfiguration key={node.id} node={node} />,
    },
    trigger: {
        type: 'trigger',
        icon: () => <IconBolt />,
        color: (_, isDarkModeOn) => (isDarkModeOn ? '#35C46F' : '#005841'),
        renderConfiguration: (node) => <StepTriggerConfiguration key={node.id} node={node} />,
    },
    wait_until_condition: {
        type: 'wait_until_condition',
        icon: () => <IconHourglass />,
        color: () => '#ffaa00',
        renderConfiguration: (node) => <StepWaitUntilConditionConfiguration key={node.id} node={node} />,
    },
    wait_until_time_window: {
        type: 'wait_until_time_window',
        icon: () => <IconDay />,
        color: () => '#FF653F',
        renderConfiguration: (node) => <StepWaitUntilTimeWindowConfiguration key={node.id} node={node} />,
    },

    // We can remove these later
    function_email: {
        type: 'function_email',
        icon: () => <IconLetter />,
        color: (_, isDarkModeOn) => (isDarkModeOn ? '#2F80FA' : '#2F80FA'),
        renderConfiguration: (node) => <StepFunctionConfiguration key={node.id} node={node} />,
    },
    function_sms: {
        type: 'function_sms',
        icon: () => <IconTwilio />,
        color: () => '#f22f46',
        renderConfiguration: (node) => <StepFunctionConfiguration key={node.id} node={node} />,
    },
    function_push: {
        type: 'function_push',
        icon: () => <IconNotification />,
        color: (_, isDarkModeOn) => (isDarkModeOn ? '#F8BE2A' : '#F44D01'),
        renderConfiguration: (node) => <StepFunctionConfiguration key={node.id} node={node} />,
    },
    function: {
        type: 'function',
        icon: (action, insightsFunctionTemplatesById) => {
            if (action.config.template_id === 'template-email') {
                return <IconLetter />
            }

            if (action.config.template_id === 'template-webhook') {
                return <IconWebhooks />
            }

            if (action.config.template_id === 'template-native-push') {
                return <IconNotification />
            }

            const template = insightsFunctionTemplatesById[action.config.template_id]
            return template?.icon_url ? (
                <img className="Icon rounded" src={template.icon_url} alt={template.name} />
            ) : (
                <IconBolt />
            )
        },
        color: (action, isDarkModeOn) => {
            if (action.config.template_id === 'template-email') {
                return isDarkModeOn ? '#2F80FA' : '#2F80FA'
            }

            if (action.config.template_id === 'template-webhook') {
                return isDarkModeOn ? '#B52AD9' : '#6500ae'
            }

            return isDarkModeOn ? '#F8BE2A' : '#F44D01'
        },
        renderConfiguration: (node) => <StepFunctionConfiguration key={node.id} node={node} />,
    },
} as const

// Type-safe accessor that preserves the key type
export function getInsightsFlowStep<T extends InsightsFlowAction['type']>(
    action: Extract<InsightsFlowAction, { type: T }>,
    insightsFunctionTemplatesById: Record<string, InsightsFunctionTemplateType>,
    isDarkModeOn = false
): InsightsFlowStep<T> | undefined {
    const type = action.type
    const builder = InsightsFlowStepConfigs[type] as InsightsFlowStepBuilder<T> | undefined
    if (!builder) {
        return undefined
    }
    return {
        type,
        icon: builder.icon(action, insightsFunctionTemplatesById),
        color: builder.color(action, isDarkModeOn),
        renderConfiguration: builder.renderConfiguration,
    }
}

export function useInsightsFlowStep<T extends InsightsFlowAction['type']>(
    action?: Extract<InsightsFlowAction, { type: T }>
): InsightsFlowStep<T> | undefined {
    const { insightsFunctionTemplatesById } = useValues(workflowLogic)
    const { isDarkModeOn } = useValues(themeLogic)

    return useMemo(() => {
        if (!action) {
            return undefined
        }
        return getInsightsFlowStep(action, insightsFunctionTemplatesById, isDarkModeOn)
    }, [action, insightsFunctionTemplatesById, isDarkModeOn])
}
