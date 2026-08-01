import { Button, ButtonProps } from '@hanzo/elements'

import insights from 'lib/insights-typed'

/**
 * Feedback button for the Replay vision product. Clicking it captures the `replay_vision_feedback_clicked`
 * event, which triggers the Replay vision feedback survey (a popover) configured in Insights.
 */
export function ReplayVisionFeedbackButton({
    label = 'Feedback',
    type,
}: {
    label?: string
    type?: ButtonProps['type']
} = {}): JSX.Element {
    return (
        <Button
            size="small"
            type={type}
            tooltip="Share feedback on Replay vision"
            onClick={() => insights.capture('replay_vision_feedback_clicked')}
        >
            {label}
        </Button>
    )
}
