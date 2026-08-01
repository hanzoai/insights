import { useActions, useValues } from 'kea'
import { useMemo } from 'react'

import { Checkbox, Divider, Input, Select, Tag, Link, Tooltip } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { AppMetricsSparkline } from 'lib/components/AppMetrics/AppMetricsSparkline'
import { MailHog } from 'lib/components/mascots'
import { MemberSelect } from 'lib/components/MemberSelect'
import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { updatedAtColumn } from 'lib/elements/Table/columnUtils'
import { TableLink } from 'lib/elements/Table/TableLink'
import { ProfilePicture } from 'lib/elements/ProfilePicture'
import { capitalizeFirstLetter } from 'lib/utils/strings'
import { urls } from 'scenes/urls'

import { AccessControlLevel, AccessControlResourceType } from '~/types'

import { getInsightsFlowStep } from './insightsflows/steps/InsightsFlowSteps'
import { InsightsFlow } from './insightsflows/types'
import { newWorkflowLogic } from './newWorkflowLogic'
import { workflowLogic } from './workflowLogic'
import { WorkflowStatusFilter, workflowsLogic } from './workflowsLogic'

const STATUS_CONFIG: Record<string, { label: string; type: 'success' | 'default' | 'muted' }> = {
    active: { label: 'Active', type: 'success' },
    draft: { label: 'Draft', type: 'default' },
    archived: { label: 'Archived', type: 'muted' },
}

function WorkflowTypeTag({ workflow }: { workflow: InsightsFlow }): JSX.Element {
    const hasMessagingAction = useMemo(() => {
        return workflow.actions.some((action) => {
            return ['function_email', 'function_sms', 'function_slack'].includes(action.type)
        })
    }, [workflow.actions])

    if (hasMessagingAction) {
        return <Tag type="completion">Messaging</Tag>
    }
    return <Tag type="default">Automation</Tag>
}

function WorkflowActionsSummary({ workflow }: { workflow: InsightsFlow }): JSX.Element {
    const actionsByType = useMemo(() => {
        return workflow.actions.reduce(
            (acc, action) => {
                const step = getInsightsFlowStep(action, {})
                if (!step || !step.type.startsWith('function')) {
                    return acc
                }
                const key = 'template_id' in action.config ? action.config.template_id : action.type
                acc[key] = {
                    count: (acc[key]?.count || 0) + 1,
                    icon: step.icon,
                    color: step.color,
                }
                return acc
            },
            {} as Record<
                string,
                {
                    count: number
                    icon: JSX.Element
                    color: string
                }
            >
        )
    }, [workflow.actions])

    return (
        <Link to={urls.workflow(workflow.id, 'workflow')}>
            <div className="flex flex-row gap-2 items-center">
                {Object.entries(actionsByType).map(([type, { count, icon, color }]) => (
                    <div
                        key={type}
                        className="rounded px-1 flex items-center justify-center gap-1"
                        style={{
                            backgroundColor: `${color}20`,
                            color,
                        }}
                    >
                        {icon} {count}
                    </div>
                ))}
            </div>
        </Link>
    )
}

