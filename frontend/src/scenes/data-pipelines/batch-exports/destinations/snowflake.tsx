import { Banner, Input, Select, TextArea } from '@hanzo/elements'

import { IntegrationChoice } from 'lib/components/CyclotronJob/integrations/IntegrationChoice'
import { Field } from 'lib/elements/Field'

import type { DestinationDefinition } from './types'

// New Snowflake exports must store credentials in a linked Integration. Exports created before
// integrations existed keep their inline credentials (grandfathered), detected by integration_id.
export const snowflakeDefinition: DestinationDefinition = {
    type: 'Snowflake',
    usesIntegration: true,
    defaults: () => ({}),
    requiredFields: ({ isNew, formValues }) => {
        if (isNew || formValues.integration_id) {
            // New exports must pick an integration; existing integration-backed exports keep theirs.
            return [...(isNew ? ['integration_id'] : []), 'database', 'warehouse', 'schema', 'table_name']
        }
        // Grandfathered inline-credential exports keep their original fields when edited.
        return ['account', 'database', 'warehouse', 'schema', 'table_name']
    },
    // The credential keys remain allowlisted for grandfathered inline exports.
    // TODO: clean up once fully migrated to integration-based credentials
    configKeys: [
        'database',
        'warehouse',
        'schema',
        'table_name',
        'role',
        'account',
        'user',
        'authentication_type',
        'password',
        'private_key',
        'private_key_passphrase',
    ],
    eventTableOverrides: {
        setName: 'people_set',
        setOnceName: 'people_set_once',
    },
    eventTableExtraFields: {
        snowflake_ingested_timestamp: {
            name: 'snowflake_ingested_timestamp',
            insightsql_value: 'NOW64()',
            type: 'datetime',
            schema_valid: true,
        },
    },
    Fields: function SnowflakeFields({ isNew, formValues }) {
        const useIntegration = isNew || !!formValues.integration_id

        return (
            <>
                {useIntegration ? (
                    <Field name="integration_id" label="Connection">
                        {({ value, onChange }) => (
                            <IntegrationChoice integration="snowflake" value={value} onChange={onChange} />
                        )}
                    </Field>
                ) : (
                    <>
                        <Banner type="warning">
                            Snowflake batch exports are moving to integration-based credentials. This export will be
                            migrated automatically — no action required.
                        </Banner>

                        <Field name="account" label="Account">
                            <Input placeholder="my-account" />
                        </Field>

                        <Field name="user" label="User">
                            <Input placeholder={isNew ? 'my-user' : 'Leave unchanged'} />
                        </Field>

                        <Field name="authentication_type" label="Authentication type" className="flex-1">
                            <Select
                                options={[
                                    { value: 'password', label: 'Password' },
                                    { value: 'keypair', label: 'Key pair' },
                                ]}
                            />
                        </Field>

                        {formValues.authentication_type != 'keypair' && (
                            <Field name="password" label="Password">
                                <Input placeholder={isNew ? 'my-password' : 'Leave unchanged'} type="password" />
                            </Field>
                        )}

                        {formValues.authentication_type == 'keypair' && (
                            <>
                                <Field name="private_key" label="Private key">
                                    <TextArea
                                        className="ph-ignore-input"
                                        placeholder={isNew ? 'my-private-key' : 'Leave unchanged'}
                                        minRows={4}
                                    />
                                </Field>

                                <Field name="private_key_passphrase" label="Private key passphrase">
                                    <Input placeholder={isNew ? 'my-passphrase' : 'Leave unchanged'} />
                                </Field>
                            </>
                        )}
                    </>
                )}

                <Field name="database" label="Database">
                    <Input placeholder="my-database" />
                </Field>

                <Field name="schema" label="Schema">
                    <Input placeholder="my-schema" />
                </Field>

                <Field name="table_name" label="Table name">
                    <Input placeholder="events" />
                </Field>

                <Field name="warehouse" label="Warehouse">
                    <Input placeholder="my-warehouse" />
                </Field>

                <Field name="role" label="Role" showOptional>
                    <Input placeholder="my-role" />
                </Field>
            </>
        )
    },
}
