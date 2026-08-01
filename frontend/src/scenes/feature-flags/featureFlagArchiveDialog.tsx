import insights from 'insights-js'

import { Dialog } from '@hanzo/elements'

import { FeatureFlagType } from '~/types'

export type FeatureFlagArchivedSource = 'archive-dialog' | 'disable-confirmation'

export function reportFeatureFlagArchived(via: FeatureFlagArchivedSource): void {
    insights.capture('feature flag archived', { via })
}

/**
 * Opens the archive confirmation dialog for a feature flag. The warning copy lives here so the
 * detail page and the list share one source of truth — only the confirm callback differs.
 * Unarchiving is immediate at the call site, so it doesn't go through this dialog.
 */
export function openFeatureFlagArchiveDialog(
    featureFlag: Pick<FeatureFlagType, 'active'>,
    onArchive: () => void
): void {
    Dialog.open({
        title: 'Archive this flag?',
        description: featureFlag.active
            ? 'This flag is currently enabled — archiving will disable it and immediately roll it back from users matching the release conditions. Archived flags are hidden from the flag list, but linked experiments and surveys keep their data.'
            : 'Archived flags are hidden from the flag list, but linked experiments and surveys keep their data. You can unarchive it at any time.',
        primaryButton: {
            children: 'Archive',
            type: 'primary',
            onClick: onArchive,
            size: 'small',
        },
        secondaryButton: {
            children: 'Cancel',
            type: 'tertiary',
            size: 'small',
        },
    })
}
