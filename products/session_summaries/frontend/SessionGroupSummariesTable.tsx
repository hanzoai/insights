import { useActions, useValues } from 'kea'

import { IconEllipsis, IconTrash } from '@hanzo/icons'
import { Button, Input, Tag } from '@hanzo/elements'

import { AllowTrainingCallout } from 'lib/components/AllowTrainingCallout/AllowTrainingCallout'
import { MemberSelect } from 'lib/components/MemberSelect'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { Menu } from 'lib/elements/Menu'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { atColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { Link } from 'lib/elements/Link'
import { sceneConfigurations } from 'scenes/scenes'
import { Scene, SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'

import { sessionGroupSummariesTableLogic } from './sessionGroupSummariesTableLogic'
import { SessionGroupSummaryListItemType } from './types'

export const scene: SceneExport = {
    component: SessionGroupSummariesTable,
}

function titleColumn(): TableColumn<SessionGroupSummaryListItemType, 'title'> {
    return {
        title: 'Title',
        dataIndex: 'title',
        width: '100%',
        render: function Render(title, { id }) {
            return (
                <Link data-attr="session-group-summary-title" to={urls.sessionSummary(id)} className="font-semibold">
                    {title || 'Untitled'}
                </Link>
            )
        },
        sorter: true,
    }
}

function sessionCountColumn(): TableColumn<SessionGroupSummaryListItemType, 'session_count'> {
    return {
        title: 'Sessions',
        dataIndex: 'session_count',
        render: function Render(session_count) {
            return session_count
        },
        sorter: true,
    }
}

export function SessionGroupSummariesTable(): JSX.Element {
    const { filters, sessionGroupSummariesResponseLoading, tableSorting, pagination, sessionGroupSummaries } =
        useValues(sessionGroupSummariesTableLogic)
    const { loadSessionGroupSummaries, setFilters, tableSortingChanged, deleteSessionGroupSummary } = useActions(
        sessionGroupSummariesTableLogic
    )
    useOnMountEffect(loadSessionGroupSummaries)
    const columns: TableColumns<SessionGroupSummaryListItemType> = [
        titleColumn() as TableColumn<
            SessionGroupSummaryListItemType,
            keyof SessionGroupSummaryListItemType | undefined
        >,
        sessionCountColumn() as TableColumn<
            SessionGroupSummaryListItemType,
            keyof SessionGroupSummaryListItemType | undefined
        >,
        createdByColumn<SessionGroupSummaryListItemType>() as TableColumn<
            SessionGroupSummaryListItemType,
            keyof SessionGroupSummaryListItemType | undefined
        >,
        atColumn<SessionGroupSummaryListItemType>('created_at', 'Created') as TableColumn<
            SessionGroupSummaryListItemType,
            keyof SessionGroupSummaryListItemType | undefined
        >,
        {
            render: function Render(_, summary) {
                return (
                    <Menu
                        items={[
                            {
                                label: 'Delete',
                                icon: <IconTrash />,
                                status: 'danger',
                                onClick: () => {
                                    deleteSessionGroupSummary(summary.id)
                                },
                            },
                        ]}
                    >
                        <Button aria-label="more" icon={<IconEllipsis />} size="small" />
                    </Menu>
                )
            },
        },
    ]
    const config = sceneConfigurations[Scene.SessionGroupSummariesTable]
    return (
        <SceneContent>
            <SceneTitleSection
                name={config.name}
                description={config.description}
                resourceType={{
                    type: config.iconType || 'notebook',
                }}
                actions={<Tag type="warning">BETA</Tag>}
            />
            <AllowTrainingCallout featureName="Session summaries" />
            <div className="deprecated-space-y-4">
                <div className="flex justify-between gap-2 flex-wrap">
                    <Input
                        type="search"
                        placeholder="Search for summaries"
                        onChange={(s) => {
                            setFilters({ search: s })
                        }}
                        value={filters.search}
                        data-attr="session-group-summaries-search"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span>Created by:</span>
                            <MemberSelect
                                value={filters.createdBy}
                                onChange={(user) => setFilters({ createdBy: user?.uuid || null })}
                            />
                        </div>
                    </div>
                </div>
                <Table
                    data-attr="session-group-summaries-table"
                    pagination={pagination}
                    dataSource={sessionGroupSummaries}
                    rowKey="id"
                    columns={columns}
                    loading={sessionGroupSummariesResponseLoading}
                    defaultSorting={tableSorting}
                    emptyState="No session group summaries matching your filters!"
                    nouns={['summary', 'summaries']}
                    onSort={tableSortingChanged}
                />
            </div>
        </SceneContent>
    )
}
