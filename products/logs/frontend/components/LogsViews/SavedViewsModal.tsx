import { useActions, useValues } from 'kea'

import { Button, Dialog, Input, Modal, Table, TableColumns } from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'
import { useKeepMountedWhileOpen } from 'lib/hooks/useKeepMountedWhileOpen'
import { More } from 'lib/elements/Button/More'
import { MenuOverlay } from 'lib/elements/Menu/Menu'

import { getFiltersSummaryLines } from 'products/logs/frontend/utils'

import { logsViewsListLogic } from './logsViewsListLogic'
import { LogsView, LogsViewsLogicProps, logsViewsLogic } from './logsViewsLogic'

function FiltersSummaryDisplay({ filters }: { filters: Record<string, any> }): JSX.Element {
    const lines = getFiltersSummaryLines(filters)
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

function SaveViewModal({ id }: LogsViewsLogicProps): JSX.Element | null {
    const { isSaveModalOpen, viewName, filters } = useValues(logsViewsListLogic({ id }))
    const { closeSaveModal, setViewName, saveView } = useActions(logsViewsListLogic({ id }))
    const shouldRender = useKeepMountedWhileOpen(isSaveModalOpen)

    if (!shouldRender) {
        return null
    }

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
                        disabledReason={!viewName.trim() ? 'Enter a name' : undefined}
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
                    onPressEnter={saveView}
                />
                <FiltersSummaryDisplay filters={filters} />
            </div>
        </Modal>
    )
}

export function SavedViewsModal({ id }: LogsViewsLogicProps): JSX.Element {
    const { isModalOpen } = useValues(logsViewsListLogic({ id }))
    const { closeModal, openSaveModal } = useActions(logsViewsListLogic({ id }))
    const { views, viewsLoading } = useValues(logsViewsLogic({ id }))
    const { deleteView, loadView } = useActions(logsViewsLogic({ id }))
    const shouldRenderList = useKeepMountedWhileOpen(isModalOpen)

    const columns: TableColumns<LogsView> = [
        {
            title: 'Name',
            dataIndex: 'name',
            render: (_, view) => <span className="font-medium">{view.name}</span>,
        },
        {
            title: 'Filters',
            render: (_, view) => <FiltersSummaryDisplay filters={view.filters ?? {}} />,
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
                        overlay={
                            <MenuOverlay
                                items={[
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
            {shouldRenderList && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title="Saved views"
                    width={720}
                    footer={
                        <div className="flex justify-between w-full">
                            <Button type="primary" onClick={openSaveModal}>
                                Save current view
                            </Button>
                            <Button type="secondary" onClick={closeModal}>
                                Close
                            </Button>
                        </div>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={views}
                        rowKey="id"
                        loading={viewsLoading}
                        emptyState="No saved views yet."
                        size="small"
                    />
                </Modal>
            )}
            <SaveViewModal id={id} />
        </>
    )
}
