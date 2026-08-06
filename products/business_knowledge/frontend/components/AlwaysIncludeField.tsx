import { Checkbox } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

export function AlwaysIncludeField(): JSX.Element {
    return (
        <Field
            name="always_include"
            info="When on, this source's content is injected into every reply as general guidance (tone, policies, company direction) — not just when it matches the question. Still gated by the same safety checks as search."
        >
            {({ value, onChange }) => (
                <Checkbox
                    checked={!!value}
                    onChange={onChange}
                    label="Always include in replies"
                    bordered
                    fullWidth
                />
            )}
        </Field>
    )
}
