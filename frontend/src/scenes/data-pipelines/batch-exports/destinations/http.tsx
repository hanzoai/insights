import { Input, Select } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import type { DestinationDefinition } from './types'

export const httpDefinition: DestinationDefinition = {
    type: 'HTTP',
    defaults: () => ({}),
    requiredFields: () => ['url', 'token'],
    eventTableOverrides: { teamIdHogql: 'team_id' },
    Fields: function HttpFields() {
        return (
            <>
                <Field name="url" label="Insights region">
                    <Select
                        options={[
                            { value: 'https://us.i.hanzo.ai/batch/', label: 'US' },
                            { value: 'https://eu.i.hanzo.ai/batch/', label: 'EU' },
                        ]}
                    />
                </Field>
                <Field name="token" label="Destination project token">
                    <Input placeholder="e.g. phc_12345..." />
                </Field>
            </>
        )
    },
}
