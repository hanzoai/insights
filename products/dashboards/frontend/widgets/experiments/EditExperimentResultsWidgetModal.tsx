import { BindLogic, useActions, useValues } from 'kea'

import { Button } from 'lib/elements/Button'
import { Modal } from 'lib/elements/Modal'

import { EditWidgetModalTileDetailsSection } from '../EditWidgetModalTileDetailsSection'
import type { DashboardWidgetEditModalProps } from '../registry'
import { editExperimentResultsWidgetModalLogic } from './editExperimentResultsWidgetModalLogic'

function EditExperimentResultsWidgetModalContents(): JSX.Element {
    const { tileName, tileDescription, saving, saveDisabledReason, onClose, defaultTitle } = useValues(
        editExperimentResultsWidgetModalLogic
    )
    const { setTileName, setTileDescription, submit } = useActions(editExperimentResultsWidgetModalLogic)

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Widget settings"
            description="Configure the tile details. Pick which experiment's results to show from the tile's filter bar."
            width={680}
            footer={
                <>
                    <div className="flex-1" />
                    <Button type="secondary" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        loading={saving}
                        disabledReason={saveDisabledReason}
                        onClick={() => submit()}
                    >
                        Save
                    </Button>
                </>
            }
        >
            <EditWidgetModalTileDetailsSection
                tileName={tileName}
                tileDescription={tileDescription}
                defaultTitle={defaultTitle}
                saving={saving}
                setTileName={setTileName}
                setTileDescription={setTileDescription}
            />
        </Modal>
    )
}

export function EditExperimentResultsWidgetModal({
    isOpen,
    onClose,
    config,
    onSave,
    name,
    defaultTitle,
    description,
}: DashboardWidgetEditModalProps): JSX.Element | null {
    if (!isOpen) {
        return null
    }

    return (
        <BindLogic
            logic={editExperimentResultsWidgetModalLogic}
            props={{ onClose, config, onSave, name, defaultTitle, description }}
        >
            <EditExperimentResultsWidgetModalContents />
        </BindLogic>
    )
}