export function WorkflowsTable(): JSX.Element {
    const logic = workflowsLogic()
    const {
        workflowsLoading,
        workflows,
        pagination,
        hasLoadedWorkflows,
        filters,
        selectedArchivedWorkflowIds,
        allArchivedSelected,
        selectedArchivedCount,
    } = useValues(logic)
    const {
        loadWorkflows,
        toggleWorkflowStatus,
        duplicateWorkflow,
        archiveWorkflow,
        restoreWorkflow,
        deleteWorkflow,
        deleteSelectedWorkflows,
        setFilters,
        toggleArchivedWorkflowSelection,
        selectAllArchivedWorkflows,
        clearArchivedWorkflowSelection,
    } = useActions(logic)
    const { showNewWorkflowModal } = useActions(newWorkflowLogic)

    useOnMountEffect(() => {
        // Tricky: unmount the new workflow logic when leaving the new workflow scene
        // We can't just reset state within the logic's unmount as that would trigger when switching tabs
        const newWorkflowLogic = workflowLogic.findMounted({
            id: 'new',
        })
        newWorkflowLogic?.unmount()

        // Since logic isn't getting unmounted when navigating away from this scene, we need to reload workflows
        // when the component re-mounts
        loadWorkflows()
    })

    const isArchived = filters.status === 'archived'

    const columns: TableColumns<InsightsFlow> = [
        ...(isArchived
            ? [
                  {
                      title: (
                          <Checkbox
                              checked={allArchivedSelected ? true : selectedArchivedCount > 0 ? 'indeterminate' : false}
                              onChange={(checked: boolean) =>
                                  checked
                                      ? selectAllArchivedWorkflows(workflows.results.map((w) => w.id))
                                      : clearArchivedWorkflowSelection()
                              }
                          />
                      ),
                      width: 0,
                      render: (_: any, item: InsightsFlow) => (
                          <Checkbox
                              checked={selectedArchivedWorkflowIds.has(item.id)}
                              onChange={() => toggleArchivedWorkflowSelection(item.id)}
                          />
                      ),
                  },
              ]
            : []),
        {
            title: 'Name',
            key: 'name',
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
            render: (_, item) => {
                return item.status === 'archived' ? (
                    <Tooltip title="Restore this workflow to make changes">
                        <span className="font-semibold text-sm text-muted">{item.name}</span>
                    </Tooltip>
                ) : (
                    <TableLink
                        to={urls.workflow(item.id, 'workflow')}
                        title={item.name}
                        description={item.description}
                    />
                )
            },
        },
        {
            title: 'Type',
            width: 0,
            render: (_, item) => {
                return <WorkflowTypeTag workflow={item} />
            },
        },
        {
            title: 'Trigger',
            width: 0,
            render: (_, item) => {
                return (
                    <Link to={urls.workflow(item.id, 'workflow') + '?node=trigger_node'}>
                        <Tag type="default">{capitalizeFirstLetter(item.trigger?.type ?? 'unknown')}</Tag>
                    </Link>
                )
            },
        },
        {
            title: 'Dispatches',
            width: 0,
            render: (_, item) => {
                return <WorkflowActionsSummary workflow={item} />
            },
        },
        {
            title: 'Created by',
            width: 0,
            render: (_, item) => {
                if (!item.created_by) {
                    return <span className="text-muted">Unknown</span>
                }
                return (
                    <div className="flex items-center gap-2">
                        <ProfilePicture user={item.created_by} size="sm" />
                        <span>{item.created_by.first_name || item.created_by.email}</span>
                    </div>
                )
            },
        },
        {
            ...(updatedAtColumn() as TableColumn<InsightsFlow, any>),
            width: 0,
        },
        {
            title: 'Last 7 days',
            width: 0,
            render: (_, { id }) => {
                return (
                    <Link to={urls.workflow(id, 'metrics')}>
                        <AppMetricsSparkline
                            logicKey={id}
                            forceParams={{
                                appSource: 'hog_flow',
                                appSourceId: id,
                                metricKind: ['success', 'failure'],
                                breakdownBy: 'metric_kind',
                                interval: 'day',
                                dateFrom: '-7d',
                            }}
                        />
                    </Link>
                )
            },
        },
        {
            title: 'Status',
            width: 0,
            render: (_, item) => {
                const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.draft
                return <Tag type={config.type}>{config.label}</Tag>
            },
        },
        {
            width: 0,
            render: function Render(_, workflow: InsightsFlow) {
                return (
                    <More
                        overlay={
                            <>
                                {workflow.status !== 'archived' && (
                                    <AccessControlAction
                                        resourceType={AccessControlResourceType.Workflow}
                                        minAccessLevel={AccessControlLevel.Editor}
                                        userAccessLevel={workflow.user_access_level}
                                    >
                                        <Button
                                            data-attr="workflow-edit"
                                            fullWidth
                                            status={workflow.status === 'draft' ? 'default' : 'danger'}
                                            onClick={() => toggleWorkflowStatus(workflow)}
                                            tooltip={
                                                workflow.status === 'draft'
                                                    ? 'Enables the workflow to start sending messages'
                                                    : 'Disables the workflow from sending any new messages. In-progress workflows will end immediately.'
                                            }
                                        >
                                            {workflow.status === 'draft' ? 'Enable' : 'Disable'}
                                        </Button>
                                    </AccessControlAction>
                                )}
                                <Button
                                    data-attr="workflow-duplicate"
                                    fullWidth
                                    onClick={() => duplicateWorkflow(workflow)}
                                >
                                    Duplicate
                                </Button>
                                <Divider />
                                <AccessControlAction
                                    resourceType={AccessControlResourceType.Workflow}
                                    minAccessLevel={AccessControlLevel.Editor}
                                    userAccessLevel={workflow.user_access_level}
                                >
                                    <Button
                                        data-attr="workflow-archive-restore"
                                        fullWidth
                                        status={workflow.status === 'archived' ? 'default' : 'danger'}
                                        onClick={() => {
                                            workflow.status === 'archived'
                                                ? restoreWorkflow(workflow)
                                                : archiveWorkflow(workflow)
                                        }}
                                    >
                                        {workflow.status === 'archived' ? 'Restore' : 'Archive'}
                                    </Button>
                                </AccessControlAction>
                                {workflow.status === 'archived' && (
                                    <AccessControlAction
                                        resourceType={AccessControlResourceType.Workflow}
                                        minAccessLevel={AccessControlLevel.Editor}
                                        userAccessLevel={workflow.user_access_level}
                                    >
                                        <Button
                                            data-attr="workflow-delete"
                                            fullWidth
                                            status="danger"
                                            onClick={() => deleteWorkflow(workflow)}
                                        >
                                            Delete
                                        </Button>
                                    </AccessControlAction>
                                )}
                            </>
                        }
                    />
                )
            },
        },
    ]

    const showProductIntroduction =
        hasLoadedWorkflows &&
        !workflowsLoading &&
        workflows.results.length === 0 &&
        !filters.search &&
        !filters.createdBy &&
        filters.status === 'all' &&
        // An empty page is not an empty project, so never offer onboarding while paging
        filters.page === 1

    return (
        <div className="workflows-section" data-attr="workflows-table" data-loading={workflowsLoading}>
            {showProductIntroduction && (
                <ProductIntroduction
                    productName="Workflow"
                    thingName="workflow"
                    description="Create workflows that automate actions or send messages to your users."
                    docsURL="https://hanzo.ai/docs/workflows/start-here"
                    action={() => {
                        showNewWorkflowModal()
                    }}
                    customHog={MailHog}
                    isEmpty
                    mcpSurfaceKey="workflows.create"
                />
            )}
            {!showProductIntroduction && (
                <>
                    <div className="flex justify-between gap-2 flex-wrap mb-4">
                        <Input
                            type="search"
                            placeholder="Search for workflows"
                            onChange={(search) => setFilters({ search })}
                            value={filters.search}
                        />
                        <div className="flex items-center gap-2">
                            <span>
                                <b>Status</b>
                            </span>
                            <Select
                                dropdownMatchSelectWidth={false}
                                size="small"
                                onChange={(value) => setFilters({ status: value as WorkflowStatusFilter })}
                                options={[
                                    { label: 'All', value: 'all' },
                                    { label: 'Active', value: 'active' },
                                    { label: 'Draft', value: 'draft' },
                                    { label: 'Archived', value: 'archived' },
                                ]}
                                value={filters.status}
                            />
                            <span className="ml-1">
                                <b>Created by</b>
                            </span>
                            <MemberSelect
                                value={filters.createdBy}
                                onChange={(user) => setFilters({ createdBy: user?.uuid || null })}
                            />
                        </div>
                    </div>

                    {isArchived && selectedArchivedCount > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-muted text-sm">
                                {selectedArchivedCount} workflow{selectedArchivedCount !== 1 ? 's' : ''} selected
                            </span>
                            <Button
                                type="secondary"
                                status="danger"
                                size="small"
                                onClick={deleteSelectedWorkflows}
                            >
                                Delete selected
                            </Button>
                        </div>
                    )}

                    <Table
                        dataSource={workflows.results}
                        loading={workflowsLoading}
                        rowKey="id"
                        columns={columns}
                        defaultSorting={{ columnKey: 'updatedAt', order: 1 }}
                        pagination={pagination}
                        nouns={['workflow', 'workflows']}
                        emptyState="No workflows matching filters"
                    />
                </>
            )}
        </div>
    )
}
