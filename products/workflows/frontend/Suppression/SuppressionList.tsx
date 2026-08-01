import { useActions, useValues } from 'kea'

import { IconChevronLeft, IconChevronRight, IconPlus, IconRefresh, IconTrash } from '@hanzo/icons'
import { Button, Input, Modal, Table, TableColumns, Tag } from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'
import { More } from 'lib/elements/Button/More'

import type { MessageSuppressionApi } from 'products/messaging/frontend/generated/api.schemas'

import { suppressionListLogic } from './suppressionListLogic'

const PAGE_SIZE = 20

export function SuppressionList(): JSX.Element {
    const {
        loadNextPage,
        loadPreviousPage,
        loadSuppressions,
        setShowAddModal,
        setNewIdentifier,
        addSuppression,
        removeSuppression,
    } = useActions(suppressionListLogic)
    const {
        suppressions,
        suppressionsLoading,
        currentPage,
        showAddModal,
        addSuppressionLoading,
        removeSuppressionLoading,
        newIdentifier,
    } = useValues(suppressionListLogic)

    const columns: TableColumns<MessageSuppressionApi> = [
        {
            title: 'Recipient',
            dataIndex: 'identifier',
            key: 'identifier',
        },
        {
            title: 'Added by',
            dataIndex: 'source',
            key: 'source',
            render: (source) => (
                <Tag type={source === 'MANUAL' ? 'completion' : 'warning'}>
                    {source === 'MANUAL' ? 'Manual' : 'Bounces'}
                </Tag>
            ),
        },
        {
            title: 'Reason',
            key: 'reason',
            render: function Render(_, entry: MessageSuppressionApi): JSX.Element {
                return (
                    <span className="text-muted text-xs">{entry.reason || (entry.last_bounce_diagnostic ?? '—')}</span>
                )
            },
        },
        {
            title: 'Suppressed',
            dataIndex: 'suppressed_at',
            key: 'suppressed_at',
            render: (suppressed_at) => (suppressed_at ? <TZLabel time={suppressed_at as string} /> : <span>—</span>),
        },
        {
            width: 0,
            render: function Render(_, entry: MessageSuppressionApi): JSX.Element {
                return (
                    <More
                        overlay={
                            <Button
                                status="danger"
                                icon={<IconTrash />}
                                onClick={() => removeSuppression(entry.identifier)}
                                loading={removeSuppressionLoading}
                                disabledReason={removeSuppressionLoading ? 'Removing…' : undefined}
                                fullWidth
                            >
                                Remove
                            </Button>
                        }
                    />
                )
            },
        },
    ]

    const totalPages = suppressions.count ? Math.ceil(suppressions.count / PAGE_SIZE) : 0
    const showingStart = (currentPage - 1) * PAGE_SIZE + 1
    const showingEnd = Math.min(currentPage * PAGE_SIZE, suppressions.count)

    return (
        <>
            <div className="flex justify-end gap-2 mb-2">
                <Button icon={<IconPlus />} size="small" type="secondary" onClick={() => setShowAddModal(true)}>
                    Add address
                </Button>
                <Button
                    icon={<IconRefresh />}
                    size="small"
                    type="secondary"
                    onClick={loadSuppressions}
                    loading={suppressionsLoading}
                >
                    Reload
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={suppressions.results || []}
                loading={suppressionsLoading}
                loadingSkeletonRows={3}
                rowKey="identifier"
                emptyState="No suppressed addresses. Addresses land here automatically after repeated soft bounces, or when you add them manually."
                size="small"
            />
            {suppressions.count > PAGE_SIZE && (
                <div className="flex items-center justify-between mt-4 px-2">
                    <div className="text-sm text-muted">
                        <span>
                            Showing {showingStart} - {showingEnd} of {suppressions.count.toLocaleString()} addresses
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            icon={<IconChevronLeft />}
                            size="small"
                            disabled={currentPage === 1 || suppressionsLoading}
                            onClick={loadPreviousPage}
                        />
                        <span className="text-sm">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            icon={<IconChevronRight />}
                            size="small"
                            disabled={!suppressions.next || suppressionsLoading}
                            onClick={loadNextPage}
                        />
                    </div>
                </div>
            )}

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add address to suppression list"
                footer={
                    <>
                        <Button type="secondary" onClick={() => setShowAddModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            loading={addSuppressionLoading}
                            disabledReason={
                                addSuppressionLoading
                                    ? 'Adding…'
                                    : !newIdentifier.trim()
                                      ? 'Enter an email address'
                                      : undefined
                            }
                            onClick={() => addSuppression(newIdentifier.trim())}
                        >
                            Add address
                        </Button>
                    </>
                }
            >
                <div className="space-y-2">
                    <label htmlFor="suppression-identifier" className="text-sm font-medium">
                        Email address
                    </label>
                    <Input
                        id="suppression-identifier"
                        placeholder="email@example.com"
                        value={newIdentifier}
                        onChange={setNewIdentifier}
                        autoFocus
                        onPressEnter={() => {
                            // Guard against a second Enter mid-flight firing a duplicate POST — the
                            // footer button already disables while loading; mirror that here.
                            if (newIdentifier.trim() && !addSuppressionLoading) {
                                addSuppression(newIdentifier.trim())
                            }
                        }}
                    />
                </div>
            </Modal>
        </>
    )
}
