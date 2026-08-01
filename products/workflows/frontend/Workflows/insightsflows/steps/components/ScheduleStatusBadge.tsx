import { useValues } from 'kea'

import { Tag } from '@hanzo/elements'

import { workflowLogic } from '../../../workflowLogic'

export function ScheduleStatusBadge(): JSX.Element | null {
    const { currentSchedule, workflow } = useValues(workflowLogic)

    if (!currentSchedule) {
        return null
    }

    const isWorkflowActive = workflow?.status === 'active'
    const isCompleted = currentSchedule.status === 'completed'
    const isSchedulePaused = currentSchedule.status === 'paused'

    if (isCompleted) {
        return (
            <Tag type="default" size="small">
                Completed
            </Tag>
        )
    }

    if (isSchedulePaused || !isWorkflowActive) {
        return (
            <Tag type="warning" size="small">
                Paused
            </Tag>
        )
    }

    return (
        <Tag type="success" size="small">
            Active
        </Tag>
    )
}
