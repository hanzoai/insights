import { useActions, useValues } from 'kea'
import { Fragment, useEffect, useState } from 'react'

import { IconDrag } from '@posthog/icons'
import { LemonButton, LemonDivider, LemonDropdown, LemonInput, SpinnerOverlay } from '@posthog/lemon-ui'

import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { insightsFunctionTemplateListLogic } from 'scenes/insights-functions/list/insightsFunctionTemplateListLogic'
import { InsightsFunctionStatusTag } from 'scenes/insights-functions/misc/InsightsFunctionStatusTag'

import { InsightsFunctionTemplateType } from '~/types'

import { CreateActionType, insightsFlowEditorLogic } from '../insightsFlowEditorLogic'
// Side-effect imports: register product-specific trigger and action nodes
import '../registry'
import { getRegisteredActionNodeCategories } from '../registry/actions/actionNodeRegistry'
import { useInsightsFlowStep } from '../steps/InsightsFlowSteps'
import { getDelayDescription } from '../steps/stepDelayLogic'
import { InsightsFlowAction } from '../types'

export const ACTION_NODES_TO_SHOW: CreateActionType[] = [
    {
        type: 'function_email',
        name: 'Email',
        description: 'Send an email to the user.',
        config: {
            template_id: 'template-email',
            inputs: {},
        },
    },
    {
        type: 'function_sms',
        name: 'SMS',
        description: 'Send an SMS to the user.',
        config: {
            template_id: 'template-twilio',
            inputs: {},
        },
    },
    {
        type: 'function',
        name: 'Slack',
        description: 'Send a Slack message to the user.',
        config: { template_id: 'template-slack', inputs: {} },
    },
    {
        type: 'function',
        name: 'Webhook',
        description: 'Send a Webhook to the user.',
        config: { template_id: 'template-webhook', inputs: {} },
    },
]

const DEFAULT_DELAY = '10m'
export const DELAY_NODES_TO_SHOW: CreateActionType[] = [
    {
        type: 'delay',
        name: 'Delay',
        description: getDelayDescription(DEFAULT_DELAY),
        config: { delay_duration: DEFAULT_DELAY },
    },
    {
        type: 'wait_until_time_window',
        name: 'Wait until window',
        description: 'Wait until a specified time window.',
        config: {
            timezone: null,
            day: 'any',
            time: 'any',
        },
    },
    {
        type: 'wait_until_condition',
        name: 'Wait until condition',
        description: 'Wait until a condition is met or a duration has passed.',
        branchEdges: 1,
        config: {
            condition: { filters: null },
            max_wait_duration: '5m',
        },
    },
]

export const LOGIC_NODES_TO_SHOW: CreateActionType[] = [
    {
        type: 'conditional_branch',
        name: 'Conditional branch',
        description: 'Branch using conditions on event or person properties.',
        branchEdges: 1,
        config: {
            conditions: [
                {
                    filters: {},
                },
            ],
        },
    },
    {
        type: 'random_cohort_branch',
        name: 'Cohort branch',
        description: 'Randomly branch off based on cohort percentages.',
        branchEdges: 1,
        config: {
            cohorts: [
                {
                    percentage: 50,
                },
            ],
        },
    },
]

export const POSTHOG_NODES_TO_SHOW: CreateActionType[] = [
    {
        type: 'function',
        name: 'Set variable',
        description: 'Set a workflow variable.',
        config: { template_id: 'template-posthog-set-variable', inputs: {} },
    },
    {
        type: 'function',
        name: 'Capture event',
        description: 'Capture an event to Insights.',
        config: { template_id: 'template-posthog-capture', inputs: {} },
    },
    {
        type: 'function',
        name: 'Update person property',
        description: 'Set properties of a person in Insights.',
        config: { template_id: 'template-posthog-update-person-properties', inputs: {} },
    },
    {
        type: 'function',
        name: 'Set group property',
        description: 'Set properties of a group in Insights.',
        config: { template_id: 'template-posthog-group-identify', inputs: {} },
    },
]

const TEMPLATE_IDS_AT_TOP_LEVEL: string[] = [
    ...ACTION_NODES_TO_SHOW.map((action) => (action.config as any).template_id),
    ...DELAY_NODES_TO_SHOW.map((action) => (action.config as any).template_id),
    ...LOGIC_NODES_TO_SHOW.map((action) => (action.config as any).template_id),
    ...POSTHOG_NODES_TO_SHOW.map((action) => (action.config as any).template_id),
    ...getRegisteredActionNodeCategories().flatMap((cat) =>
        cat.nodes.map((action) => (action.config as any).template_id)
    ),
].filter((t) => !!t)

function InsightsFlowEditorToolbarNode({
    action,
    onDragStart: onDragStartProp,
    children,
}: {
    action: CreateActionType
    onDragStart?: (event: React.DragEvent) => void
    children?: React.ReactNode
}): JSX.Element | null {
    const { setNodeToBeAdded } = useActions(insightsFlowEditorLogic)

    const onDragStart = (event: React.DragEvent): void => {
        setNodeToBeAdded(action)
        event.dataTransfer.setData('application/reactflow', action.type)
        event.dataTransfer.effectAllowed = 'move'
        onDragStartProp?.(event)
    }

    const step = useInsightsFlowStep(action as InsightsFlowAction)

    if (!step) {
        return null
    }

    return (
        <div draggable onDragStart={onDragStart}>
            <LemonButton
                icon={<span style={{ color: step.color }}>{step.icon}</span>}
                sideIcon={<IconDrag />}
                fullWidth
            >
                {children ?? action.name}
            </LemonButton>
        </div>
    )
}

