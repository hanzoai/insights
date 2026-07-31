import { useActions, useValues } from 'kea'
import { useEffect, useState } from 'react'

import { Button, Input, Modal } from '@hanzo/elements'

import { passkeySettingsLogic } from './passkeySettingsLogic'

export function PasskeyModals(): JSX.Element {
    const { deleteModalId, renameModal } = useValues(passkeySettingsLogic)
    const { closeDeleteModal, deletePasskey, closeRenameModal, renamePasskey } = useActions(passkeySettingsLogic)

    const [renameLabel, setRenameLabel] = useState('')

    useEffect(() => {
        if (renameModal) {
            setRenameLabel(renameModal.currentLabel)
        }
    }, [renameModal])

    const handleRename = (): void => {
        if (renameModal && renameLabel.trim()) {
            renamePasskey(renameModal.id, renameLabel.trim())
        }
    }

    return (
        <>
            <Modal
                isOpen={deleteModalId !== null}
                onClose={closeDeleteModal}
                title="Delete passkey?"
                footer={
                    <>
                        <Button type="secondary" onClick={closeDeleteModal}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            status="danger"
                            onClick={() => deleteModalId && deletePasskey(deleteModalId)}
                        >
                            Delete
                        </Button>
                    </>
                }
            >
                <p>Are you sure you want to delete this passkey? You won't be able to use it to sign in anymore.</p>
            </Modal>

            <Modal
                isOpen={renameModal !== null}
                onClose={closeRenameModal}
                title="Rename passkey"
                footer={
                    <>
                        <Button type="secondary" onClick={closeRenameModal}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleRename}
                            disabledReason={!renameLabel.trim() ? 'Name is required' : undefined}
                        >
                            Save
                        </Button>
                    </>
                }
            >
                <Input
                    value={renameLabel}
                    onChange={setRenameLabel}
                    placeholder="Passkey name"
                    autoFocus
                    onPressEnter={handleRename}
                    maxLength={200}
                />
            </Modal>
        </>
    )
}
