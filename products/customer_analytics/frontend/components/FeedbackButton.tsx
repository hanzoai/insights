import { Button } from '@hanzo/elements'

export function FeedbackButton({ id }: { id: string }): JSX.Element {
    return (
        <Button size="small" id={id} tooltip="Have any questions or feedback?">
            Feedback
        </Button>
    )
}
