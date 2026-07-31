import { ReactNode, useState } from 'react'

import { Button, Input, Modal } from '@hanzo/elements'

export interface ImpersonationReasonModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => void | Promise<void>
    title: string
    description?: string
    confirmText?: string
    loading?: boolean
    children?: ReactNode
}

export function ImpersonationReasonModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    loading = false,
    children,
}: ImpersonationReasonModalProps): JSX.Element {
    const [reason, setReason] = useState('')

    const handleConfirm = (): void => {
        onConfirm(reason)
    }

    const handleClose = (): void => {
        setReason('')
        onClose()
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={title}
            footer={
                <>
                    <Button type="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleConfirm}
                        loading={loading}
                        disabledReason={!loading && !reason.trim() ? 'Please provide a reason' : undefined}
                    >
                        {confirmText}
                    </Button>
                </>
            }
            width={500}
        >
            <div className="space-y-2">
                {description && <p className="text-sm text-secondary">{description}</p>}
                <div>
                    <label className="block mb-1 font-semibold">Reason</label>
                    <Input
                        value={reason}
                        onChange={setReason}
                        placeholder="e.g., Customer support request #12345"
                        autoFocus
                    />
                </div>
                {children}
            </div>
        </Modal>
    )
}
