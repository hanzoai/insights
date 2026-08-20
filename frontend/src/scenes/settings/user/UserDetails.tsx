import { useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input/Input'
import { userLogic } from 'scenes/userLogic'

export function UserDetails(): JSX.Element {
    const { userLoading, isUserDetailsSubmitting, userDetailsChanged } = useValues(userLogic)

    return (
        <Form
            logic={userLogic}
            formKey="userDetails"
            enableFormOnSubmit
            className="deprecated-space-y-4"
            style={{
                maxWidth: '28rem',
            }}
        >
            <Field name="first_name" label="First name">
                <Input
                    className="ph-ignore-input"
                    data-attr="settings-update-first-name"
                    placeholder="Jane"
                    disabled={userLoading}
                />
            </Field>

            <Field name="last_name" label="Last name">
                <Input
                    className="ph-ignore-input"
                    data-attr="settings-update-last-name"
                    placeholder="Doe"
                    disabled={userLoading}
                />
            </Field>

            <Field name="email" label="Email">
                <Input
                    className="ph-ignore-input"
                    data-attr="settings-update-email"
                    placeholder="email@yourcompany.com"
                    disabled={userLoading}
                />
            </Field>
            <Button
                type="primary"
                htmlType="submit"
                loading={isUserDetailsSubmitting}
                disabled={!userDetailsChanged}
                data-attr="user-details-submit-bottom"
            >
                Save name and email
            </Button>
        </Form>
    )
}
