import { IconInfo } from '@hanzo/icons'
import { Banner, Checkbox, Input, Tooltip } from '@hanzo/elements'

import { IntegrationChoice } from 'lib/components/CyclotronJob/integrations/IntegrationChoice'
import { Field } from 'lib/elements/Field'

import type { DestinationDefinition } from './types'

export const postgresDefinition: DestinationDefinition = {
    type: 'Postgres',
    // New Postgres exports must store credentials in a linked Integration. Exports created before
    // integrations existed keep their inline credentials (grandfathered), detected by integration_id.
    usesIntegration: true,
    defaults: () => ({}),
    requiredFields: ({ isNew, formValues }) => {
        if (isNew || formValues.integration_id) {
            // New exports must pick an integration; existing integration-backed exports keep theirs.
            return [...(isNew ? ['integration_id'] : []), 'database', 'schema', 'table_name']
        }
        // Legacy inline-credential exports keep their original fields when edited.
        return ['host', 'port', 'database', 'schema', 'table_name']
    },
    eventTableOverrides: { teamIdHogql: 'toInt32(team_id)' },
    Fields: function PostgresFields({ isNew, formValues }) {
        const useIntegration = isNew || !!formValues.integration_id

        return (
            <>
                {useIntegration ? (
                    <Field name="integration_id" label="Connection">
                        {({ value, onChange }) => (
                            <IntegrationChoice integration="postgresql" value={value} onChange={onChange} />
                        )}
                    </Field>
                ) : (
                    <>
                        <Banner type="warning">
                            Insights is moving PostgreSQL batch exports to integration-based credentials. This export
                            will be migrated automatically — no action required.
                        </Banner>

                        <Field name="user" label="User">
                            <Input placeholder={isNew ? 'my-user' : 'Leave unchanged'} />
                        </Field>

                        <Field name="password" label="Password">
                            <Input placeholder={isNew ? 'my-password' : 'Leave unchanged'} type="password" />
                        </Field>

                        <Field name="host" label="Host">
                            <Input placeholder="my-host" />
                        </Field>

                        <Field name="port" label="Port">
                            <Input placeholder="5432" type="number" min="0" max="65535" />
                        </Field>
                    </>
                )}

                <Field name="database" label="Database">
                    <Input placeholder="my-database" />
                </Field>

                <Field name="schema" label="Schema">
                    <Input placeholder="public" />
                </Field>

                <Field name="table_name" label="Table name">
                    <Input placeholder="events" />
                </Field>

                {!useIntegration && (
                    <Field name="has_self_signed_cert">
                        {({ value, onChange }) => (
                            <Checkbox
                                bordered
                                label={
                                    <span className="flex gap-2 items-center">
                                        Does your Postgres instance have a self-signed SSL certificate?
                                        <Tooltip title="In most cases, Heroku and RDS users should check this.">
                                            <IconInfo className="text-lg text-secondary" />
                                        </Tooltip>
                                    </span>
                                }
                                checked={!!value}
                                onChange={onChange}
                            />
                        )}
                    </Field>
                )}
            </>
        )
    },
}
