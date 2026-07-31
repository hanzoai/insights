import { useActions, useValues } from 'kea'

import { Modal } from '@hanzo/elements'

import { QuickFilterForm } from './QuickFilterForm'
import { QuickFiltersModalContent } from './QuickFiltersModalContent'
import { QuickFiltersLogicProps } from './quickFiltersLogic'
import { quickFiltersModalLogic } from './quickFiltersModalLogic'

export function QuickFiltersModal({ context }: QuickFiltersLogicProps): JSX.Element {
    const { isModalOpen, view, modalTitle } = useValues(quickFiltersModalLogic({ context }))
    const { closeModal } = useActions(quickFiltersModalLogic({ context }))

    return (
        <Modal title={modalTitle} isOpen={isModalOpen} onClose={closeModal} width={800}>
            {view === 'list' ? <QuickFiltersModalContent context={context} /> : <QuickFilterForm context={context} />}
        </Modal>
    )
}
