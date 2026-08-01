import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconChevronDown, IconGlobe, IconPencil, IconPlus, IconUser } from '@hanzo/icons'
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

import { accountsViewsLogic } from './accountsViewsLogic'

export function AccountsViewSelector(): JSX.Element {
    const { views, currentView, isDirty, viewsLoading, canEditCurrentView, user } = useValues(accountsViewsLogic)
    const { selectView, updateView, setViewToDelete, setViewToRename, setIsCreating } = useActions(accountsViewsLogic)

    const menuItems: MenuItems = [
        {
            items: views.map((view) => {
                const canEdit = view.created_by === user?.id
                return {
                    label: view.name,
                    icon: <ViewVisibilityIcon view={view} />,
                    active: currentView?.id === view.id,
                    onClick: () => selectView(view.id),
                    ...(canEdit && {
                        sideAction: {
                            icon: <IconPencil />,
                            tooltip: 'Manage view',
                            dropdown: {
                                overlay: (
                                    <>
                                        <Button size="small" fullWidth onClick={() => setViewToRename(view.id)}>
                                            Rename
                                        </Button>
                                        <Button
                                            size="small"
                                            fullWidth
                                            status="danger"
                                            onClick={() => setViewToDelete(view.id)}
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
            items: [{ label: 'Save as new view...', icon: <IconPlus />, onClick: () => setIsCreating(true) }],
        },
    ]

    return (
        <div className="flex items-center gap-2">
            {currentView ? (
                <Menu items={menuItems} closeOnClickInside>
                    <Button type="secondary" size="small" sideIcon={<IconChevronDown />}>
                        <ViewVisibilityIcon view={currentView} />
                        <span className="ml-2">{currentView.name}</span>
                    </Button>
                </Menu>
            ) : (
                <Button
                    icon={<IconPlus />}
                    size="small"
                    type="secondary"
                    onClick={() => setIsCreating(true)}
                    data-attr="accounts-save-view"
                >
                    Save current view
                </Button>
            )}

            {currentView && isDirty && (
                <Button
                    size="small"
                    type="secondary"
                    tooltip="Update this view with the current configuration"
                    disabledReason={!canEditCurrentView ? 'You can only edit views you created' : undefined}
                    loading={viewsLoading}
                    onClick={() => updateView({ id: currentView.id, updates: {} })}
                    data-attr="accounts-update-view"
                >
                    Update "{currentView.name}"
                </Button>
            )}

            <CreateViewModal />
            <RenameViewModal />
            <DeleteViewModal />
        </div>
    )
}

function CreateViewModal(): JSX.Element {
    const { isCreating, isNewViewFormSubmitting } = useValues(accountsViewsLogic)
    const { submitNewViewForm, resetNewViewForm, setIsCreating } = useActions(accountsViewsLogic)

    const close = (): void => {
        setIsCreating(false)
        resetNewViewForm()
    }

    return (
        <Modal
            isOpen={isCreating}
            onClose={close}
            title="Save as new view"
            description="Save the current filters, columns, ordering, and overview tiles as a reusable view"
            footer={
                <>
                    <Button type="secondary" onClick={close}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={submitNewViewForm}
                        loading={isNewViewFormSubmitting}
                        disabledReason={isNewViewFormSubmitting ? 'Saving…' : undefined}
                    >
                        Save view
                    </Button>
                </>
            }
        >
            <Form logic={accountsViewsLogic} formKey="newViewForm">
                <div className="space-y-4">
                    <Field name="name" label="View name">
                        <Input placeholder="e.g. Enterprise accounts" autoFocus onPressEnter={submitNewViewForm} />
                    </Field>
                    <Field name="visibility" label="Visibility">
                        <SegmentedButton
                            options={[
                                { value: 'private', label: 'Private (only visible to me)', icon: <IconUser /> },
                                { value: 'shared', label: 'Shared with team', icon: <IconGlobe /> },
                            ]}
                            fullWidth
                        />
                    </Field>
                </div>
            </Form>
        </Modal>
    )
}

function RenameViewModal(): JSX.Element {
    const { views, viewToRename, viewsLoading } = useValues(accountsViewsLogic)
    const { setViewToRename, submitRenameViewForm, resetRenameViewForm } = useActions(accountsViewsLogic)
    const view = views.find((v) => v.id === viewToRename)

    const close = (): void => {
        setViewToRename(null)
        resetRenameViewForm()
    }

    return (
        <Modal
            isOpen={!!viewToRename}
            onClose={close}
            title="Rename view"
            footer={
                <>
                    <Button type="secondary" onClick={close}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={submitRenameViewForm}
                        loading={viewsLoading}
                        disabledReason={viewsLoading ? 'Saving…' : undefined}
                    >
                        Rename
                    </Button>
                </>
            }
        >
            <Form logic={accountsViewsLogic} formKey="renameViewForm">
                <Field name="name" label="View name">
                    <Input placeholder={view?.name} autoFocus onPressEnter={submitRenameViewForm} />
                </Field>
            </Form>
        </Modal>
    )
}

function DeleteViewModal(): JSX.Element {
    const { views, viewToDelete } = useValues(accountsViewsLogic)
    const { deleteView, setViewToDelete } = useActions(accountsViewsLogic)
    const view = views.find((v) => v.id === viewToDelete)

    return (
        <Modal
            isOpen={!!viewToDelete}
            onClose={() => setViewToDelete(null)}
            title="Delete view"
            description={`Are you sure you want to delete the view "${view?.name ?? ''}"?`}
            footer={
                <>
                    <Button type="secondary" onClick={() => setViewToDelete(null)}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        status="danger"
                        onClick={() => {
                            if (viewToDelete) {
                                deleteView({ id: viewToDelete })
                                setViewToDelete(null)
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

function ViewVisibilityIcon({ view }: { view: ColumnConfigurationApi }): JSX.Element {
    return view.visibility === 'private' ? (
        <Tooltip title="Only you can see this view.">
            <IconUser />
        </Tooltip>
    ) : (
        <Tooltip title="Everyone on your team can see this view.">
            <IconGlobe />
        </Tooltip>
    )
}
