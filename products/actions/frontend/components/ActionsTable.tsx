import { useActions, useValues } from 'kea'

import { IconPin, IconPinFilled } from '@hanzo/icons'
import { Input } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { MemberSelectMultiplePopover } from 'lib/components/MemberSelectMultiplePopover'
import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { TagSelect } from 'lib/components/TagSelect'
import ViewRecordingsPlaylistButton from 'lib/components/ViewRecordingButton/ViewRecordingsPlaylistButton'
import { FEATURE_FLAGS } from 'lib/constants'
import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { Divider } from 'lib/elements/Divider'
import { Skeleton } from 'lib/elements/Skeleton'
import { Table } from 'lib/elements/Table'
import { createdAtColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { TableLink } from 'lib/elements/Table/TableLink'
import { Sorting } from 'lib/elements/Table/sorting'
import { TableColumn, TableColumns } from 'lib/elements/Table/types'
import { Tooltip } from 'lib/elements/Tooltip'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { InsightVizNode, NodeKind, ProductIntentContext, ProductKey } from '~/queries/schema/schema-general'
import {
    AccessControlLevel,
    AccessControlResourceType,
    ActionType,
    ChartDisplayType,
    FilterLogicalOperator,
} from '~/types'

import { ACTIONS_PER_PAGE, actionsLogic } from '../logics/actionsLogic'
import { ActionStepConditions, ActionStepSummary } from '../utils/actionStepDescription'
import { deleteActionWithWarning } from '../utils/deleteAction'
import { NewActionButton } from './NewActionButton'

export function ActionsTable(): JSX.Element {
    const { actionsList, actionCount, actionsResponseLoading, page, filters, searchTerm, shouldShowEmptyState } =
        useValues(actionsLogic)
    const { setSearchTerm, setFilters, setPage, pinAction, unpinAction, loadActions } = useActions(actionsLogic)
    const { addProductIntentForCrossSell } = useActions(teamLogic)
    const { updateHasSeenProductIntroFor } = useActions(userLogic)
    const { featureFlags } = useValues(featureFlagLogic)
    const referenceCountEnabled = !!featureFlags[FEATURE_FLAGS.ACTION_REFERENCE_COUNT]

    const sorting: Sorting | null = filters.ordering
        ? { columnKey: filters.ordering.replace(/^-/, ''), order: filters.ordering.startsWith('-') ? -1 : 1 }
        : null

    const tryInInsightsUrl = (action: ActionType): string => {
        const query: InsightVizNode = {
            kind: NodeKind.InsightVizNode,
            source: {
                kind: NodeKind.TrendsQuery,
                series: [
                    {
                        id: action.id,
                        name: action.name || undefined,
                        kind: NodeKind.ActionsNode,
                    },
                ],
                interval: 'day',
                trendsFilter: { display: ChartDisplayType.ActionsLineGraph },
            },
        }
        return urls.insightNew({ query })
    }

    const columns: TableColumns<ActionType> = [
        {
            width: 0,
            title: 'Pinned',
            dataIndex: 'pinned_at',
            sorter: true,
            render: function Render(pinned, action) {
                return (
                    <Button
                        size="small"
                        onClick={pinned ? () => unpinAction(action) : () => pinAction(action)}
                        tooltip={pinned ? 'Unpin action' : 'Pin action'}
                        icon={pinned ? <IconPinFilled /> : <IconPin />}
                    />
                )
            },
        },
        {
            title: 'Name',
            dataIndex: 'name',
            width: '25%',
            sorter: true,
            render: function RenderName(_, action: ActionType, index: number): JSX.Element {
                return (
                    <TableLink
                        data-attr={'action-link-' + index}
                        to={urls.action(action.id)}
                        title={action.name || <i>Unnamed</i>}
                        description={action.description}
                    />
                )
            },
        },
        {
            title: 'Type',
            key: 'type',
            render: function RenderType(_, action: ActionType): JSX.Element {
                if (!action.steps?.length) {
                    return <i>Empty – set this action up</i>
                }
                return (
                    <span>
                        {action.steps.map((step, index) => (
                            <Tooltip key={index} title={<ActionStepConditions step={step} />} placement="right">
                                <div className="w-fit">
                                    <ActionStepSummary step={step} />
                                </div>
                            </Tooltip>
                        ))}
                    </span>
                )
            },
        },
        {
            title: 'Tags',
            dataIndex: 'tags',
            width: 250,
            key: 'tags',
            render: function renderTags(tags: string[]) {
                return <ObjectTags tags={tags} staticOnly />
            },
        } as TableColumn<ActionType, keyof ActionType | undefined>,
        ...(referenceCountEnabled
            ? [
                  {
                      title: 'Used by',
                      dataIndex: 'reference_count',
                      render: function RenderReferenceCount(_, action: ActionType) {
                          const count = action.reference_count
                          if (count === undefined) {
                              return actionsResponseLoading ? (
                                  <Skeleton className="w-12 h-4" />
                              ) : (
                                  <span className="text-secondary">—</span>
                              )
                          }
                          return (
                              <span className="text-secondary">
                                  {count > 0 ? `${count} ${count === 1 ? 'reference' : 'references'}` : 'None'}
                              </span>
                          )
                      },
                  } as TableColumn<ActionType, keyof ActionType | undefined>,
              ]
            : []),
        { ...createdByColumn(), sorter: true } as TableColumn<ActionType, keyof ActionType | undefined>,
        { ...createdAtColumn(), sorter: true } as TableColumn<ActionType, keyof ActionType | undefined>,
        {
            width: 0,
            render: function RenderActions(_, action) {
                return (
                    <More
                        overlay={
                            <>
                                <AccessControlAction
                                    resourceType={AccessControlResourceType.Action}
                                    minAccessLevel={AccessControlLevel.Editor}
                                    userAccessLevel={action.user_access_level}
                                >
                                    <Button to={urls.action(action.id)} fullWidth>
                                        Edit
                                    </Button>
                                </AccessControlAction>
                                <Button to={urls.duplicateAction(action)} fullWidth>
                                    Duplicate
                                </Button>
                                <ViewRecordingsPlaylistButton
                                    filters={{
                                        filter_group: {
                                            type: FilterLogicalOperator.And,
                                            values: [
                                                {
                                                    type: FilterLogicalOperator.And,
                                                    values: [
                                                        {
                                                            id: action.id,
                                                            type: 'actions',
                                                            order: 0,
                                                            name: action.name,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    }}
                                    onClick={() => {
                                        addProductIntentForCrossSell({
                                            from: ProductKey.ACTIONS,
                                            to: ProductKey.SESSION_REPLAY,
                                            intent_context: ProductIntentContext.ACTION_VIEW_RECORDINGS,
                                        })
                                    }}
                                    fullWidth
                                    data-attr="action-table-view-recordings"
                                />
                                <Button to={tryInInsightsUrl(action)} fullWidth targetBlank>
                                    Try out in Insights
                                </Button>
                                <Divider />
                                <AccessControlAction
                                    resourceType={AccessControlResourceType.Action}
                                    minAccessLevel={AccessControlLevel.Editor}
                                    userAccessLevel={action.user_access_level}
                                >
                                    <Button
                                        status="danger"
                                        onClick={() => {
                                            void deleteActionWithWarning(action, loadActions)
                                        }}
                                        fullWidth
                                    >
                                        Delete action
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
        <div data-attr="manage-events-table">
            <ProductIntroduction
                productName="Actions"
                productKey={ProductKey.ACTIONS}
                thingName="action"
                isEmpty={shouldShowEmptyState}
                description="Use actions to combine events that you want to have tracked together or to make detailed Autocapture events easier to reuse."
                docsURL="https://hanzo.ai/docs/data/actions"
                actionElementOverride={
                    <NewActionButton onSelectOption={() => updateHasSeenProductIntroFor(ProductKey.ACTIONS)} />
                }
                mcpSurfaceKey="actions.create"
            />
            {!shouldShowEmptyState && (
                <>
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                        <Input
                            type="search"
                            placeholder="Search for actions"
                            onChange={setSearchTerm}
                            value={searchTerm}
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                            <span>Filter to:</span>
                            <TagSelect
                                defaultLabel="Any tags"
                                value={filters.tags}
                                onChange={(tags) => setFilters({ tags })}
                            />
                            <MemberSelectMultiplePopover
                                value={filters.createdBy}
                                onChange={(ids) => setFilters({ createdBy: ids })}
                            />
                        </div>
                    </div>
                    <Table
                        columns={columns}
                        loading={actionsResponseLoading}
                        rowKey="id"
                        data-attr="actions-table"
                        dataSource={actionsList}
                        sorting={sorting}
                        onSort={(newSorting) =>
                            setFilters({
                                ordering: newSorting
                                    ? `${newSorting.order === -1 ? '-' : ''}${newSorting.columnKey}`
                                    : '-created_by',
                            })
                        }
                        pagination={{
                            controlled: true,
                            currentPage: page,
                            entryCount: actionCount,
                            pageSize: ACTIONS_PER_PAGE,
                            onForward: page * ACTIONS_PER_PAGE < actionCount ? () => setPage(page + 1) : undefined,
                            onBackward: page > 1 ? () => setPage(page - 1) : undefined,
                        }}
                        emptyState="No results. Create a new action?"
                    />
                </>
            )}
        </div>
    )
}
