import { useActions, useValues } from 'kea'

import { Modal } from '@hanzo/elements'

import { QuickFilterForm } from './QuickFilterForm'
import { QuickFiltersModalContent } from './QuickFiltersModalContent'
import { ModalView, QuickFiltersModalLogicProps, quickFiltersModalLogic } from './quickFiltersModalLogic'

export function QuickFiltersModal({ context, onNewFilterCreated }: QuickFiltersModalLogicProps): JSX.Element {
    const logicProps = { context, onNewFilterCreated }
    const { isModalOpen, view, modalTitle } = useValues(quickFiltersModalLogic(logicProps))
    const { closeModal } = useActions(quickFiltersModalLogic(logicProps))

    return (
        <Modal title={modalTitle} isOpen={isModalOpen} onClose={closeModal} width={800}>
            {view === ModalView.List ? (
                <QuickFiltersModalContent context={context} />
            ) : (
                <QuickFilterForm context={context} />
            )}
        </Modal>
    )
}
