import './SavedInsights.scss'

import { useActions, useValues } from 'kea'
import { router } from 'kea-router'
import { ComponentType } from 'react'

import { IconHeart, IconHeartFilled, IconTrash } from '@hanzo/icons'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { ActivityLog } from 'lib/components/ActivityLog/ActivityLog'
import { BulkUpdateTagsButton } from 'lib/components/BulkActions/BulkUpdateTagsButton'
import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { TZLabel } from 'lib/components/TZLabel'
import { dayjs } from 'lib/dayjs'
import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { Dialog } from 'lib/elements/Dialog'
import { Divider } from 'lib/elements/Divider'
import { Table, TableColumns } from 'lib/elements/Table'
import { TableLink } from 'lib/elements/Table/TableLink'
import { Tabs } from 'lib/elements/Tabs'
import { Tag } from 'lib/elements/Tag'
import { ProfilePicture } from 'lib/elements/ProfilePicture'
import { Tooltip } from 'lib/elements/Tooltip'
import { accessLevelSatisfied } from 'lib/utils/accessControlUtils'
import { cn } from 'lib/utils/css-classes'
import { deleteInsightWithUndo } from 'lib/utils/deleteWithUndo'
import { isNonEmptyObject } from 'lib/utils/guards'
import { SavedInsightsEmptyState } from 'scenes/insights/EmptyStates'
import { useSummarizeInsight } from 'scenes/insights/summarizeInsight'
import { projectLogic } from 'scenes/projectLogic'
import { NewInsightShortcuts } from 'scenes/saved-insights/newInsightsMenu'
import { SavedInsightsFilters } from 'scenes/saved-insights/SavedInsightsFilters'
import { sceneConfigurations } from 'scenes/scenes'
import { Scene, SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { ProductKey } from '~/queries/schema/schema-general'
import { isNodeWithSource } from '~/queries/utils'
import {
    AccessControlLevel,
    AccessControlResourceType,
    ActivityScope,
    QueryBasedInsightModel,
    SavedInsightsTabs,
} from '~/types'

export * from './insightTypesMetadata'

import { isDraftInsightRow } from './draftInsight'
import { DraftInsightMoreMenu, DraftInsightNameCell } from './DraftInsightRow'
import { QUERY_TYPES_METADATA } from './insightTypesMetadata'
import { NewInsightButton } from './NewInsightMenu'
import { SavedInsightListItem, savedInsightsLogic } from './savedInsightsLogic'

export const scene: SceneExport = {
    component: SavedInsights,
    logic: savedInsightsLogic,
    productKey: ProductKey.PRODUCT_ANALYTICS,
}

export function InsightIcon({
    insight,
    className,
}: {
    insight: QueryBasedInsightModel
    className?: string
}): JSX.Element | null {
    let Icon: ComponentType<any> | null = null

    if ('query' in insight && isNonEmptyObject(insight.query)) {
        const insightType = isNodeWithSource(insight.query) ? insight.query.source.kind : insight.query.kind
        const insightMetadata = QUERY_TYPES_METADATA[insightType]
        Icon = insightMetadata && insightMetadata.icon
    }

    return Icon ? <Icon className={className} /> : null
}

export function SavedInsights(): JSX.Element {
    const { push } = useActions(router)
    const {
        loadInsights,
        updateFavoritedInsight,
        renameInsight,
        duplicateInsight,
        setSavedInsightsFilters,
        bulkDeleteInsights,
    } = useActions(savedInsightsLogic)
    const {
        insights,
        insightsLoading,
        filters,
        sorting,
        pagination,
        usingFilters,
        bulkDeleteResponseLoading,
        draftInsightRow,
    } = useValues(savedInsightsLogic)

    const { currentProjectId } = useValues(projectLogic)
    const summarizeInsight = useSummarizeInsight()

    const { tab } = filters

    const columns: TableColumns<SavedInsightListItem> = [
        {
            key: 'id',
            width: 32,
            render: function renderType(_, insight) {
                return <InsightIcon insight={insight} className="text-secondary text-2xl" />
            },
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: function renderName(name: string, insight) {
                if (isDraftInsightRow(insight)) {
                    return <DraftInsightNameCell item={insight} />
                }
                return (
                    <div className="flex items-center gap-1">
                        <TableLink
                            to={urls.insightView(insight.short_id)}
                            title={name || <i>{summarizeInsight(insight.query)}</i>}
                            description={insight.description}
                        />
                        <AccessControlAction
                            resourceType={AccessControlResourceType.Insight}
                            minAccessLevel={AccessControlLevel.Editor}
                            userAccessLevel={insight.user_access_level}
                        >
                            <Button
                                size="xsmall"
                                onClick={() => updateFavoritedInsight(insight, !insight.favorited)}
                                icon={
                                    insight.favorited ? (
                                        <IconHeartFilled className="text-danger" />
                                    ) : (
                                        <IconHeart className="text-secondary" />
                                    )
                                }
                                tooltip={`${insight.favorited ? 'Remove from' : 'Add to'} favorite insights`}
                            />
                        </AccessControlAction>
                        {insight.search_match_type === 'similar' && (
                            <span className="ml-auto">
                                <Tooltip title="Not an exact match for your search, but a close one">
                                    <Tag type="muted" size="small">
                                        similar
                                    </Tag>
                                </Tooltip>
                            </span>
                        )}
                    </div>
                )
            },
            sorter: (a, b) => (a.name || summarizeInsight(a.query)).localeCompare(b.name || summarizeInsight(b.query)),
        },
        {
            title: 'Tags',
            dataIndex: 'tags' as keyof SavedInsightListItem,
            key: 'tags',
            render: function renderTags(tags: string[]) {
                return <ObjectTags tags={[...tags].sort()} staticOnly />
            },
        },
        {
            title: 'Created by',
            dataIndex: 'created_by' as keyof SavedInsightListItem,
            render: function Render(_: any, item: SavedInsightListItem) {
                const { created_by } = item
                return (
                    <div className="flex flex-row items-center flex-nowrap">
                        {created_by && <ProfilePicture user={created_by} size="md" showName />}
                    </div>
                )
            },
            sorter: (a, b) =>
                (a.created_by?.first_name || a.created_by?.email || '').localeCompare(
                    b.created_by?.first_name || b.created_by?.email || ''
                ),
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            render: function RenderCreated(created_at: string) {
                return created_at ? (
                    <div className="whitespace-nowrap text-right">
                        <TZLabel time={created_at} />
                    </div>
                ) : (
                    <span className="text-secondary">—</span>
                )
            },
            align: 'right',
            defaultSortOrder: -1,
            sorter: (a, b) => dayjs(a.created_at || 0).diff(b.created_at || 0),
        },
        {
            title: 'Last modified',
            sorter: true,
            defaultSortOrder: -1,
            dataIndex: 'last_modified_at',
            render: function renderLastModified(last_modified_at: string) {
                return (
                    <div className="whitespace-nowrap">{last_modified_at && <TZLabel time={last_modified_at} />}</div>
                )
            },
        },
        {
            title: 'Last viewed',
            sorter: true,
            defaultSortOrder: -1,
            dataIndex: 'last_viewed_at',
            render: function renderLastViewed(last_viewed_at: string | null) {
                return (
                    <div className="whitespace-nowrap">
                        {last_viewed_at ? <TZLabel time={last_viewed_at} /> : <span className="text-muted">Never</span>}
                    </div>
                )
            },
        },
        {
            width: 0,
            render: function Render(_, insight) {
                if (isDraftInsightRow(insight)) {
                    return <DraftInsightMoreMenu item={insight} />
                }
                return (
                    <More
                        overlay={
                            <>
                                <Button to={urls.insightView(insight.short_id)} fullWidth>
                                    View
                                </Button>

                                <Divider />

                                <AccessControlAction
                                    resourceType={AccessControlResourceType.Insight}
                                    minAccessLevel={AccessControlLevel.Editor}
                                    userAccessLevel={insight.user_access_level}
                                >
                                    <Button to={urls.insightEdit(insight.short_id)} fullWidth>
                                        Edit
                                    </Button>
                                </AccessControlAction>

                                <AccessControlAction
                                    resourceType={AccessControlResourceType.Insight}
                                    minAccessLevel={AccessControlLevel.Editor}
                                    userAccessLevel={insight.user_access_level}
                                >
                                    <Button
                                        onClick={() => renameInsight(insight)}
                                        data-attr={`insight-item-${insight.short_id}-dropdown-rename`}
                                        fullWidth
                                    >
                                        Rename
                                    </Button>
                                </AccessControlAction>

                                <Button
                                    onClick={() => duplicateInsight(insight)}
                                    data-attr="duplicate-insight-from-list-view"
                                    fullWidth
                                >
                                    Duplicate
                                </Button>

                                <Divider />

                                <AccessControlAction
                                    resourceType={AccessControlResourceType.Insight}
                                    minAccessLevel={AccessControlLevel.Editor}
                                    userAccessLevel={insight.user_access_level}
                                >
                                    <Button
                                        status="danger"
                                        onClick={() => {
                                            Dialog.open({
                                                title: 'Delete insight?',
                                                description:
                                                    'Are you sure you want to delete this insight? This action can be undone.',
                                                primaryButton: {
                                                    children: 'Delete',
                                                    status: 'danger',
                                                    onClick: () =>
                                                        void deleteInsightWithUndo({
                                                            object: insight,
                                                            endpoint: `projects/${currentProjectId}/insights`,
                                                            callback: loadInsights,
                                                        }),
                                                },
                                                secondaryButton: {
                                                    children: 'Cancel',
                                                },
                                            })
                                        }}
                                        data-attr={`insight-item-${insight.short_id}-dropdown-remove`}
                                        fullWidth
                                    >
                                        Delete insight
                                    </Button>
                                </AccessControlAction>
                            </>
                        }
                    />
                )
            },
        },
    ]

    return (
        <SceneContent className={cn('saved-insights')}>
            <NewInsightShortcuts />
            <SceneTitleSection
                name={sceneConfigurations[Scene.SavedInsights].name}
                description={sceneConfigurations[Scene.SavedInsights].description}
                resourceType={{
                    type: sceneConfigurations[Scene.SavedInsights].iconType || 'default_icon_type',
                }}
                actions={<NewInsightButton />}
            />
            <Tabs
                activeKey={tab}
                onChange={(tab) => {
                    if (tab === SavedInsightsTabs.Alerts) {
                        push(urls.alerts())
                        return
                    }
                    setSavedInsightsFilters({ tab })
                }}
                tabs={[
                    { key: SavedInsightsTabs.All, label: 'All insights' },
                    { key: SavedInsightsTabs.Yours, label: 'My insights' },
                    { key: SavedInsightsTabs.Alerts, label: 'Alerts' },
                    { key: SavedInsightsTabs.History, label: 'History' },
                ]}
                sceneInset
            />

            {tab === SavedInsightsTabs.History ? (
                <ActivityLog scope={ActivityScope.INSIGHT} />
            ) : (
                <>
                    <SavedInsightsFilters
                        filters={filters}
                        setFilters={setSavedInsightsFilters}
                        quickFilters={
                            tab === SavedInsightsTabs.Yours
                                ? ['insightType', 'tags', 'favorites', 'featureFlags']
                                : undefined
                        }
                    />
                    <Table
                        loading={insightsLoading}
                        columns={columns}
                        dataSource={draftInsightRow ? [draftInsightRow, ...insights.results] : insights.results}
                        rowClassName={(record) => (isDraftInsightRow(record) ? 'bg-warning-highlight' : null)}
                        pagination={pagination}
                        noSortingCancellation
                        sorting={sorting}
                        onSort={(newSorting) =>
                            setSavedInsightsFilters({
                                order: newSorting
                                    ? `${newSorting.order === -1 ? '-' : ''}${newSorting.columnKey}`
                                    : undefined,
                            })
                        }
                        rowKey="id"
                        loadingSkeletonRows={15}
                        nouns={['insight', 'insights']}
                        hideSortingIndicatorWhenInactive
                        emptyState={
                            !insightsLoading && insights.count < 1 ? (
                                <div className="py-8">
                                    <SavedInsightsEmptyState filters={filters} usingFilters={usingFilters} />
                                </div>
                            ) : undefined
                        }
                        bulkSelection={{
                            getKey: (insight: SavedInsightListItem): number => insight.id,
                            isRowSelectable: (insight: SavedInsightListItem) =>
                                isDraftInsightRow(insight)
                                    ? { disabledReason: 'This draft only exists in your browser.' }
                                    : accessLevelSatisfied(
                                            AccessControlResourceType.Insight,
                                            insight.user_access_level,
                                            AccessControlLevel.Editor
                                        )
                                      ? true
                                      : { disabledReason: "You don't have permission to edit this insight." },
                            rowAriaLabel: (insight: SavedInsightListItem) =>
                                `Select insight ${insight.name || 'Untitled'}`,
                            headerAriaLabel: 'Select all insights on this page',
                            renderActions: (ctx) => (
                                <>
                                    <BulkUpdateTagsButton
                                        resource="insights"
                                        selectedIds={ctx.selectedKeys}
                                        onSuccess={() => {
                                            ctx.clearSelection()
                                            loadInsights()
                                        }}
                                    />
                                    <Button
                                        type="primary"
                                        status="danger"
                                        size="small"
                                        icon={<IconTrash />}
                                        loading={bulkDeleteResponseLoading}
                                        onClick={() => {
                                            const count = ctx.selectedCount
                                            const noun = count === 1 ? 'insight' : 'insights'
                                            Dialog.open({
                                                title: `Delete ${count} ${noun}?`,
                                                description: `Are you sure you want to delete ${count} ${noun}? This action can be undone.`,
                                                primaryButton: {
                                                    children: 'Delete',
                                                    status: 'danger',
                                                    onClick: () => {
                                                        bulkDeleteInsights({ ids: [...ctx.selectedKeys] })
                                                        ctx.clearSelection()
                                                    },
                                                },
                                                secondaryButton: {
                                                    children: 'Cancel',
                                                },
                                            })
                                        }}
                                    >
                                        Delete selected
                                    </Button>
                                </>
                            ),
                        }}
                    />
                </>
            )}
        </SceneContent>
    )
}
