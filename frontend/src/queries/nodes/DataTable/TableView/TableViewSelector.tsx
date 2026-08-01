import { BindLogic, useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconChevronDown, IconDownload, IconGear, IconUser, IconGlobe, IconPlus } from '@hanzo/icons'
import {
    Button,
    Input,
    Menu,
    MenuItem,
    MenuItems,
    Modal,
    SegmentedButton,
    Tooltip,
} from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { ColumnConfigurationApi } from 'products/product_analytics/frontend/generated/api.schemas'

import { TableViewSupportedQueryType, tableViewLogic } from './tableViewLogic'

export interface TableViewSelectorProps {
    contextKey: string
    query: TableViewSupportedQueryType
    setQuery: (query: TableViewSupportedQueryType) => void
}

export function TableViewSelector({ contextKey, query, setQuery }: TableViewSelectorProps): JSX.Element {
    const tableViewLogicProps = { contextKey, query, setQuery }
    const logic = tableViewLogic(tableViewLogicProps)
    const { views, currentView, hasUnsavedChanges, viewsLoading, canEditCurrentView, user } = useValues(logic)
    const { applyView, updateView, setShowDeleteConfirm, setIsCreating } = useActions(logic)

    const menuItems: MenuItems = [
        {
            items: views.map((view) => {
                const canEditView = view.created_by === user?.id
                return {
                    label: view.name,
                    icon: <ViewVisibilityIcon view={view} />,
                    active: currentView?.id === view.id,
                    onClick: () => applyView(view),
                    ...(canEditView && {
                        sideAction: {
                            icon: <IconGear />,
                            tooltip: 'Manage view',
                            dropdown: {
                                overlay: (
                                    <>
                                        <Button
                                            size="small"
                                            fullWidth
                                            onClick={() => {
                                                const newName = prompt('Rename view', view.name)
                                                if (newName && newName !== view.name) {
                                                    updateView(view.id, { name: newName })
                                                }
                                            }}
                                        >
                                            Rename
                                        </Button>
                                        <Button
                                            size="small"
                                            fullWidth
                                            status="danger"
                                            onClick={() => {
                                                setShowDeleteConfirm(view.id)
                                            }}
                                        >
                                            Delete
                                        </Button>
                                    </>
                                ),
                            },
                        },
                    }),
                } as MenuItem
            }),
        },
        {
            items: [
                {
                    label: 'Create new view...',
                    icon: <IconPlus />,
                    onClick: () => setIsCreating(true),
                },
            ],
        },
    ]

    return (
        <BindLogic logic={tableViewLogic} props={tableViewLogicProps}>
            <div className="flex items-center gap-2">
                {currentView ? (
                    <Menu items={menuItems} closeOnClickInside={true}>
                        <Button type="secondary" size="small" sideIcon={<IconChevronDown />}>
                            {currentView.name ? (
                                <>
                                    <ViewVisibilityIcon view={currentView} />{' '}
                                    <span className="ml-2">{currentView.name}</span>
                                </>
                            ) : (
                                'Select view'
                            )}
                        </Button>
                    </Menu>
                ) : (
                    <Button
                        icon={<IconDownload />}
                        size="small"
                        type="secondary"
                        onClick={() => setIsCreating(true)}
                    >
                        Save current view
                    </Button>
                )}

                {currentView && hasUnsavedChanges && (
                    <Button
                        icon={<IconDownload />}
                        size="small"
                        type="secondary"
                        tooltip="Update current view with changes"
                        disabledReason={!canEditCurrentView ? 'You can only edit views you created' : undefined}
                        loading={viewsLoading}
                        onClick={() => {
                            // Empty object triggers update with current state
                            updateView(currentView.id, {})
                        }}
                    >
                        Update "{currentView.name}"
                    </Button>
                )}
            </div>

            <CreateViewModal />
            <DeleteConfirmationModal />
        </BindLogic>
    )
}

function CreateViewModal(): JSX.Element {
    const { isCreating, isNewViewFormSubmitting } = useValues(tableViewLogic)
    const { submitNewViewForm, resetNewViewForm, setIsCreating } = useActions(tableViewLogic)

    return (
        <Modal
            isOpen={isCreating}
            onClose={() => {
                setIsCreating(false)
                resetNewViewForm()
            }}
            title="Create new view"
            description="Save the current table configuration as a reusable view"
            footer={
                <>
                    <Button
                        type="secondary"
                        onClick={() => {
                            setIsCreating(false)
                            resetNewViewForm()
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={submitNewViewForm}
                        loading={isNewViewFormSubmitting}
                        disabledReason={isNewViewFormSubmitting ? 'Creating view...' : undefined}
                    >
                        Create view
                    </Button>
                </>
            }
        >
            <Form logic={tableViewLogic} formKey="newViewForm">
                <div className="space-y-4">
                    <Field name="name" label="View name">
                        <Input placeholder="View name" autoFocus onPressEnter={submitNewViewForm} />
                    </Field>
                    <Field name="visibility" label="Visibility">
                        <SegmentedButton
                            options={[
                                {
                                    value: 'private',
                                    label: 'Private (only visible to me)',
                                    icon: <IconUser fontSize="20" />,
                                },
                                { value: 'shared', label: 'Shared with team', icon: <IconGlobe fontSize="20" /> },
                            ]}
                            fullWidth
                        />
                    </Field>
                </div>
            </Form>
        </Modal>
    )
}

function DeleteConfirmationModal(): JSX.Element {
    const { views, showDeleteConfirm } = useValues(tableViewLogic)
    const { deleteView, setShowDeleteConfirm } = useActions(tableViewLogic)

    return (
        <Modal
            isOpen={!!showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(null)}
            title="Delete view"
            description={`Are you sure you want to delete the view "${views.find((v) => v.id === showDeleteConfirm)?.name}"?`}
            footer={
                <>
                    <Button type="secondary" onClick={() => setShowDeleteConfirm(null)}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        status="danger"
                        onClick={() => {
                            if (showDeleteConfirm) {
                                deleteView(showDeleteConfirm)
                                setShowDeleteConfirm(null)
                            }
                        }}
                    >
                        Delete
                    </Button>
                </>
            }
        />
    )
}

export function ViewVisibilityIcon({ view }: { view: ColumnConfigurationApi }): JSX.Element {
    return view.visibility === 'private' ? (
        <Tooltip title="Only you can see this view.">
            <IconUser fontSize="20" />
        </Tooltip>
    ) : (
        <Tooltip title="Everyone on your team can see this view.">
            <IconGlobe fontSize="20" />
        </Tooltip>
    )
}
