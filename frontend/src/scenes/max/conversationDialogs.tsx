import { Dialog } from '@hanzo/elements'

export function openDeleteConversationDialog(onConfirm: () => void): void {
    Dialog.open({
        title: 'Delete chat?',
        description: 'The chat will be removed from your history.',
        primaryButton: {
            children: 'Delete',
            status: 'danger',
            onClick: onConfirm,
        },
        secondaryButton: { children: 'Cancel' },
    })
}
