import { useActions, useValues } from 'kea'

import { IconChevronDown, IconHome, IconLock, IconPin, IconPinFilled, IconShare } from '@hanzo/icons'
import { Input, Popover } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { MemberSelect } from 'lib/components/MemberSelect'
import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { Divider } from 'lib/elements/Divider'
import { Row } from 'lib/elements/Row'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { TableLink } from 'lib/elements/Table/TableLink'
import { atColumn, createdAtColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { Link } from 'lib/elements/Link'
import { Tooltip } from 'lib/elements/Tooltip'
import { accessLevelSatisfied } from 'lib/utils/accessControlUtils'
import { DashboardEventSource } from 'lib/utils/eventUsageLogic'
import { dashboardLogic } from 'scenes/dashboard/dashboardLogic'
import { DashboardsFilters, DashboardsTab, dashboardsLogic } from 'scenes/dashboard/dashboards/dashboardsLogic'
import { deleteDashboardLogic } from 'scenes/dashboard/deleteDashboardLogic'
import { duplicateDashboardLogic } from 'scenes/dashboard/duplicateDashboardLogic'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

import { dashboardsModel, nameCompareFunction } from '~/models/dashboardsModel'
import {
    AccessControlLevel,
    AccessControlResourceType,
    DashboardBasicType,
    DashboardMode,
    DashboardType,
} from '~/types'

import { DASHBOARD_CANNOT_EDIT_MESSAGE } from '../DashboardHeader'

export function DashboardsTableContainer(): JSX.Element {
    const { dashboardsLoading } = useValues(dashboardsModel)
    const { dashboards, filters } = useValues(dashboardsLogic)

    return <DashboardsTable dashboards={dashboards} dashboardsLoading={dashboardsLoading} filters={filters} />
}

interface DashboardsTableProps {
    dashboards: DashboardBasicType[]
    filters: DashboardsFilters
    dashboardsLoading: boolean
    extraActions?: JSX.Element | JSX.Element[]
    hideActions?: boolean
}

export function DashboardsTable({
    dashboards,
    dashboardsLoading,
    filters,
    extraActions,
    hideActions,
}: DashboardsTableProps): JSX.Element {
    const { unpinDashboard, pinDashboard } = useActions(dashboardsModel)
    const { setFilters, tableSortingChanged, setTagSearch, setShowTagPopover } = useActions(dashboardsLogic)
    const { tableSorting, currentTab, filteredTags, tagSearch, showTagPopover } = useValues(dashboardsLogic)
    const { currentTeam } = useValues(teamLogic)
    const { showDuplicateDashboardModal } = useActions(duplicateDashboardLogic)
    const { showDeleteDashboardModal } = useActions(deleteDashboardLogic)

    const handleTagToggle = (tag: string): void => {
        const selected = new Set(filters.tags || [])
        if (selected.has(tag)) {
            selected.delete(tag)
        } else {
            selected.add(tag)
        }
        setFilters({ tags: Array.from(selected) })
    }

    const columns: TableColumns<DashboardType> = [
        {
            width: 0,
            dataIndex: 'pinned',
            render: function Render(pinned, { id }) {
                return (
                    <Button
                        size="small"
                        onClick={
                            pinned
                                ? () => unpinDashboard(id, DashboardEventSource.DashboardsList)
                                : () => pinDashboard(id, DashboardEventSource.DashboardsList)
                        }
                        tooltip={pinned ? 'Unpin dashboard' : 'Pin dashboard'}
                        icon={pinned ? <IconPinFilled /> : <IconPin />}
                    />
                )
            },
        },
        {
            title: 'Name',
            dataIndex: 'name',
            width: '40%',
            render: function Render(_, { id, name, description, is_shared, user_access_level }) {
                const isPrimary = id === currentTeam?.primary_dashboard
                const canEditDashboard = accessLevelSatisfied(
                    AccessControlResourceType.Dashboard,
                    user_access_level,
                    AccessControlLevel.Editor
                )
                return (
                    <TableLink
                        to={urls.dashboard(id)}
                        title={
                            <>
                                <span data-attr="dashboard-name">{name || 'Untitled'}</span>
                                {is_shared && (
                                    <Tooltip title="This dashboard is shared publicly.">
                                        <IconShare className="ml-1 text-base text-link" />
                                    </Tooltip>
                                )}
                                {!canEditDashboard && (
                                    <Tooltip title={DASHBOARD_CANNOT_EDIT_MESSAGE}>
                                        <IconLock className="ml-1 text-base text-secondary" />
                                    </Tooltip>
                                )}
                                {isPrimary && (
                                    <Tooltip title="The primary dashboard is shown on the project home page.">
                                        <span>
                                            <IconHome className="ml-1 text-base text-warning" />
                                        </span>
                                    </Tooltip>
                                )}
                            </>
                        }
                        description={description}
                    />
                )
            },
            sorter: nameCompareFunction,
        },
        {
            title: 'Tags',
            dataIndex: 'tags' as keyof DashboardType,
            render: function Render(tags: DashboardType['tags']) {
                return tags ? <ObjectTags tags={[...tags].sort()} staticOnly /> : null
            },
        } as TableColumn<DashboardType, keyof DashboardType | undefined>,
        createdByColumn<DashboardType>() as TableColumn<DashboardType, keyof DashboardType | undefined>,
        createdAtColumn<DashboardType>() as TableColumn<DashboardType, keyof DashboardType | undefined>,
        atColumn<DashboardType>('last_accessed_at', 'Last accessed at') as TableColumn<
            DashboardType,
            keyof DashboardType | undefined
        >,
        hideActions
            ? {}
            : {
                  width: 0,
                  render: function RenderActions(_, { id, name, user_access_level }: DashboardType) {
                      return (
                          <More
                              overlay={
                                  <>
                                      <Button
                                          to={urls.dashboard(id)}
                                          onClick={() => {
                                              dashboardLogic({ id }).mount()
                                              dashboardLogic({ id }).actions.setDashboardMode(
                                                  null,
                                                  DashboardEventSource.DashboardsList
                                              )
                                          }}
                                          fullWidth
                                      >
                                          View
                                      </Button>

                                      <AccessControlAction
                                          resourceType={AccessControlResourceType.Dashboard}
                                          minAccessLevel={AccessControlLevel.Editor}
                                          userAccessLevel={user_access_level}
                                      >
                                          <Button
                                              to={urls.dashboard(id)}
                                              onClick={() => {
                                                  dashboardLogic({ id }).mount()
                                                  dashboardLogic({ id }).actions.setDashboardMode(
                                                      DashboardMode.Edit,
                                                      DashboardEventSource.DashboardsList
                                                  )
                                              }}
                                              fullWidth
                                          >
                                              Edit
                                          </Button>
                                      </AccessControlAction>

                                      <Button
                                          onClick={() => {
                                              showDuplicateDashboardModal(id, name)
                                          }}
                                          fullWidth
                                      >
                                          Duplicate
                                      </Button>

                                      <Divider />

                                      <Row icon={<IconHome className="text-warning" />} fullWidth status="warning">
                                          <span className="text-secondary">
                                              Change the default dashboard
                                              <br />
                                              from the <Link to={urls.projectHomepage()}>project home page</Link>.
                                          </span>
                                      </Row>

                                      <Divider />

                                      <AccessControlAction
                                          resourceType={AccessControlResourceType.Dashboard}
                                          minAccessLevel={AccessControlLevel.Editor}
                                          userAccessLevel={user_access_level}
                                      >
                                          <Button
                                              onClick={() => showDeleteDashboardModal(id)}
                                              fullWidth
                                              status="danger"
                                          >
                                              Delete dashboard
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
        <>
            <div className="flex justify-between gap-2 flex-wrap mb-4">
                <Input
                    type="search"
                    placeholder="Search for dashboards"
                    onChange={(x) => setFilters({ search: x })}
                    value={filters.search}
                />
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span>Filter to:</span>
                        {currentTab !== DashboardsTab.Pinned && (
                            <div className="flex items-center gap-2">
                                <Button
                                    active={filters.pinned}
                                    type="secondary"
                                    size="small"
                                    onClick={() => setFilters({ pinned: !filters.pinned })}
                                    icon={<IconPin />}
                                >
                                    Pinned
                                </Button>
                            </div>
                        )}
                        <Popover
                            visible={showTagPopover}
                            onClickOutside={() => setShowTagPopover(false)}
                            overlay={
                                <div className="max-w-100 deprecated-space-y-2">
                                    <Input
                                        type="search"
                                        placeholder="Search tags"
                                        autoFocus
                                        value={tagSearch}
                                        onChange={setTagSearch}
                                        fullWidth
                                        className="max-w-full"
                                    />
                                    <ul className="deprecated-space-y-px">
                                        {filteredTags.map((tag: string) => (
                                            <li key={tag}>
                                                <Button
                                                    fullWidth
                                                    role="menuitem"
                                                    size="small"
                                                    onClick={() => handleTagToggle(tag)}
                                                >
                                                    <span className="flex items-center justify-between gap-2 flex-1">
                                                        <span className="flex items-center gap-2 max-w-full">
                                                            <input
                                                                type="checkbox"
                                                                className="cursor-pointer"
                                                                checked={filters.tags?.includes(tag) || false}
                                                                readOnly
                                                            />
                                                            <span>{tag}</span>
                                                        </span>
                                                    </span>
                                                </Button>
                                            </li>
                                        ))}
                                        {filteredTags.length === 0 ? (
                                            <div className="p-2 text-secondary italic truncate border-t">
                                                {tagSearch ? <span>No matching tags</span> : <span>No tags</span>}
                                            </div>
                                        ) : null}
                                        {(filters.tags?.length || 0) > 0 && (
                                            <>
                                                <div className="my-1 border-t" />
                                                <li>
                                                    <Button
                                                        fullWidth
                                                        role="menuitem"
                                                        size="small"
                                                        onClick={() => setFilters({ tags: [] })}
                                                        type="tertiary"
                                                    >
                                                        Clear selection
                                                    </Button>
                                                </li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            }
                        >
                            <Button
                                type="secondary"
                                size="small"
                                icon={<IconChevronDown />}
                                sideIcon={null}
                                active={(filters.tags?.length || 0) > 0}
                                onClick={() => setShowTagPopover(!showTagPopover)}
                            >
                                Tags
                                {(filters.tags?.length || 0) > 0 && (
                                    <span className="ml-1 text-xs">({filters.tags?.length})</span>
                                )}
                            </Button>
                        </Popover>
                        <div className="flex items-center gap-2">
                            <Button
                                active={filters.shared}
                                type="secondary"
                                size="small"
                                onClick={() => setFilters({ shared: !filters.shared })}
                                icon={<IconShare />}
                            >
                                Shared
                            </Button>
                        </div>
                    </div>
                    {currentTab !== DashboardsTab.Yours && (
                        <div className="flex items-center gap-2">
                            <span>Created by:</span>
                            <MemberSelect
                                value={filters.createdBy === 'All users' ? null : filters.createdBy}
                                onChange={(user) => setFilters({ createdBy: user?.uuid || 'All users' })}
                            />
                        </div>
                    )}
                    {extraActions}
                </div>
            </div>
            <Table
                data-attr="dashboards-table"
                pagination={{ pageSize: 100 }}
                dataSource={dashboards as DashboardType[]}
                rowKey="id"
                rowClassName={(record) => (record._highlight ? 'highlighted' : null)}
                columns={columns}
                loading={dashboardsLoading}
                defaultSorting={tableSorting}
                onSort={tableSortingChanged}
                emptyState="No dashboards matching your filters!"
                nouns={['dashboard', 'dashboards']}
            />
        </>
    )
}
