import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input/Input'
import { userLogic } from 'scenes/userLogic'

export function UserDetails(): JSX.Element {
    const { userLoading, isUserDetailsSubmitting, userDetailsChanged, user } = useValues(userLogic)
    const { cancelEmailChangeRequest } = useActions(userLogic)

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
            {user?.pending_email && (
                <div className="flex flex-row gap-2">
                    <div className="text-danger text-xs font-medium mt-1.25">
                        Pending verification for {user.pending_email}
                    </div>
                    <Button
                        type="tertiary"
                        size="xsmall"
                        data-attr="cancel-email-change-request-button"
                        onClick={cancelEmailChangeRequest}
                    >
                        Cancel change
                    </Button>
                </div>
            )}

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
