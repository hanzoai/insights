import { useActions, useValues } from 'kea'

import { IconChevronLeft, IconChevronRight, IconExternal, IconPlus, IconRefresh } from '@hanzo/icons'
import { Button, Input, Modal, Table, TableColumns } from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'
import { More } from 'lib/elements/Button/More'

import { DataTable } from '~/queries/nodes/DataTable/DataTable'
import { ActorsQuery, DataTableNode, NodeKind } from '~/queries/schema/schema-general'

import type { MessageCategory } from './optOutCategoriesLogic'
import { optOutListLogic } from './optOutListLogic'
import type { OptOutEntry } from './types'

export function OptOutList({ category }: { category?: MessageCategory }): JSX.Element {
    const logic = optOutListLogic({ category })
    const {
        setSelectedIdentifier,
        openPreferencesPage,
        loadNextPage,
        loadPreviousPage,
        loadOptOutPersons,
        setShowAddOptOutModal,
        setNewOptOutIdentifier,
        addOptOut,
    } = useActions(logic)
    const {
        selectedIdentifier,
        optOutPersons,
        optOutPersonsLoading,
        preferencesUrlLoading,
        currentPage,
        showAddOptOutModal,
        addOptOutLoading,
        newOptOutIdentifier,
    } = useValues(logic)

    const handleShowPersons = (identifier: string): void => {
        setSelectedIdentifier(identifier)
    }

    const handleCloseModal = (): void => {
        setSelectedIdentifier(null)
    }

    // Create ActorsQuery for the selected identifier
    const actorsQuery: DataTableNode | null = selectedIdentifier
        ? {
              kind: NodeKind.DataTableNode,
              source: {
                  kind: NodeKind.ActorsQuery,
                  select: ['person_display_name -- Person', 'id', 'created_at'],
                  search: selectedIdentifier,
                  orderBy: ['created_at'],
              } as ActorsQuery,
          }
        : null

    const columns: TableColumns<OptOutEntry> = [
        {
            title: 'Recipient',
            dataIndex: 'identifier',
            key: 'recipient',
        },
        {
            title: 'Opt-out date',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (updated_at) => <TZLabel time={updated_at as string} />,
        },
        {
            width: 0,
            render: function Render(_, optOutEntry: OptOutEntry): JSX.Element {
                return (
                    <More
                        overlay={
                            <>
                                <Button onClick={() => handleShowPersons(optOutEntry.identifier)} fullWidth>
                                    Show person(s)
                                </Button>
                                <Button
                                    onClick={() => openPreferencesPage(optOutEntry.identifier)}
                                    loading={preferencesUrlLoading}
                                    fullWidth
                                    icon={<IconExternal />}
                                >
                                    Manage
                                </Button>
                            </>
                        }
                    />
                )
            },
        },
    ]

    const totalPages = optOutPersons.count ? Math.ceil(optOutPersons.count / 20) : 0
    const showingStart = (currentPage - 1) * 20 + 1
    const showingEnd = Math.min(currentPage * 20, optOutPersons.count)

    return (
        <>
            <div className="flex justify-end gap-2 mb-2 mt-[-3rem]">
                <Button
                    icon={<IconPlus />}
                    size="small"
                    type="secondary"
                    onClick={() => setShowAddOptOutModal(true)}
                >
                    Add opt-out
                </Button>
                <Button
                    icon={<IconRefresh />}
                    size="small"
                    type="secondary"
                    onClick={loadOptOutPersons}
                    loading={optOutPersonsLoading}
                >
                    Reload
                </Button>
            </div>
            <div className="max-h-64 overflow-y-auto">
                <Table
                    columns={columns}
                    dataSource={optOutPersons.results || []}
                    loading={optOutPersonsLoading}
                    loadingSkeletonRows={3}
                    rowKey="identifier"
                    emptyState={`No opt-outs found${category?.name ? ` for ${category.name}` : ''}`}
                    size="small"
                />
            </div>
            {optOutPersons.count > 20 && (
                <div className="flex items-center justify-between mt-4 px-2">
                    <div className="text-sm text-muted">
                        {optOutPersons.count > 0 && (
                            <span>
                                Showing {showingStart} - {showingEnd} of {optOutPersons.count.toLocaleString()} opt-outs
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            icon={<IconChevronLeft />}
                            size="small"
                            disabled={currentPage === 1 || optOutPersonsLoading}
                            onClick={loadPreviousPage}
                        />
                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            icon={<IconChevronRight />}
                            size="small"
                            disabled={!optOutPersons.next || optOutPersonsLoading}
                            onClick={loadNextPage}
                        />
                    </div>
                </div>
            )}

            <Modal
                isOpen={Boolean(selectedIdentifier)}
                onClose={handleCloseModal}
                title={`Persons for ${selectedIdentifier}`}
                width="50rem"
                footer={null}
            >
                {actorsQuery && (
                    <div className="h-96">
                        <DataTable
                            query={actorsQuery}
                            setQuery={() => {}} // Read-only
                            uniqueKey={`opt-out-persons-${selectedIdentifier}`}
                            readOnly
                        />
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={showAddOptOutModal}
                onClose={() => setShowAddOptOutModal(false)}
                title={`Add opt-out${category?.name ? ` for ${category.name}` : ''}`}
                footer={
                    <>
                        <Button type="secondary" onClick={() => setShowAddOptOutModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            loading={addOptOutLoading}
                            disabled={!newOptOutIdentifier.trim()}
                            onClick={() => {
                                addOptOut(newOptOutIdentifier.trim())
                            }}
                        >
                            Add opt-out
                        </Button>
                    </>
                }
            >
                <div className="space-y-2">
                    <label htmlFor="opt-out-identifier" className="text-sm font-medium">
                        Recipient identifier (e.g. email address)
                    </label>
                    <Input
                        id="opt-out-identifier"
                        placeholder="email@example.com"
                        value={newOptOutIdentifier}
                        onChange={setNewOptOutIdentifier}
                        autoFocus
                        onPressEnter={() => {
                            if (newOptOutIdentifier.trim()) {
                                addOptOut(newOptOutIdentifier.trim())
                            }
                        }}
                    />
                </div>
            </Modal>
        </>
    )
}
