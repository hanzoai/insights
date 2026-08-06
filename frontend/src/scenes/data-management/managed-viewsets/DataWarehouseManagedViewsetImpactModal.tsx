import { useActions, useValues } from 'kea'

import { Button, Input, Modal, Tag } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TeamMembershipLevel } from 'lib/constants'
import { Banner } from 'lib/elements/Banner'

import { DataWarehouseManagedViewsetSavedQuery } from '~/types'

import { disableDataWarehouseManagedViewsetModalLogic } from './disableDataWarehouseManagedViewsetModalLogic'

export interface ManagedViewsetImpactModalProps {
    type: string
    title: string
    action: () => Promise<boolean>
    confirmText: string
    views?: DataWarehouseManagedViewsetSavedQuery[]
    warningItems: string[]
    infoMessage: string | JSX.Element
    viewsActionText: string
    confirmButtonText: string
}

export function DataWarehouseManagedViewsetImpactModal({
    type,
    title,
    action,
    confirmText,
    views: propViews,
    warningItems,
    infoMessage,
    viewsActionText,
    confirmButtonText,
}: ManagedViewsetImpactModalProps): JSX.Element {
    const logic = disableDataWarehouseManagedViewsetModalLogic({ type })
    const { isOpen, confirmationInput, views: logicViews, viewsLoading, isDeleting } = useValues(logic)
    const { closeModal, setIsDeleting, setConfirmationInput } = useActions(logic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const isConfirmationValid = confirmationInput === confirmText
    const views = propViews !== undefined ? propViews : logicViews

    const onConfirm = async (): Promise<void> => {
        setIsDeleting(true)
        if (await action()) {
            closeModal()
        }

        setIsDeleting(false)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeModal}
            title={title}
            footer={
                <>
                    <Button
                        type="secondary"
                        onClick={closeModal}
                        disabledReason={isDeleting ? 'Deleting...' : restrictedReason}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        status="danger"
                        loading={isDeleting}
                        disabledReason={
                            !isConfirmationValid ? 'Please type the correct confirmation text' : restrictedReason
                        }
                        onClick={onConfirm}
                    >
                        {confirmButtonText}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <Banner type="warning">
                    <strong>This action will:</strong>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        {warningItems.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </Banner>

                <Banner type="info">{infoMessage}</Banner>

                <div>
                    <p className="font-semibold mb-2">
                        The following {views.length} view{views.length !== 1 ? 's' : ''} {viewsActionText}:
                    </p>
                    <div className="flex flex-wrap gap-2 max-w-2xl">
                        {viewsLoading ? (
                            <div className="text-muted">Loading views...</div>
                        ) : views.length > 0 ? (
                            views.map((view) => (
                                <Tag key={view.id} type="default">
                                    {view.name}
                                </Tag>
                            ))
                        ) : (
                            <p className="text-muted">No existing views found.</p>
                        )}
                    </div>
                </div>

                <div>
                    <p className="font-semibold mb-2">
                        To confirm, type <code className="px-1 py-0.5 bg-bg-light rounded">{confirmText}</code> below:
                    </p>
                    <Input
                        value={confirmationInput}
                        onChange={setConfirmationInput}
                        placeholder={`Type "${confirmText}" to confirm`}
                        disabledReason={isDeleting ? 'Deleting...' : restrictedReason}
                        autoFocus
                    />
                </div>
            </div>
        </Modal>
    )
}
