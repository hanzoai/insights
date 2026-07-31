import { useState } from 'react'

import { IconCommit } from '@hanzo/icons'
import { Tag, Popover } from '@hanzo/elements'

import { ErrorTrackingRelease } from 'lib/components/Errors/types'

import { ReleasePopoverContent } from './ReleasesPopoverContent'

export function ReleasePreviewPill({ release }: { release: ErrorTrackingRelease }): JSX.Element {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <Popover
            visible={isOpen}
            overlay={<ReleasePopoverContent release={release} />}
            placement="right"
            padded={false}
            showArrow
            onMouseEnterInside={() => setIsOpen(true)}
            onMouseLeaveInside={() => setIsOpen(false)}
        >
            <Tag
                className="bg-fill-primary cursor-default inline-flex items-center"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                <IconCommit className="text-sm text-secondary" />
                <span>{releasePillTitle(release)}</span>
            </Tag>
        </Popover>
    )
}

function releasePillTitle(release: ErrorTrackingRelease): string {
    return release.metadata?.git?.commit_id?.slice(0, 7) ?? release.version ?? ''
}