// For now we only want to show destinations that do not have secrets and not coming soon
const customFilterFunction = (template: InsightsFunctionTemplateType): boolean => {
    if (template.type !== 'destination' || TEMPLATE_IDS_AT_TOP_LEVEL.includes(template.id)) {
        return false
    }

    if (template.type === 'destination' && template.inputs_schema?.some((input) => input.secret)) {
        return false
    }

    if (template.status === 'coming_soon') {
        return false
    }

    return true
}

function InsightsFunctionTemplatesChooser(): JSX.Element {
    const logic = insightsFunctionTemplateListLogic({
        type: 'destination',
        customFilterFunction,
    })

    const { loading, filteredTemplates, filters } = useValues(logic)
    const { loadInsightsFunctionTemplates, setFilters } = useActions(logic)

    const [popoverOpen, setPopoverOpen] = useState(false)

    useEffect(() => {
        loadInsightsFunctionTemplates()
    }, [loadInsightsFunctionTemplates])

    return (
        <div>
            <LemonDropdown
                closeOnClickInside={false}
                visible={popoverOpen}
                onClickOutside={() => setPopoverOpen(false)}
                placement="bottom-end"
                overlay={
                    <div className="flex flex-col w-100 h-120 flex-1 overflow-hidden gap-1">
                        <LemonInput
                            placeholder="Search..."
                            value={filters.search ?? ''}
                            onChange={(e) => setFilters({ ...filters, search: e })}
                            autoFocus
                        />

                        {loading ? (
                            <SpinnerOverlay />
                        ) : (
                            <ul className="overflow-y-auto flex-1">
                                {filteredTemplates.map((template: InsightsFunctionTemplateType) => (
                                    <li key={template.type}>
                                        <InsightsFlowEditorToolbarNode
                                            action={{
                                                type: 'function',
                                                name: template.name,
                                                description:
                                                    typeof template.description === 'string'
                                                        ? template.description
                                                        : '',
                                                config: { template_id: template.id, inputs: {} },
                                            }}
                                        >
                                            <div className="py-1 flex items-center gap-1 flex-1">
                                                <div className="flex-1">
                                                    <div>{template.name}</div>
                                                    <div className="text-xs text-muted">{template.description}</div>
                                                </div>
                                                {template.status && <InsightsFunctionStatusTag status={template.status} />}
                                            </div>
                                        </InsightsFlowEditorToolbarNode>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                }
            >
                <LemonButton fullWidth onClick={() => setPopoverOpen(!popoverOpen)}>
                    More
                </LemonButton>
            </LemonDropdown>
        </div>
    )
}

export function InsightsFlowEditorPanelBuild(): JSX.Element {
    const { featureFlags } = useValues(featureFlagLogic)

    const registeredCategories = getRegisteredActionNodeCategories().filter(
        (cat) => !cat.featureFlag || featureFlags[cat.featureFlag]
    )

    return (
        <div className="flex overflow-y-auto flex-col gap-px p-2" data-attr="workflow-add-action">
            <span className="flex gap-2 text-sm font-semibold mt-2 items-center">
                Dispatch <LemonDivider className="flex-1" />
            </span>
            {ACTION_NODES_TO_SHOW.map((node, index) => (
                <InsightsFlowEditorToolbarNode key={`${node.type}-${index}`} action={node} />
            ))}
            <InsightsFunctionTemplatesChooser />

            <span className="flex gap-2 text-sm font-semibold mt-2 items-center">
                Delays <LemonDivider className="flex-1" />
            </span>
            {DELAY_NODES_TO_SHOW.map((action, index) => (
                <InsightsFlowEditorToolbarNode key={`${action.type}-${index}`} action={action} />
            ))}

            <span className="flex gap-2 text-sm font-semibold mt-2 items-center">
                Audience split <LemonDivider className="flex-1" />
            </span>
            {LOGIC_NODES_TO_SHOW.map((action, index) => (
                <InsightsFlowEditorToolbarNode key={`${action.type}-${index}`} action={action} />
            ))}

            <span className="flex gap-2 text-sm font-semibold mt-2 items-center">
                Insights actions <LemonDivider className="flex-1" />
            </span>
            {POSTHOG_NODES_TO_SHOW.map((action, index) => (
                <InsightsFlowEditorToolbarNode key={`${action.type}-${index}`} action={action} />
            ))}

            {registeredCategories.map((cat) => (
                <Fragment key={cat.label}>
                    <span className="flex gap-2 text-sm font-semibold mt-2 items-center">
                        {cat.label} <LemonDivider className="flex-1" />
                    </span>
                    {cat.nodes.map((action, index) => (
                        <InsightsFlowEditorToolbarNode key={`${action.type}-${index}`} action={action} />
                    ))}
                </Fragment>
            ))}
        </div>
    )
}
