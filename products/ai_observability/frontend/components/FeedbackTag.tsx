import { Tag } from '@hanzo/elements'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'

interface FeedbackTagProps {
    properties: Record<string, any>
}

export function FeedbackTag({ properties }: FeedbackTagProps): JSX.Element {
    const { $ai_feedback_text: feedbackText } = properties
    const feedbackPreview = typeof feedbackText === 'string' ? feedbackText.slice(0, 5) : ''
    const text = feedbackText ? feedbackText : 'No feedback provided'

    return (
        <Tag className="bg-surface-primary cursor-default">
            <CopyToClipboardInline
                iconSize="xsmall"
                description="user feedback"
                tooltipMessage={text}
                explicitValue={String(feedbackText)}
            >
                {`User feedback${feedbackPreview ? `: ${feedbackPreview}...` : ''}`}
            </CopyToClipboardInline>
        </Tag>
    )
}
