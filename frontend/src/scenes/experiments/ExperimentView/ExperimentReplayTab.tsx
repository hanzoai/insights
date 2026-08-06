import { useActions, useValues } from 'kea'
import { Fragment } from 'react'

import { IconChevronDown, IconInfo } from '@hanzo/icons'
import { Banner, SegmentedButton } from '@hanzo/elements'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@hanzo/quill'

import { Button } from 'lib/elements/Button'
import { Tooltip } from 'lib/elements/Tooltip'
import { SessionRecordingsPlaylist } from 'scenes/session-recordings/playlist/SessionRecordingsPlaylist'

import { Experiment } from '~/types'

import { isLaunched } from '../experimentStatus'
import { EXPOSURE_FALLBACK_NOTICE, EXPOSURE_UNLINKABLE_REASON } from '../viewRecordingsLinkabilityLogic'
import { ExperimentReplayMetricOption, experimentReplayTabLogic } from './experimentReplayTabLogic'
import { VariantTag } from './VariantTag'

// SegmentedButton values must be strings; the logic stores null for "All". '$' is not an
// allowed character in variant keys, so the '$' prefix guarantees no collision with a real
// variant — a variant literally named "all" just renders as its own option after the built-in "All".
const ALL_VARIANTS = '$all'

export function ExperimentReplayTab({ experiment }: { experiment: Experiment }): JSX.Element {
    const logic = experimentReplayTabLogic({ experiment })
    const {
        effectiveVariantKey,
        variantKeys,
        recordingsFilters,
        exposureUnlinkable,
        usingExposureFallback,
        effectiveMetricUuids,
        metricOptions,
    } = useValues(logic)
    const { setSelectedVariantKey, setMetricSelected, recordingsLoaded, recordingOpened } = useActions(logic)

    if (!isLaunched(experiment)) {
        return <Banner type="info">Launch the experiment to see recordings of participants.</Banner>
    }

    if (exposureUnlinkable) {
        return <Banner type="warning">{EXPOSURE_UNLINKABLE_REASON}</Banner>
    }

    // Selectable metrics render as checkboxes. Unlinkable ones move to labelled sections that
    // explain once, via a section tooltip, why they can't be matched — instead of repeating the
    // same reason on every row. One section per distinct reason, since metrics can be unmatchable
    // for different reasons (server-side events, a retention window, data-warehouse-only sources).
    const linkableMetricOptions = metricOptions.filter((option) => !option.unlinkable)
    const unlinkableOptionsByReason = new Map<string, ExperimentReplayMetricOption[]>()
    for (const option of metricOptions) {
        if (option.unlinkable && option.unlinkableReason) {
            unlinkableOptionsByReason.set(option.unlinkableReason, [
                ...(unlinkableOptionsByReason.get(option.unlinkableReason) ?? []),
                option,
            ])
        }
    }

    return (
        <div data-attr="experiment-recordings-tab">
            {usingExposureFallback && (
                <Banner type="info" className="mb-2">
                    {EXPOSURE_FALLBACK_NOTICE}
                </Banner>
            )}
            <div className="mb-2 flex flex-wrap gap-2">
                <SegmentedButton
                    size="small"
                    value={effectiveVariantKey ?? ALL_VARIANTS}
                    onChange={(value) => setSelectedVariantKey(value === ALL_VARIANTS ? null : value)}
                    options={[
                        { value: ALL_VARIANTS, label: 'All' },
                        ...variantKeys.map((key) => ({ value: key, label: <VariantTag variantKey={key} /> })),
                    ]}
                />
                {metricOptions.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    size="small"
                                    type="secondary"
                                    sideIcon={<IconChevronDown />}
                                    tooltip="Only show sessions that fired events for every selected metric. Whether a session fired a metric's events can differ from what the experiment analysis counts."
                                    data-attr="experiment-recordings-metric-filter"
                                />
                            }
                        >
                            {effectiveMetricUuids.length > 0
                                ? `Metric events (${effectiveMetricUuids.length})`
                                : 'Metric events'}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="min-w-fit max-w-100">
                            {linkableMetricOptions.map((option) => (
                                <DropdownMenuCheckboxItem
                                    key={option.uuid}
                                    checked={effectiveMetricUuids.includes(option.uuid)}
                                    onCheckedChange={(checked: boolean) => setMetricSelected(option.uuid, checked)}
                                    closeOnClick={false}
                                    data-attr="experiment-recordings-metric-option"
                                >
                                    {option.name}
                                </DropdownMenuCheckboxItem>
                            ))}
                            {[...unlinkableOptionsByReason.entries()].map(([reason, options], index) => (
                                // Fragment, not a wrapper element: the separator, label, and items
                                // must stay direct children of the menu for keyboard nav and ARIA.
                                <Fragment key={reason}>
                                    {(linkableMetricOptions.length > 0 || index > 0) && <DropdownMenuSeparator />}
                                    {/* Quill's DropdownMenuLabel renders a Base UI GroupLabel, which must
                                        live inside a DropdownMenuGroup or it throws at render. */}
                                    <DropdownMenuGroup>
                                        <DropdownMenuLabel inset className="flex items-center gap-1">
                                            Can't match to recordings
                                            <Tooltip title={reason}>
                                                <IconInfo className="size-3 shrink-0" />
                                            </Tooltip>
                                        </DropdownMenuLabel>
                                        {options.map((option) => (
                                            // Informational only — not selectable. The section label above
                                            // carries the explanation shared by this section's metrics.
                                            <DropdownMenuItem
                                                key={option.uuid}
                                                inset
                                                disabled
                                                data-attr="experiment-recordings-metric-option"
                                            >
                                                {option.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuGroup>
                                </Fragment>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            <div className="SessionRecordingPlaylistHeightWrapper">
                <SessionRecordingsPlaylist
                    logicKey={`experiment-${experiment.id}`}
                    filters={recordingsFilters}
                    updateSearchParams={false}
                    onRecordingsLoaded={(recordings) => recordingsLoaded(recordings.map((recording) => recording.id))}
                    onRecordingSelected={(recordingId) => recordingOpened(recordingId)}
                />
            </div>
        </div>
    )
}
