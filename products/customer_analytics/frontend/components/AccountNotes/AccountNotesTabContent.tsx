import { useActions, useValues } from 'kea'
import insights from 'insights-js'
import { useState } from 'react'

import { IconChevronDown, IconX } from '@hanzo/icons'
import { Button, Checkbox, Dropdown, Input, Skeleton, ProfilePicture } from '@hanzo/elements'

import { MemberSelectMultiple } from 'lib/components/MemberSelectMultiple'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { atColumn } from 'lib/elements/Table/columnUtils'
import { Link } from 'lib/elements/Link'
import { fullName } from 'lib/utils/strings'
import { notebookPanelLogic } from 'scenes/notebooks/NotebookPanel/notebookPanelLogic'
import { urls } from 'scenes/urls'

import type { AccountNoteApi } from 'products/customer_analytics/frontend/generated/api.schemas'

import { AccountsEvents } from '../Accounts/constants'
import { accountNotesLogic } from './accountNotesLogic'

export function AccountNotesTabContent(): JSX.Element {
    const {
        accountNotes,
        accountNotesResponse,
        accountNotesResponseLoading,
        search,
        createdByFilter,
        createdByCurrentUser,
        assignedToCurrentUser,
        accountFilter,
        pagination,
    } = useValues(accountNotesLogic)
    const { setSearch, setCreatedByFilter, setCreatedByCurrentUser, setAssignedToCurrentUser, reportFilterChange } =
        useActions(accountNotesLogic)
    const { selectNotebook } = useActions(notebookPanelLogic)

    const hasFilters = !!search || createdByFilter.length > 0 || assignedToCurrentUser || accountFilter !== null

    const columns: TableColumns<AccountNoteApi> = [
        {
            title: 'Title',
            dataIndex: 'title',
            width: '100%',
            render: function Render(_, note) {
                // Plain click opens the note in the side panel (keeping the list mounted);
                // the href stays so cmd/ctrl-click opens the full notebook page in a new tab.
                return (
                    <Link
                        data-attr="account-note-title"
                        to={urls.notebook(note.short_id)}
                        className="font-semibold"
                        onClick={(event) => {
                            insights.capture(AccountsEvents.NotesTabNoteClicked, {
                                notebook_short_id: note.short_id,
                            })
                            event.preventDefault()
                            selectNotebook(note.short_id)
                        }}
                    >
                        {note.title || 'Untitled'}
                    </Link>
                )
            },
        },
        {
            title: 'Account',
            dataIndex: 'account_name',
            render: function Render(_, note) {
                return (
                    <Link
                        data-attr="account-note-account"
                        to={urls.customerAnalyticsAccount(note.account_id)}
                        className="whitespace-nowrap"
                        onClick={() => {
                            insights.capture(AccountsEvents.NotesTabAccountClicked, { account_id: note.account_id })
                        }}
                    >
                        {note.account_name}
                    </Link>
                )
            },
        },
        {
            title: 'Created by',
            key: 'created_by',
            render: function Render(_, note) {
                const user = note.created_by
                if (!user) {
                    return <span className="text-muted">—</span>
                }
                return (
                    <div className="flex items-center gap-2">
                        <ProfilePicture
                            user={{ email: user.email, first_name: user.first_name, last_name: user.last_name }}
                            size="sm"
                        />
                        <span className="whitespace-nowrap">{fullName(user) || user.email}</span>
                    </div>
                )
            },
        },
        atColumn<AccountNoteApi>('created_at', 'Created') as TableColumn<
            AccountNoteApi,
            keyof AccountNoteApi | undefined
        >,
        atColumn<AccountNoteApi>('last_modified_at', 'Last modified') as TableColumn<
            AccountNoteApi,
            keyof AccountNoteApi | undefined
        >,
    ]

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
                <Input
                    type="search"
                    placeholder="Search notes"
                    onChange={setSearch}
                    value={search}
                    size="small"
                    className="min-w-64"
                    data-attr="account-notes-search"
                />
                <AccountPicker />
                <CreatedByPicker
                    value={createdByFilter}
                    onChange={(userIds) => {
                        setCreatedByFilter(userIds)
                        reportFilterChange('created_by')
                    }}
                />
                <Checkbox
                    checked={createdByCurrentUser}
                    onChange={(value) => {
                        setCreatedByCurrentUser(value)
                        reportFilterChange('my_notes')
                    }}
                    label="My notes"
                    info="Shortcut for Created by: you — notes you created"
                    data-attr="account-notes-my-notes-filter"
                />
                <Checkbox
                    checked={assignedToCurrentUser}
                    onChange={(value) => {
                        setAssignedToCurrentUser(value)
                        reportFilterChange('my_accounts')
                    }}
                    label="My accounts"
                    info="Notes on accounts where you are the CSM or account executive"
                    data-attr="account-notes-my-accounts-filter"
                />
            </div>
            {accountNotesResponse === null ? (
                // Dedicated initial-load state (mirrors AccountOpportunitiesExpansion); the
                // table's own loading overlay covers subsequent search/pagination fetches.
                <Skeleton className="h-64 w-full" />
            ) : (
                <Table
                    data-attr="account-notes-table"
                    dataSource={accountNotes}
                    rowKey="short_id"
                    columns={columns}
                    loading={accountNotesResponseLoading}
                    pagination={pagination}
                    emptyState={
                        hasFilters
                            ? 'No notes matching your filters'
                            : "No account notes yet. Create notes from an account's Notes tab."
                    }
                    nouns={['note', 'notes']}
                />
            )}
        </div>
    )
}

