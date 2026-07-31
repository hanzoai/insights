import { useActions, useValues } from 'kea'

import { Button } from 'lib/elements/Button'
import { Modal } from 'lib/elements/Modal'
import { AddSavedInsightsToNotebook } from 'scenes/saved-insights/AddSavedInsightsToNotebook'

import { addInsightsToNotebookModalLogic } from './addInsightsToNotebookModalLogic'

export function AddInsightsToNotebookModal(): JSX.Element {
    const { closeModal } = useActions(addInsightsToNotebookModalLogic)
    const { isAddInsightsToNotebookModalOpen, insertionPosition } = useValues(addInsightsToNotebookModalLogic)

    return (
        <Modal
            title="Add insight to notebook"
            onClose={closeModal}
            isOpen={isAddInsightsToNotebookModalOpen}
            footer={<Button type="secondary" data-attr="notebook-cancel" onClick={closeModal} children="Close" />}
        >
            <AddSavedInsightsToNotebook insertionPosition={insertionPosition} />
        </Modal>
    )
}
