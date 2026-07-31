import { useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input } from '@hanzo/elements'

import PasswordStrength from 'lib/components/PasswordStrength'
import { Field } from 'lib/elements/Field'
import { userLogic } from 'scenes/userLogic'

import { changePasswordLogic } from './changePasswordLogic'

export function ChangePasswordTitle(): JSX.Element {
    const { user } = useValues(userLogic)
    const hasPassword = user?.has_password ?? false
    return <>{hasPassword ? 'Change password' : 'Set password'}</>
}

export function ChangePassword(): JSX.Element {
    const { validatedPassword, isChangePasswordSubmitting, user } = useValues(changePasswordLogic)
    const hasPassword = user?.has_password ?? false

    return (
        <Form
            logic={changePasswordLogic}
            formKey="changePassword"
            enableFormOnSubmit
            className="deprecated-space-y-4 max-w-160"
        >
            {hasPassword && (
                <Field name="current_password" label="Current Password">
                    <Input
                        autoComplete="current-password"
                        type="password"
                        className="ph-ignore-input"
                        placeholder="••••••••••"
                    />
                </Field>
            )}

            <Field
                name="password"
                label={
                    <div className="flex flex-1 items-center justify-between">
                        <span>Password</span>
                        <PasswordStrength validatedPassword={validatedPassword} />
                    </div>
                }
            >
                <Input
                    autoComplete="new-password"
                    type="password"
                    className="ph-ignore-input"
                    placeholder="••••••••••"
                />
            </Field>

            {!hasPassword && (
                <Field name="confirm_password" label="Confirm Password">
                    <Input
                        autoComplete="new-password"
                        type="password"
                        className="ph-ignore-input"
                        placeholder="••••••••••"
                    />
                </Field>
            )}

            <Button type="primary" htmlType="submit" loading={isChangePasswordSubmitting}>
                {hasPassword ? 'Change password' : 'Set password'}
            </Button>
        </Form>
    )
}
