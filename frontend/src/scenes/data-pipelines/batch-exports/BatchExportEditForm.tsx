import { IconInfo } from '@hanzo/icons'
import { Checkbox, Input, Tooltip } from '@hanzo/elements'

import { DatePicker } from 'lib/components/DatePicker/DatePicker'
import { dayjs } from 'lib/dayjs'
import { Field } from 'lib/elements/Field'

import { DESTINATIONS } from './destinations'
import { BatchExportConfigurationForm } from './types'

export function BatchExportGeneralEditFields({
    isNew,
    isPipeline = false,
    batchExportConfigForm,
}: {
    isNew: boolean
    isPipeline?: boolean
    batchExportConfigForm: BatchExportConfigurationForm
}): JSX.Element {
    return (
        <div>
            {!isPipeline && (
                <Field name="name" label="Name">
                    <Input placeholder="Name your workflow for future reference" />
                </Field>
            )}
            <div className="flex flex-wrap gap-2 items-start">
                {(!isPipeline || batchExportConfigForm.end_at) && ( // Not present in the new UI unless grandfathered in
                    <Field
                        name="end_at"
                        label="End date"
                        className="flex-1"
                        info={
                            <>
                                The date up to which data is to be exported. Leaving it unset implies that data exports
                                will continue forever until this export is paused or deleted.
                            </>
                        }
                    >
                        {({ value, onChange }) => (
                            <DatePicker
                                value={value}
                                onChange={onChange}
                                placeholder="Select end date (optional)"
                                clearable
                                maxDate={dayjs().add(5, 'year')}
                            />
                        )}
                    </Field>
                )}
            </div>

            {isNew && !isPipeline ? (
                <Field name="paused">
                    <Checkbox
                        bordered
                        label={
                            <span className="flex gap-2 items-center">
                                Create in paused state
                                <Tooltip
                                    title={
                                        <>
                                            If selected, the batch export will be created, but no runs will be
                                            automatically triggered until it is resumed. Manual backfills can still be
                                            triggered even if the batch export is paused.
                                        </>
                                    }
                                >
                                    <IconInfo className="text-lg text-secondary" />
                                </Tooltip>
                            </span>
                        }
                    />
                </Field>
            ) : null}
        </div>
    )
}

// Per-destination field rendering is owned by the registry under ./destinations/.
// To add a new destination, create a new file there and register it in destinations/index.ts.
export function BatchExportsEditFields({
    isNew,
    batchExportConfigForm,
}: {
    isNew: boolean
    batchExportConfigForm: BatchExportConfigurationForm
}): JSX.Element {
    const destination = batchExportConfigForm.destination
    const definition = destination ? DESTINATIONS[destination] : undefined

    return (
        <div className="flex flex-col gap-y-4 max-w-200">
            {definition && <definition.Fields isNew={isNew} formValues={batchExportConfigForm} />}
        </div>
    )
}
