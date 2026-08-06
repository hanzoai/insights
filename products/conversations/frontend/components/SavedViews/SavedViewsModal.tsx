import { useActions, useValues } from 'kea'
import type { ReactNode } from 'react'

import { IconHeart, IconHeartFilled } from '@hanzo/icons'
import { Button, Dialog, Input, Modal, Table, TableColumns } from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'
import { More } from 'lib/elements/Button/More'
import { Field } from 'lib/elements/Field'
import { MenuOverlay } from 'lib/elements/Menu/Menu'
import { getAccessControlDisabledReason } from 'lib/utils/accessControlUtils'

import { AccessControlLevel, AccessControlResourceType } from '~/types'

import { type SavedTicketView, type TicketViewFilters, normalizeAssigneeFilter } from '../../types'
import { AssigneeLabelDisplay, AssigneeResolver } from '../Assignee'
import { type TicketViewsLogicProps, ticketViewsLogic } from './ticketViewsLogic'

function FiltersSummary({ filters }: { filters: TicketViewFilters }): JSX.Element {
    const lines: { label: string; value: ReactNode }[] = []

    if (filters.status?.length) {
        lines.push({ label: 'Status', value: filters.status.join(', ') })
    }
    if (filters.priority?.length) {
        lines.push({ label: 'Priority', value: filters.priority.join(', ') })
    }
    if (filters.channel && filters.channel !== 'all') {
        lines.push({ label: 'Channel', value: filters.channel })
    }
    if (filters.sla && filters.sla !== 'all') {
        lines.push({ label: 'SLA', value: filters.sla })
    }
    if (filters.tags?.length) {
        lines.push({
            label: filters.tagsMatch === 'all' ? 'Tags (all)' : 'Tags (any)',
            value: filters.tags.join(', '),
        })
    }
    if (filters.tagsExclude?.length) {
        lines.push({ label: 'Exclude tags', value: filters.tagsExclude.join(', ') })
    }
    const assigneeEntries = normalizeAssigneeFilter(filters.assignee)
    if (assigneeEntries.length) {
        lines.push({
            label: 'Assignee',
            value: assigneeEntries.map((entry, index) => (
                <span key={typeof entry === 'string' ? entry : `${entry.type}:${entry.id}`}>
                    {index > 0 ? ', ' : ''}
                    {entry === 'unassigned' ? (
                        'Unassigned'
                    ) : entry === 'me' ? (
                        'Me (current user)'
                    ) : (
                        <AssigneeResolver assignee={entry}>
                            {({ assignee }) => (
                                <AssigneeLabelDisplay assignee={assignee} placeholder={`${entry.type}:${entry.id}`} />
                            )}
                        </AssigneeResolver>
                    )}
                </span>
            )),
        })
    }
    if (filters.dateFrom) {
        lines.push({ label: 'Date from', value: filters.dateFrom })
    }

    if (lines.length === 0) {
        return <span className="text-muted text-xs">No filters</span>
    }
    return (
        <div className="text-xs text-muted space-y-0.5">
            {lines.map((line) => (
                <div key={line.label}>
                    <span className="font-medium">{line.label}:</span> {line.value}
                </div>
            ))}
        </div>
    )
}

function SaveViewModal({ id }: TicketViewsLogicProps): JSX.Element {
    const { isSaveModalOpen, viewName, currentFilters } = useValues(ticketViewsLogic({ id }))
    const { closeSaveModal, setViewName, saveView } = useActions(ticketViewsLogic({ id }))
    const editDisabledReason =
        getAccessControlDisabledReason(AccessControlResourceType.Ticket, AccessControlLevel.Editor) ?? undefined

    return (
        <Modal
            isOpen={isSaveModalOpen}
            onClose={closeSaveModal}
            title="Save current view"
            footer={
                <>
                    <Button type="secondary" onClick={closeSaveModal}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={saveView}
                        disabledReason={editDisabledReason ?? (!viewName.trim() ? 'Enter a name' : undefined)}
                    >
                        Save view
                    </Button>
                </>
            }
        >
            <div className="space-y-2">
                <Input
                    placeholder="View name"
                    value={viewName}
                    onChange={setViewName}
                    autoFocus
                    disabledReason={editDisabledReason}
                    onPressEnter={editDisabledReason ? undefined : saveView}
                />
                <FiltersSummary filters={currentFilters} />
            </div>
        </Modal>
    )
}

