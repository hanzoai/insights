import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { Banner, Button, Input, Modal, Switch } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { dayjs } from 'lib/dayjs'
import { teamLogic } from 'scenes/teamLogic'

import { AccessControlLevel, AccessControlResourceType } from '~/types'

export function LogsCaptureSettings(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam, currentTeamLoading } = useValues(teamLogic)

    return (
        <AccessControlAction resourceType={AccessControlResourceType.Logs} minAccessLevel={AccessControlLevel.Editor}>
            <Switch
                data-attr="opt-in-logs-capture-console-log-switch"
                onChange={(checked) => {
                    updateCurrentTeam({
                        logs_settings: { ...currentTeam?.logs_settings, capture_console_logs: checked },
                    })
                }}
                label="Capture console logs to Logs product"
                bordered
                checked={!!currentTeam?.logs_settings?.capture_console_logs}
                loading={currentTeamLoading}
            />
        </AccessControlAction>
    )
}

export function LogsJsonParseSettings(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam, currentTeamLoading } = useValues(teamLogic)

    const isJsonParseLogs = currentTeam?.logs_settings?.json_parse_logs ?? true

    return (
        <>
            <AccessControlAction
                resourceType={AccessControlResourceType.Logs}
                minAccessLevel={AccessControlLevel.Editor}
            >
                <Switch
                    data-attr="logs-json-parse-switch"
                    onChange={(checked) => {
                        updateCurrentTeam({
                            logs_settings: { ...currentTeam?.logs_settings, json_parse_logs: checked },
                        })
                    }}
                    label="JSON parse logs"
                    bordered
                    checked={isJsonParseLogs}
                    loading={currentTeamLoading}
                />
            </AccessControlAction>
        </>
    )
}

export function LogsRetentionSettings(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam, currentTeamLoading } = useValues(teamLogic)

    const savedRetentionDays = currentTeam?.logs_settings?.retention_days ?? 15
    const retentionLastUpdated = currentTeam?.logs_settings?.retention_last_updated

    const [retentionDays, setRetentionDays] = useState(savedRetentionDays)
    const [showConfirmModal, setShowConfirmModal] = useState(false)

    const hasChanges = retentionDays !== savedRetentionDays
    const isReducingRetention = retentionDays < savedRetentionDays

    const getUpdateStatus = (): { canUpdate: boolean; hoursRemaining: number } => {
        if (!retentionLastUpdated) {
            return { canUpdate: true, hoursRemaining: 0 }
        }
        const lastUpdated = dayjs(retentionLastUpdated)
        const hoursSinceUpdate = dayjs().diff(lastUpdated, 'hours')
        const hoursRemaining = Math.max(0, 24 - hoursSinceUpdate)
        return { canUpdate: hoursSinceUpdate >= 24, hoursRemaining }
    }

    const { canUpdate, hoursRemaining } = getUpdateStatus()

    const performSave = (): void => {
        updateCurrentTeam({
            logs_settings: {
                ...currentTeam?.logs_settings,
                retention_days: retentionDays,
            },
        })
        setShowConfirmModal(false)
    }

    const handleSave = (): void => {
        if (isReducingRetention) {
            setShowConfirmModal(true)
        } else {
            performSave()
        }
    }

    const getDisabledReason = (): string | undefined => {
        if (!hasChanges) {
            return 'No change to save'
        }
        if (!canUpdate) {
            return `You can update retention again in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}`
        }
        return undefined
    }

    return (
        <AccessControlAction resourceType={AccessControlResourceType.Logs} minAccessLevel={AccessControlLevel.Editor}>
            <div className="space-y-2">
                <Input
                    data-attr="logs-retention-input"
                    type="number"
                    value={retentionDays}
                    onChange={(value) => {
                        setRetentionDays(value || NaN)
                    }}
                    min={2}
                    max={90}
                    suffix={<>days</>}
                />
                {retentionDays < 15 && (
                    <Banner type="info">
                        15 days is free. There's no discount for less than 15 days retention.
                    </Banner>
                )}
                {hasChanges && canUpdate && (
                    <Banner type="warning">You can only update retention settings once per 24 hours.</Banner>
                )}
                <Button
                    type="primary"
                    onClick={handleSave}
                    loading={currentTeamLoading}
                    disabledReason={getDisabledReason()}
                    data-attr="logs-retention-save"
                >
                    Save retention settings
                </Button>

                <Modal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    title="Confirm retention reduction"
                    footer={
                        <>
                            <Button type="secondary" onClick={() => setShowConfirmModal(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" status="danger" onClick={performSave}>
                                Reduce retention
                            </Button>
                        </>
                    }
                >
                    <p>
                        Are you sure you want to reduce retention? Up to {savedRetentionDays - retentionDays} days of
                        logs will be <strong>permanently deleted</strong>.
                    </p>
                </Modal>
            </div>
        </AccessControlAction>
    )
}
