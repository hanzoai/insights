import { Tag, TagType, Tooltip } from '@hanzo/elements'
import { IconCheck } from '@hanzo/icons'

export type SnapshotResult = 'unchanged' | 'changed' | 'new' | 'removed'

const RESULT_CONFIG: Record<SnapshotResult, { label: string; type: TagType }> = {
    unchanged: { label: 'Unchanged', type: 'muted' },
    changed: { label: 'Changed', type: 'warning' },
    new: { label: 'New', type: 'highlight' },
    removed: { label: 'Removed', type: 'danger' },
}

interface SnapshotResultBadgeProps {
    result: string
    approvedAt?: string | null
}

export function SnapshotResultBadge({ result, approvedAt }: SnapshotResultBadgeProps): JSX.Element {
    const config = RESULT_CONFIG[result as SnapshotResult] || { label: result, type: 'default' as TagType }
    const isApproved = !!approvedAt

    return (
        <span className="inline-flex items-center gap-1">
            <Tag type={isApproved ? 'success' : config.type}>{config.label}</Tag>
            {isApproved && (
                <Tooltip title="Approved">
                    <IconCheck className="text-success w-4 h-4" />
                </Tooltip>
            )}
        </span>
    )
}
