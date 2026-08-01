import { Input } from '@hanzo/elements'

import { IntegrationChoice } from 'lib/components/CyclotronJob/integrations/IntegrationChoice'
import { Field } from 'lib/elements/Field'

import { CompressionField, FileFormatField, MaxFileSizeField, validateAzureContainerName } from './common'
import type { DestinationDefinition } from './types'

export const azureBlobDefinition: DestinationDefinition = {
    type: 'AzureBlob',
    usesIntegration: true,
    defaults: () => ({
        file_format: 'Parquet',
        compression: 'zstd',
    }),
    requiredFields: ({ isNew }) => ['integration_id', 'container_name', ...(isNew ? ['file_format'] : [])],
    configKeys: ['container_name', 'prefix', 'compression', 'file_format', 'max_file_size_mb'],
    validate: (formValues) => ({
        container_name: validateAzureContainerName(formValues.container_name),
    }),
    eventTableOverrides: { teamIdHogql: 'team_id' },
    Fields: function AzureBlobFields({ formValues }) {
        return (
            <>
                <Field name="integration_id" label="Azure connection">
                    {({ value, onChange }) => (
                        <IntegrationChoice integration="azure-blob" value={value} onChange={onChange} />
                    )}
                </Field>

                <Field
                    name="container_name"
                    label="Container name"
                    info={
                        <>
                            The name of the Azure Blob Storage container where data will be exported. The container must
                            already exist.
                        </>
                    }
                >
                    <Input placeholder="my-export-container" />
                </Field>

                <Field
                    name="prefix"
                    label="Blob prefix"
                    showOptional
                    info={
                        <>
                            Optional prefix for blob names. Supports template variables: {'{year}'}, {'{month}'},{' '}
                            {'{day}'}, {'{hour}'}, {'{minute}'}, {'{data_interval_start}'}, {'{data_interval_end}'}.
                        </>
                    }
                >
                    <Input placeholder="insights/events/" />
                </Field>

                <div className="flex gap-4">
                    <FileFormatField />
                    <MaxFileSizeField />
                </div>

                <CompressionField fileFormat={formValues.file_format} />
            </>
        )
    },
}