function CreatedByPicker({ value, onChange }: { value: number[]; onChange: (userIds: number[]) => void }): JSX.Element {
    const buttonLabel =
        value.length === 0
            ? 'Created by anyone'
            : value.length === 1
              ? 'Created by 1 person'
              : `Created by ${value.length} people`
    return (
        <div className="flex gap-1 items-center" data-attr="account-notes-created-by-filter">
            <Dropdown
                closeOnClickInside={false}
                overlay={
                    <div className="p-2 min-w-64">
                        <MemberSelectMultiple
                            idKey="id"
                            value={value}
                            onChange={(users) => onChange(users.map((user) => user.id))}
                        />
                    </div>
                }
            >
                <Button type="secondary" size="small" sideIcon={<IconChevronDown />}>
                    {buttonLabel}
                </Button>
            </Dropdown>
            {value.length > 0 && (
                <Button
                    type="secondary"
                    size="small"
                    icon={<IconX />}
                    onClick={() => onChange([])}
                    tooltip="Clear created-by filter"
                />
            )}
        </div>
    )
}

function AccountPicker(): JSX.Element {
    const { accountFilter, accountSearch, accountOptions, accountOptionsResponseLoading } = useValues(accountNotesLogic)
    const { setAccountFilter, setAccountSearch, reportFilterChange } = useActions(accountNotesLogic)
    const [showPopover, setShowPopover] = useState(false)

    const selectAccount = (account: { id: string; name: string } | null): void => {
        setShowPopover(false)
        setAccountFilter(account)
        reportFilterChange('account')
    }

    return (
        <div className="flex gap-1 items-center" data-attr="account-notes-account-filter">
            <Dropdown
                closeOnClickInside={false}
                visible={showPopover}
                placement="bottom-start"
                actionable
                onVisibilityChange={(visible) => {
                    setShowPopover(visible)
                    if (!visible && accountSearch) {
                        setAccountSearch('')
                    }
                }}
                overlay={
                    <div className="max-w-100 space-y-2">
                        <Input
                            type="search"
                            placeholder="Search accounts"
                            autoFocus
                            value={accountSearch}
                            onChange={setAccountSearch}
                            fullWidth
                        />
                        <ul className="space-y-px max-h-80 overflow-y-auto">
                            <li>
                                <Button
                                    fullWidth
                                    role="menuitem"
                                    size="small"
                                    active={accountFilter === null}
                                    onClick={() => selectAccount(null)}
                                >
                                    All accounts
                                </Button>
                            </li>
                            {accountOptions.map((option) => (
                                <li key={option.key}>
                                    <Button
                                        fullWidth
                                        role="menuitem"
                                        size="small"
                                        active={accountFilter?.id === option.key}
                                        onClick={() => selectAccount({ id: option.key, name: option.label })}
                                    >
                                        {option.label}
                                    </Button>
                                </li>
                            ))}
                            {accountOptionsResponseLoading ? (
                                <div className="p-2 text-secondary italic truncate border-t">Loading...</div>
                            ) : accountOptions.length === 0 ? (
                                <div className="p-2 text-secondary italic truncate border-t">
                                    {accountSearch ? 'No matches' : 'No accounts'}
                                </div>
                            ) : null}
                        </ul>
                    </div>
                }
            >
                <Button type="secondary" size="small" sideIcon={<IconChevronDown />}>
                    {accountFilter ? accountFilter.name : 'All accounts'}
                </Button>
            </Dropdown>
            {accountFilter !== null && (
                <Button
                    type="secondary"
                    size="small"
                    icon={<IconX />}
                    onClick={() => selectAccount(null)}
                    tooltip="Clear account filter"
                />
            )}
        </div>
    )
}
