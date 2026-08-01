import { BindLogic, useActions, useValues } from 'kea'

import { Button } from 'lib/elements/Button'
import { Divider } from 'lib/elements/Divider'
import { Field } from 'lib/elements/Field/Field'
import { Input } from 'lib/elements/Input/Input'
import { Modal } from 'lib/elements/Modal'
import { Select } from 'lib/elements/Select'

import { getDashboardWidgetGroupLabel } from '../../widget_types/catalog'
import { EditWidgetModalTileDetailsSection } from '../EditWidgetModalTileDetailsSection'
import type { DashboardWidgetEditModalProps } from '../registry'
import { editSurveyResultsWidgetModalLogic } from './editSurveyResultsWidgetModalLogic'
import { SURVEY_RESULTS_WIDGET_DATE_RANGE_OPTIONS } from './surveysWidgetConfigValidation'

function EditSurveyResultsWidgetModalContents(): JSX.Element {
    const {
        limit,
        dateFrom,
        tileName,
        tileDescription,
        activeFieldErrors,
        saving,
        saveDisabledReason,
        onClose,
        defaultTitle,
    } = useValues(editSurveyResultsWidgetModalLogic)
    const { setLimit, setDateFrom, setTileName, setTileDescription, clearFieldError, submit } = useActions(
        editSurveyResultsWidgetModalLogic
    )

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Widget settings"
            description="Configure the tile details. Pick which survey to show from the tile's filter bar."
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
            <div className="flex flex-col gap-4">
                <EditWidgetModalTileDetailsSection
                    tileName={tileName}
                    tileDescription={tileDescription}
                    defaultTitle={defaultTitle}
                    saving={saving}
                    setTileName={setTileName}
                    setTileDescription={setTileDescription}
                />
                <Divider className="my-0" />
                <section className="flex flex-col gap-3">
                    <h5 className="text-sm font-semibold m-0">{getDashboardWidgetGroupLabel('surveys')}</h5>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field.Pure
                            label="Date range"
                            help="Scopes both the performance stats and the recent responses."
                        >
                            <Select
                                value={dateFrom}
                                disabled={saving}
                                options={SURVEY_RESULTS_WIDGET_DATE_RANGE_OPTIONS}
                                onChange={(value) => {
                                    if (value) {
                                        setDateFrom(value)
                                    }
                                }}
                                fullWidth
                            />
                        </Field.Pure>
                        <Field.Pure
                            label="Number of responses"
                            help="Show up to 25 recent responses on the tile."
                            error={activeFieldErrors.limit}
                        >
                            <Input
                                type="number"
                                min={1}
                                max={25}
                                fullWidth
                                value={limit}
                                onChange={(value) => {
                                    setLimit(Number(value))
                                    clearFieldError('limit')
                                }}
                            />
                        </Field.Pure>
                    </div>
                </section>
            </div>
        </Modal>
    )
}

export function EditSurveyResultsWidgetModal({
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
            logic={editSurveyResultsWidgetModalLogic}
            props={{ onClose, config, onSave, name, defaultTitle, description }}
        >
            <EditSurveyResultsWidgetModalContents />
        </BindLogic>
    )
}
