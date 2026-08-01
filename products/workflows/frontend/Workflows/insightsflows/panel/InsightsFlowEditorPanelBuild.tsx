import { useActions, useValues } from 'kea'
import { Fragment, useEffect, useState } from 'react'

import { IconDrag } from '@hanzo/icons'
import { Button, Divider, Dropdown, Input, Tag, SpinnerOverlay } from '@hanzo/elements'

import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { insightsFunctionTemplateListLogic } from 'scenes/insights-functions/list/insightsFunctionTemplateListLogic'
import { InsightsFunctionStatusTag } from 'scenes/insights-functions/misc/InsightsFunctionStatusTag'

import { InsightsFunctionTemplateType } from '~/types'

import { CreateActionType, hogFlowEditorLogic } from '../hogFlowEditorLogic'
// Side-effect imports: register product-specific trigger and action nodes
import '../registry'

import { FEATURE_FLAGS } from 'lib/constants'

import { PERSON_DEPENDENT_ACTION_TYPES, workflowLogic } from '../../workflowLogic'
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

const PUSH_NOTIFICATION_ACTION_NODE: CreateActionType = {
    type: 'function_push',
    name: 'Push',
    description: 'Send a push notification to the user.',
    config: { template_id: 'template-native-push', inputs: {} },
}

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
        name: 'Time window',
        description: 'Wait for the next allowed time window before continuing.',
        config: {
            timezone: null,
            day: 'any',
            time: 'any',
        },
    },
    {
        type: 'wait_until_condition',
        name: 'Wait until',
        description: 'Wait until a matching event fires or a condition is met, up to a maximum duration.',
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

export const POSTFN_NODES_TO_SHOW: CreateActionType[] = [
    {
        type: 'function',
        name: 'Set variable',
        description: 'Set a workflow variable.',
        config: { template_id: 'template-insights-set-variable', inputs: {} },
    },
    {
        type: 'function',
        name: 'Capture event',
        description: 'Capture an event to Insights.',
        config: { template_id: 'template-insights-capture', inputs: {} },
    },
    {
        type: 'function',
        name: 'Update person property',
        description: 'Set properties of a person in Insights.',
        config: { template_id: 'template-insights-update-person-properties', inputs: {} },
    },
    {
        type: 'function',
        name: 'Set group property',
        description: 'Set properties of a group in Insights.',
        config: { template_id: 'template-insights-group-identify', inputs: {} },
    },
]

const TEMPLATE_IDS_AT_TOP_LEVEL: string[] = [
    ...ACTION_NODES_TO_SHOW.map((action) => (action.config as any).template_id),
    ...DELAY_NODES_TO_SHOW.map((action) => (action.config as any).template_id),
    ...LOGIC_NODES_TO_SHOW.map((action) => (action.config as any).template_id),
    ...POSTFN_NODES_TO_SHOW.map((action) => (action.config as any).template_id),
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
    const { setNodeToBeAdded } = useActions(hogFlowEditorLogic)

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
            <Button
                icon={<span style={{ color: step.color }}>{step.icon}</span>}
                sideIcon={<IconDrag />}
                fullWidth
            >
                {children ?? action.name}
            </Button>
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

    if (['hidden', 'coming_soon'].includes(template.status)) {
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
            <Dropdown
                closeOnClickInside={false}
                visible={popoverOpen}
                onClickOutside={() => setPopoverOpen(false)}
                placement="bottom-end"
                overlay={
                    <div className="flex flex-col w-100 h-120 flex-1 overflow-hidden gap-1">
                        <Input
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
                <Button fullWidth onClick={() => setPopoverOpen(!popoverOpen)}>
                    More
                </Button>
            </Dropdown>
        </div>
    )
}

export function InsightsFlowEditorPanelBuild(): JSX.Element {
    const { featureFlags } = useValues(featureFlagLogic)
    const { isRowScopedTrigger } = useValues(workflowLogic)

    const registeredCategories = getRegisteredActionNodeCategories().filter(
        (cat) => !cat.featureFlag || featureFlags[cat.featureFlag]
    )

    // Warehouse-triggered workflows have no person, so don't offer person-dependent steps at all.
    const hideIfRowScoped = (nodes: CreateActionType[]): CreateActionType[] =>
        isRowScopedTrigger ? nodes.filter((node) => !PERSON_DEPENDENT_ACTION_TYPES.has(node.type)) : nodes

    const delayNodes = hideIfRowScoped(DELAY_NODES_TO_SHOW)
    const logicNodes = hideIfRowScoped(LOGIC_NODES_TO_SHOW)

    return (
        <div className="flex overflow-y-auto flex-col gap-px p-2" data-attr="workflow-add-action">
            <span className="flex gap-2 text-sm font-semibold mt-2 items-center">
                Dispatch <Divider className="flex-1" />
            </span>
            {ACTION_NODES_TO_SHOW.map((node, index) => (
                <InsightsFlowEditorToolbarNode key={`${node.type}-${index}`} action={node} />
            ))}
            {featureFlags[FEATURE_FLAGS.WORKFLOWS_PUSH_NOTIFICATIONS] && (
                <InsightsFlowEditorToolbarNode key="push-notifications" action={PUSH_NOTIFICATION_ACTION_NODE}>
                    <span className="inline-flex items-center gap-1.5">
                        {PUSH_NOTIFICATION_ACTION_NODE.name}
                        <Tag type="completion">Beta</Tag>
                    </span>
                </InsightsFlowEditorToolbarNode>
            )}
            <InsightsFunctionTemplatesChooser />

            <span className="flex gap-2 text-sm font-semibold mt-2 items-center">
                Delays <Divider className="flex-1" />
            </span>
            {delayNodes.map((action, index) => (
                <InsightsFlowEditorToolbarNode key={`${action.type}-${index}`} action={action} />
            ))}

            {logicNodes.length > 0 && (
                <>
                    <span className="flex gap-2 text-sm font-semibold mt-2 items-center">
                        Audience split <Divider className="flex-1" />
                    </span>
                    {logicNodes.map((action, index) => (
                        <InsightsFlowEditorToolbarNode key={`${action.type}-${index}`} action={action} />
                    ))}
                </>
            )}

            <span className="flex gap-2 text-sm font-semibold mt-2 items-center">
                Insights actions <Divider className="flex-1" />
            </span>
            {POSTFN_NODES_TO_SHOW.map((action, index) => (
                <InsightsFlowEditorToolbarNode key={`${action.type}-${index}`} action={action} />
            ))}

            {registeredCategories.map((cat) => (
                <Fragment key={cat.label}>
                    <span className="flex gap-2 text-sm font-semibold mt-2 items-center">
                        {cat.label} <Divider className="flex-1" />
                    </span>
                    {cat.nodes.map((action, index) => (
                        <InsightsFlowEditorToolbarNode key={`${action.type}-${index}`} action={action} />
                    ))}
                </Fragment>
            ))}
        </div>
    )
}
