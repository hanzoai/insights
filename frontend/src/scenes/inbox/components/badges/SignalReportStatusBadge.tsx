import { Tag, TagType, Tooltip } from '@hanzo/elements'

import { SignalReportStatus } from '../../types'

export const STATUS_TOOLTIPS: Partial<Record<SignalReportStatus, string>> = {
    [SignalReportStatus.READY]: 'Research is complete. You can create a task from this report.',
    [SignalReportStatus.PENDING_INPUT]: 'This report needs human input in Insights before it can proceed.',
    [SignalReportStatus.IN_PROGRESS]: "An AI agent is actively researching this report's findings.",
    [SignalReportStatus.CANDIDATE]: 'Queued for research. An agent will pick this up shortly.',
    [SignalReportStatus.POTENTIAL]: 'Gathering findings. The report will be queued once enough evidence accumulates.',
    [SignalReportStatus.RESOLVED]: 'This report has been resolved.',
    [SignalReportStatus.FAILED]: 'Research failed. The report may be retried automatically.',
    [SignalReportStatus.SUPPRESSED]: 'This report has been suppressed and is out of your inbox.',
    [SignalReportStatus.DELETED]: 'This report has been deleted.',
}

export const STATUS_LABELS: Partial<Record<SignalReportStatus, string>> = {
    [SignalReportStatus.READY]: 'Ready',
    [SignalReportStatus.PENDING_INPUT]: 'Needs input',
    [SignalReportStatus.IN_PROGRESS]: 'Researching',
    [SignalReportStatus.CANDIDATE]: 'Queued',
    [SignalReportStatus.POTENTIAL]: 'Gathering',
    [SignalReportStatus.RESOLVED]: 'Resolved',
    [SignalReportStatus.FAILED]: 'Failed',
    [SignalReportStatus.SUPPRESSED]: 'Suppressed',
    [SignalReportStatus.DELETED]: 'Deleted',
}

// Each pipeline status gets a distinct color so the inbox reads at a glance.
function inboxStatusBadgeType(status: SignalReportStatus): TagType {
    switch (status) {
        case SignalReportStatus.READY:
            return 'success'
        case SignalReportStatus.RESOLVED:
            return 'completion'
        case SignalReportStatus.PENDING_INPUT:
            return 'caution'
        case SignalReportStatus.IN_PROGRESS:
            return 'warning'
        case SignalReportStatus.CANDIDATE:
            return 'highlight'
        case SignalReportStatus.FAILED:
            return 'danger'
        case SignalReportStatus.POTENTIAL:
            return 'default'
        // Out-of-inbox terminal states (suppressed / deleted) and any unknown status.
        default:
            return 'muted'
    }
}

export function SignalReportStatusBadge({ status }: { status: SignalReportStatus }): JSX.Element {
    const label = STATUS_LABELS[status] ?? status
    const tooltip = STATUS_TOOLTIPS[status] ?? status

    return (
        <Tooltip title={tooltip}>
            <Tag size="small" type={inboxStatusBadgeType(status)} className="cursor-help select-none">
                {label}
            </Tag>
        </Tooltip>
    )
}
