import { useActions, useValues } from 'kea'

import { Input, TextArea } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { JSONEditor } from '../components/JSONEditor'
import { aiObservabilityDatasetLogic } from './aiObservabilityDatasetLogic'

export function EditDatasetForm(): JSX.Element {
    const { datasetForm } = useValues(aiObservabilityDatasetLogic)
    const { setDatasetFormValue } = useActions(aiObservabilityDatasetLogic)

    return (
        <div className="max-w-160">
            <div className="flex flex-col gap-4 flex-2">
                <Field name="name" label="Name" htmlFor="dataset-name">
                    <Input
                        data-attr="dataset-name"
                        value={datasetForm.name}
                        onChange={(value) => setDatasetFormValue('name', value)}
                        placeholder="Enter dataset name"
                        data-testid="edit-dataset-name-input"
                    />
                </Field>

                <Field name="description" label="Description" showOptional>
                    <TextArea
                        className="ph-ignore-input"
                        placeholder="Describe what this dataset contains"
                        value={datasetForm.description}
                        onChange={(value) => setDatasetFormValue('description', value)}
                        data-testid="edit-dataset-description-input"
                    />
                </Field>

                <Field
                    name="metadata"
                    label="Metadata"
                    htmlFor="dataset-metadata"
                    showOptional
                    help="Additional key-value pairs to store with the dataset"
                >
                    <JSONEditor
                        value={datasetForm.metadata ?? undefined}
                        onChange={(code) => {
                            setDatasetFormValue('metadata', code)
                        }}
                    />
                </Field>
            </div>
        </div>
    )
}
