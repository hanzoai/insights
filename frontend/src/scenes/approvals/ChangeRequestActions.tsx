import { IconEllipsis } from '@hanzo/icons'
import { Button, Dialog, Input, Menu, toast } from '@hanzo/elements'

import { getChangeRequestButtonVisibility } from 'scenes/approvals/changeRequestsLogic'
import { urls } from 'scenes/urls'

import { ChangeRequest } from '~/types'

export interface ChangeRequestActionsProps {
    changeRequest: ChangeRequest
    onApprove: (id: string) => void
    onReject: (id: string, reason?: string) => void
    onCancel: (id: string, reason?: string) => void
    showViewButton?: boolean
}

export function ChangeRequestActions({
    changeRequest,
    onApprove,
    onReject,
    onCancel,
    showViewButton = false,
}: ChangeRequestActionsProps): JSX.Element {
    const { showApproveButton, showRejectButton, showCancelButton } = getChangeRequestButtonVisibility(changeRequest)

    const handleApprove = (): void => {
        Dialog.open({
            title: 'Approve this change request?',
            content: (
                <div className="text-sm text-secondary">
                    This will add your approval to the change request and may automatically apply the change.
                </div>
            ),
            primaryButton: {
                children: 'Approve',
                type: 'primary',
                onClick: () => onApprove(changeRequest.id),
                size: 'small',
            },
            secondaryButton: {
                children: 'Cancel',
                type: 'tertiary',
                size: 'small',
            },
        })
    }

    const handleReject = (): void => {
        Dialog.open({
            title: 'Reject this change request?',
            content: (
                <div>
                    <div className="text-sm text-secondary mb-2">
                        This will reject the change request and prevent it from being applied.
                    </div>
                    <Input id="reject-reason" placeholder="Reason for rejection (required)" />
                </div>
            ),
            primaryButton: {
                children: 'Reject',
                type: 'primary',
                status: 'danger',
                onClick: () => {
                    const reason = (document.getElementById('reject-reason') as HTMLInputElement)?.value?.trim()
                    if (reason) {
                        onReject(changeRequest.id, reason)
                    } else {
                        toast.error('Please provide a reason for rejection')
                    }
                },
                size: 'small',
            },
            secondaryButton: {
                children: 'Cancel',
                type: 'tertiary',
                size: 'small',
            },
        })
    }

    const handleCancel = (): void => {
        Dialog.open({
            title: 'Cancel this change request?',
            content: (
                <div>
                    <div className="text-sm text-secondary mb-2">
                        This will cancel your change request and it will not be applied.
                    </div>
                    <Input id="cancel-reason" placeholder="Reason for canceling (optional)" />
                </div>
            ),
            primaryButton: {
                children: 'Cancel request',
                type: 'primary',
                status: 'danger',
                onClick: () => {
                    const reason = (document.getElementById('cancel-reason') as HTMLInputElement)?.value
                    onCancel(changeRequest.id, reason || undefined)
                },
                size: 'small',
            },
            secondaryButton: {
                children: 'Nevermind',
                type: 'tertiary',
                size: 'small',
            },
        })
    }

    const menuItems = []
    if (showViewButton) {
        menuItems.push({
            label: 'View details',
            to: urls.approval(changeRequest.id),
        })
    }

    return (
        <div className="flex items-center gap-2">
            {showApproveButton && (
                <Button type="primary" size="small" onClick={handleApprove}>
                    Approve
                </Button>
            )}
            {showRejectButton && (
                <Button type="secondary" size="small" onClick={handleReject}>
                    Reject
                </Button>
            )}
            {showCancelButton && (
                <Button type="secondary" size="small" onClick={handleCancel}>
                    Cancel
                </Button>
            )}
            {menuItems.length > 0 && (
                <Menu items={menuItems}>
                    <Button type="secondary" size="small" icon={<IconEllipsis />} />
                </Menu>
            )}
        </div>
    )
}
