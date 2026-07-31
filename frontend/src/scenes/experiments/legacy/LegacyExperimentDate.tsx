import { useState } from 'react'

import { IconPencil } from '@hanzo/icons'
import { Button, CalendarSelectInput } from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'
import { dayjs } from 'lib/dayjs'
import { Label } from 'lib/ui/Label/Label'

/**
 * @deprecated Use the new ExperimentDate component instead
 */
export const LegacyExperimentDate = ({
    label,
    date,
    onChange,
    selectionLimitDate,
    'data-attr': dataAttr,
}: {
    label: string
    date?: string | null
    selectionLimitDate?: string | null
    onChange?: (date: string) => void
    'data-attr'?: string
}): JSX.Element | null => {
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

    if (!date) {
        return null
    }

    return (
        <div className="block" data-attr={dataAttr}>
            <Label intent="menu">{label}</Label>
            <div className="flex">
                {isDatePickerOpen ? (
                    <CalendarSelectInput
                        granularity="minute"
                        visible
                        value={dayjs(date)}
                        onChange={(newDate) => {
                            if (newDate && onChange) {
                                onChange(newDate.toISOString())
                            }
                        }}
                        onClose={() => setIsDatePickerOpen(false)}
                        onClickOutside={() => setIsDatePickerOpen(false)}
                        clearable={false}
                        selectionPeriod="past"
                        buttonProps={{ size: 'xsmall', 'data-attr': `${dataAttr}-picker` }}
                        selectionPeriodLimit={selectionLimitDate ? dayjs(selectionLimitDate) : undefined}
                    />
                ) : (
                    <>
                        <TZLabel time={date} />
                        <Button
                            title={`Move ${label}`}
                            data-attr={`move-${dataAttr}`}
                            icon={<IconPencil />}
                            size="small"
                            onClick={() => setIsDatePickerOpen(true)}
                            noPadding
                            className="ml-2"
                        />
                    </>
                )}
            </div>
        </div>
    )
}
