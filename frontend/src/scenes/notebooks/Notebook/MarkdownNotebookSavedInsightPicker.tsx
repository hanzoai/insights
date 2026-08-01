import { Button } from '@hanzo/elements'

import { Modal } from 'lib/elements/Modal'
import { useSummarizeInsight } from 'scenes/insights/summarizeInsight'
import { SavedInsightsTable } from 'scenes/saved-insights/SavedInsightsTable'

export type MarkdownNotebookSavedInsightPickerProps = {
    isOpen: boolean
    onClose: () => void
    onSelect: (shortId: string, title: string) => void
}

export function MarkdownNotebookSavedInsightPicker({
    isOpen,
    onClose,
    onSelect,
}: MarkdownNotebookSavedInsightPickerProps): JSX.Element {
    const summarizeInsight = useSummarizeInsight()

    return (
        <Modal
            title="Add insight to notebook"
            onClose={onClose}
            isOpen={isOpen}
            footer={
                <Button type="secondary" data-attr="markdown-notebook-saved-insight-cancel" onClick={onClose}>
                    Close
                </Button>
            }
        >
            <SavedInsightsTable
                onToggle={(insight) => onSelect(insight.short_id, insight.name || summarizeInsight(insight.query))}
            />
        </Modal>
    )
}
