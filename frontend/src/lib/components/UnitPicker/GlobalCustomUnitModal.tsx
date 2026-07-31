import { useActions, useValues } from 'kea'
import { useEffect, useState } from 'react'

import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input/Input'
import { Modal } from 'lib/elements/Modal'
import { capitalizeFirstLetter } from 'lib/utils'

import { unitPickerModalLogic } from './unitPickerModalLogic'

export function GlobalCustomUnitModal(): JSX.Element | null {
    const { isCustomUnitModalOpen, customUnitModalData } = useValues(unitPickerModalLogic)
    const { hideCustomUnitModal, applyCustomUnit } = useActions(unitPickerModalLogic)
    const [localValue, setLocalValue] = useState('')

    // Update local value when modal data changes
    useEffect(() => {
        if (customUnitModalData) {
            setLocalValue(customUnitModalData.currentValue)
        }
    }, [customUnitModalData])

    if (!isCustomUnitModalOpen || !customUnitModalData) {
        return null
    }

    const { type } = customUnitModalData

    return (
        <Modal
            isOpen={isCustomUnitModalOpen}
            onClose={hideCustomUnitModal}
            forceAbovePopovers={true}
            title={`Custom ${type}`}
            footer={
                <>
                    <Button type="secondary" data-attr={`custom-${type}-cancel`} onClick={hideCustomUnitModal}>
                        Cancel
                    </Button>
                    <Button type="primary" onClick={() => applyCustomUnit(localValue)}>
                        Apply
                    </Button>
                </>
            }
        >
            <Field.Pure
                label={`${capitalizeFirstLetter(type)}:`}
                help={
                    <>
                        With a {type} of "<strong>{localValue || '$'}</strong>", 123.45 will be displayed as "
                        <strong>
                            {type === 'prefix' ? localValue || '$' : ''}123.45
                            {type === 'postfix' ? localValue || '$' : ''}
                        </strong>
                        "
                    </>
                }
            >
                <Input value={localValue} onChange={setLocalValue} autoFocus />
            </Field.Pure>
        </Modal>
    )
}
