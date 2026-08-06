import { useActions } from 'kea'
import { useEffect } from 'react'

import { Button } from '@hanzo/elements'

import { Modal } from 'lib/elements/Modal'

import { addExperimentsToNotebookModalLogic } from '../AddExperimentsToNotebookModal/addExperimentsToNotebookModalLogic'
import { ExperimentsNotebookTable } from '../AddExperimentsToNotebookModal/ExperimentsNotebookTable'

export type MarkdownNotebookExperimentPickerProps = {
    isOpen: boolean
    onClose: () => void
    onSelect: (experimentId: number) => void
}

export function MarkdownNotebookExperimentPicker({
    isOpen,
    onClose,
    onSelect,
}: MarkdownNotebookExperimentPickerProps): JSX.Element {
    const { loadExperiments, closeModal } = useActions(addExperimentsToNotebookModalLogic)

    // The table reads from the shared experiments logic, so this picker drives its lifecycle: load on
    // open, and reset filters on close so a stale search query doesn't carry over to the next open.
    // `closeModal` resets the filters without triggering a fetch (no listener).
    useEffect(() => {
        if (isOpen) {
            loadExperiments()
        } else {
            closeModal()
        }
    }, [isOpen, loadExperiments, closeModal])

    return (
        <Modal
            title="Add experiment to notebook"
            onClose={onClose}
            isOpen={isOpen}
            footer={
                <Button type="secondary" data-attr="markdown-notebook-experiment-cancel" onClick={onClose}>
                    Close
                </Button>
            }
        >
            <ExperimentsNotebookTable onSelect={onSelect} />
        </Modal>
    )
}
