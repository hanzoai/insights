import { useActions, useValues } from 'kea'

import { IconFlask } from '@hanzo/icons'
import { Tag } from '@hanzo/elements'

import { Tooltip } from 'lib/elements/Tooltip'

import { SessionRecordingSidebarTab } from '~/types'

import { playerSettingsLogic } from '../playerSettingsLogic'
import { sessionRecordingPlayerLogic } from '../sessionRecordingPlayerLogic'
import { playerSidebarLogic } from '../sidebar/playerSidebarLogic'
import { sessionRecordingExperimentContextLogic } from './sessionRecordingExperimentContextLogic'

function truncateName(name: string, max = 24): string {
    return name.length > max ? `${name.slice(0, max - 1)}…` : name
}

export function PlayerMetaExperimentTags(): JSX.Element | null {
    const { logicProps } = useValues(sessionRecordingPlayerLogic)
    const { seenItems, seenCount, enrolledCount, hasMultipleVariantWarning } = useValues(
        sessionRecordingExperimentContextLogic({ sessionRecordingId: logicProps.sessionRecordingId })
    )
    const { setTab } = useActions(playerSidebarLogic)
    const { setSidebarOpen } = useActions(playerSettingsLogic)

    // Only surface the chip when something experiment-related happened *in this recording*.
    // Enrollments without an in-session exposure event have nothing visible to watch, so they
    // live in the overview sidebar rather than cluttering the player header.
    if (seenCount === 0) {
        return null
    }

    const openOverview = (): void => {
        setSidebarOpen(true)
        setTab(SessionRecordingSidebarTab.OVERVIEW)
    }

    const singleSeen = seenCount === 1 ? seenItems[0] : null
    const seenLabel = singleSeen
        ? `Exposed to experiment ${truncateName(singleSeen.experiment_name)}`
        : `Exposed to ${seenCount} experiments`
    const seenTooltip = singleSeen
        ? `Exposed to experiment "${singleSeen.experiment_name}" during this recording. Click to view.`
        : `Exposed to ${seenCount} experiments during this recording${
              hasMultipleVariantWarning ? ' (one saw multiple variants)' : ''
          }. Click to view.`

    return (
        <span className="flex flex-row items-center gap-x-1 shrink-0" data-attr="replay-experiment-context-chip">
            <Tooltip title={seenTooltip}>
                <Tag
                    type={hasMultipleVariantWarning ? 'warning' : 'default'}
                    icon={<IconFlask />}
                    onClick={openOverview}
                    forceClickable
                >
                    {seenLabel}
                </Tag>
            </Tooltip>
            {enrolledCount > 0 ? (
                <Tooltip
                    title={`Enrolled in ${enrolledCount} experiment${
                        enrolledCount === 1 ? '' : 's'
                    } without an exposure event in this recording. Click to view.`}
                >
                    <Tag type="muted" onClick={openOverview} forceClickable>
                        Enrolled in {enrolledCount} experiment{enrolledCount === 1 ? '' : 's'}
                    </Tag>
                </Tooltip>
            ) : null}
        </span>
    )
}