export function SavedViewsModal({ id }: TicketViewsLogicProps): JSX.Element {
    const { isModalOpen, filteredViews, viewsLoading, currentFilters, favoritingShortIds, searchTerm } = useValues(
        ticketViewsLogic({ id })
    )
    const { closeModal, openSaveModal, deleteView, loadView, updateView, toggleFavorite, setSearchTerm } = useActions(
        ticketViewsLogic({ id })
    )
    const editDisabledReason =
        getAccessControlDisabledReason(AccessControlResourceType.Ticket, AccessControlLevel.Editor) ?? undefined

    const columns: TableColumns<SavedTicketView> = [
        {
            title: '',
            key: 'favorite',
            width: 0,
            render: (_, view) => (
                <Button
                    size="xsmall"
                    loading={favoritingShortIds.includes(view.short_id)}
                    onClick={() => toggleFavorite(view)}
                    disabledReason={editDisabledReason}
                    icon={
                        view.is_favorited ? (
                            <IconHeartFilled className="text-danger" />
                        ) : (
                            <IconHeart className="text-secondary" />
                        )
                    }
                    tooltip={
                        view.is_favorited
                            ? 'Remove from your favorites (only visible to you)'
                            : 'Add to your favorites (only visible to you)'
                    }
                />
            ),
        },
        {
            title: 'Name',
            dataIndex: 'name',
            render: (_, view) => <span className="font-medium">{view.name}</span>,
        },
        {
            title: 'Filters',
            render: (_, view) => <FiltersSummary filters={view.filters ?? {}} />,
        },
        {
            title: 'Created by',
            dataIndex: 'created_by',
            render: (_, view) => (
                <span className="text-muted text-xs">
                    {view.created_by?.first_name || view.created_by?.email || '\u2014'}
                </span>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'created_at',
            render: (_, view) => <TZLabel time={view.created_at} />,
        },
        {
            title: '',
            render: (_, view) => (
                <div className="flex items-center gap-1">
                    <Button type="secondary" size="xsmall" onClick={() => loadView(view)}>
                        Load
                    </Button>
                    <More
                        disabledReason={editDisabledReason}
                        overlay={
                            <MenuOverlay
                                items={[
                                    {
                                        label: 'Rename',
                                        onClick: () => {
                                            Dialog.openForm({
                                                title: 'Rename view',
                                                initialValues: { name: view.name },
                                                content: (
                                                    <Field name="name">
                                                        <Input autoFocus placeholder="View name" />
                                                    </Field>
                                                ),
                                                errors: {
                                                    name: (name) => (!name?.trim() ? 'Enter a name' : undefined),
                                                },
                                                onSubmit: ({ name }) =>
                                                    updateView(view.short_id, { name: name.trim() }),
                                            })
                                        },
                                    },
                                    {
                                        label: 'Update with current filters',
                                        onClick: () => {
                                            Dialog.open({
                                                title: `Update "${view.name}"?`,
                                                description: (
                                                    <div className="space-y-2">
                                                        <div>
                                                            Replace the saved filters on this view with the filters
                                                            currently applied to the ticket list. The view keeps its
                                                            name and link.
                                                        </div>
                                                        <FiltersSummary filters={currentFilters} />
                                                    </div>
                                                ),
                                                primaryButton: {
                                                    children: 'Update view',
                                                    type: 'primary',
                                                    onClick: () =>
                                                        updateView(view.short_id, {
                                                            filters: { ...currentFilters },
                                                        }),
                                                },
                                                secondaryButton: {
                                                    children: 'Cancel',
                                                },
                                            })
                                        },
                                    },
                                    {
                                        label: 'Delete',
                                        status: 'danger',
                                        onClick: () => {
                                            Dialog.open({
                                                title: `Delete "${view.name}"?`,
                                                description:
                                                    'This view will be permanently deleted. This action cannot be undone.',
                                                primaryButton: {
                                                    children: 'Delete',
                                                    type: 'primary',
                                                    status: 'danger',
                                                    onClick: () => deleteView(view.short_id),
                                                },
                                                secondaryButton: {
                                                    children: 'Cancel',
                                                },
                                            })
                                        },
                                    },
                                ]}
                            />
                        }
                    />
                </div>
            ),
        },
    ]

    return (
        <>
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="Saved views"
                width={720}
                footer={
                    <div className="flex justify-between w-full">
                        <Button type="primary" onClick={openSaveModal} disabledReason={editDisabledReason}>
                            Save current view
                        </Button>
                        <Button type="secondary" onClick={closeModal}>
                            Close
                        </Button>
                    </div>
                }
            >
                <div className="space-y-2">
                    <Input
                        type="search"
                        placeholder="Search views"
                        value={searchTerm}
                        onChange={setSearchTerm}
                        autoFocus
                    />
                    <Table
                        columns={columns}
                        dataSource={filteredViews}
                        rowKey="id"
                        loading={viewsLoading}
                        emptyState={searchTerm ? 'No matching views.' : 'No saved views yet.'}
                        size="small"
                    />
                </div>
            </Modal>
            <SaveViewModal id={id} />
        </>
    )
}
