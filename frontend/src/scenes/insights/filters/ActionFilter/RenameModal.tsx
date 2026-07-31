import { useActions, useValues } from 'kea'

import { Button, Input, Modal } from '@hanzo/elements'

import { entityFilterLogic } from 'scenes/insights/filters/ActionFilter/entityFilterLogic'
import { renameModalLogic } from 'scenes/insights/filters/ActionFilter/renameModalLogic'
import { getDisplayNameFromEntityFilter } from 'scenes/insights/utils'

import { InsightType } from '~/types'

interface RenameModalProps {
    typeKey: string
    view?: InsightType
}

export function RenameModal({ typeKey, view }: RenameModalProps): JSX.Element {
    const { selectedFilter, modalVisible } = useValues(entityFilterLogic)
    const { renameFilter, hideModal } = useActions(entityFilterLogic)

    const logic = renameModalLogic({ typeKey, filter: selectedFilter })
    const { name } = useValues(logic)
    const { setName } = useActions(logic)

    const title = `Rename ${view === InsightType.FUNNELS ? 'funnel step' : 'graph series'}`

    return (
        <Modal
            data-attr="filter-rename-modal"
            isOpen={modalVisible}
            title={title}
            width={520}
            forceAbovePopovers={true}
            footer={
                <>
                    <Button type="secondary" onClick={hideModal}>
                        Cancel
                    </Button>
                    <Button type="primary" onClick={() => renameFilter(name)}>
                        {title}
                    </Button>
                </>
            }
            onClose={hideModal}
        >
            Query series/steps can be renamed to provide a more{' '}
            <strong>meaningful label for you and your team members</strong>. Custom names are also shown on dashboards.
            <br />
            <div className="l4 mt-2 mb-2">Name</div>
            <Input
                value={name}
                onPressEnter={() => renameFilter(name)}
                onChange={(value) => setName(value)}
                suffix={
                    <span
                        className="text-secondary truncate max-w-[200px]"
                        title={getDisplayNameFromEntityFilter(selectedFilter, false) ?? ''}
                    >
                        {getDisplayNameFromEntityFilter(selectedFilter, false) ?? ''}
                    </span>
                }
                autoFocus
                onFocus={(e) => e.target.select()}
            />
        </Modal>
    )
}
