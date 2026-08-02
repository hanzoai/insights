import { Tag, TagType } from '@hanzo/elements'

export type RunStatus = 'pending' | 'processing' | 'completed' | 'failed'

const STATUS_CONFIG: Record<RunStatus, { label: string; type: TagType }> = {
    pending: { label: 'Pending', type: 'default' },
    processing: { label: 'Processing', type: 'highlight' },
    completed: { label: 'Completed', type: 'success' },
    failed: { label: 'Failed', type: 'danger' },
}

interface RunStatusBadgeProps {
    status: string
}

export function RunStatusBadge({ status }: RunStatusBadgeProps): JSX.Element {
    const config = STATUS_CONFIG[status as RunStatus] || { label: status, type: 'default' as TagType }
    return <Tag type={config.type}>{config.label}</Tag>
}
