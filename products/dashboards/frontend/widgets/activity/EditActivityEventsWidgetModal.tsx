import { BindLogic, useActions, useValues } from 'kea'

import { Button } from 'lib/elements/Button'
import { Divider } from 'lib/elements/Divider'
import { Field } from 'lib/elements/Field/Field'
import { Input } from 'lib/elements/Input/Input'
import { Modal } from 'lib/elements/Modal'

import { getDashboardWidgetGroupLabel } from '../../widget_types/catalog'
import { EditWidgetModalFiltersSubsection } from '../EditWidgetModalFiltersSection'
import { EditWidgetModalTileDetailsSection } from '../EditWidgetModalTileDetailsSection'
import type { DashboardWidgetEditModalProps } from '../registry'
import { editActivityEventsWidgetModalLogic } from './editActivityEventsWidgetModalLogic'

function EditActivityEventsWidgetModalContents(): JSX.Element {
    const {
        limit,
        tileName,
        tileDescription,
        filterTestAccounts,
        activeFieldErrors,
        saving,
        saveDisabledReason,
        onClose,
        defaultTitle,
    } = useValues(editActivityEventsWidgetModalLogic)
    const { setLimit, setTileName, setTileDescription, setFilterTestAccounts, clearFieldError, submit } = useActions(
        editActivityEventsWidgetModalLogic
    )

    return (
        <Modal
            isOpen
            onClose={onClose}
            title="Widget settings"
            description="Configure tile details and which events appear on this dashboard."
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
                    <h5 className="text-sm font-semibold m-0">{getDashboardWidgetGroupLabel('activity')}</h5>
                    <div className="flex flex-col gap-4">
                        <EditWidgetModalFiltersSubsection
                            title="Event filters"
                            filterTestAccounts={filterTestAccounts}
                            saving={saving}
                            setFilterTestAccounts={setFilterTestAccounts}
                        >
                            <p className="text-sm text-muted m-0 sm:col-span-2">
                                The date range is on the tile filter bar (collapsible on the tile). Use this modal for
                                test-account filtering and list size.
                            </p>
                            <Field.Pure
                                label="Number of events"
                                help="Show up to 50 events on the tile."
                                error={activeFieldErrors.limit}
                            >
                                <Input
                                    type="number"
                                    min={1}
                                    max={50}
                                    fullWidth
                                    value={limit}
                                    onChange={(value) => {
                                        setLimit(Number(value))
                                        clearFieldError('limit')
                                    }}
                                />
                            </Field.Pure>
                        </EditWidgetModalFiltersSubsection>
                    </div>
                </section>
            </div>
        </Modal>
    )
}

export function EditActivityEventsWidgetModal({
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
            logic={editActivityEventsWidgetModalLogic}
            props={{ onClose, config, onSave, name, defaultTitle, description }}
        >
            <EditActivityEventsWidgetModalContents />
        </BindLogic>
    )
}
