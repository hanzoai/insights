import { Tag } from '@hanzo/elements'

import { TASK_STATUS_CONFIG } from '../lib/task-status'
import { Task } from '../types'

const STATUS_TO_TAG_TYPE: Record<string, 'primary' | 'success' | 'danger' | 'warning' | 'default'> = {
    primary: 'primary',
    success: 'success',
    danger: 'danger',
    warning: 'warning',
    muted: 'default',
}

export function TaskStatusBadge({ task }: { task: Task }): JSX.Element {
    const config = TASK_STATUS_CONFIG[task.latest_run?.status || 'not_started']
    const tagType = STATUS_TO_TAG_TYPE[config.status || 'muted'] || 'default'

    return <Tag type={tagType}>{config.label}</Tag>
}
