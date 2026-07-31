/*
Scene to enter a new password from a received reset link
*/
import { useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input } from '@hanzo/elements'

import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import PasswordStrength from 'lib/components/PasswordStrength'
import { Banner } from 'lib/elements/Banner'
import { Field } from 'lib/elements/Field'
import { Spinner } from 'lib/elements/Spinner/Spinner'
import { IconErrorOutline } from 'lib/elements/icons'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { passwordResetLogic } from './passwordResetLogic'

export const scene: SceneExport = {
    component: PasswordResetComplete,
    logic: passwordResetLogic,
}

export function PasswordResetComplete(): JSX.Element {
    const { validatedResetToken, validatedResetTokenLoading } = useValues(passwordResetLogic)
    const invalidLink = !validatedResetTokenLoading && !validatedResetToken?.success
    return (
        <BridgePage view="password-reset-complete">
            {invalidLink && (
                <div className="text-center mb-2">
                    <IconErrorOutline className="text-secondary text-4xl" />
                </div>
            )}
            <h2>{invalidLink ? 'Unable to reset' : 'Set a new password'}</h2>
            {validatedResetTokenLoading ? (
                <Spinner />
            ) : !validatedResetToken?.token ? (
                <ResetInvalid />
            ) : (
                <NewPasswordForm />
            )}
        </BridgePage>
    )
}

function NewPasswordForm(): JSX.Element {
    const { validatedPassword, isPasswordResetSubmitting, passwordResetManualErrors } = useValues(passwordResetLogic)

    return (
        <>
            <div className="text-center mb-4">Please enter a new password for your account.</div>
            {!isPasswordResetSubmitting && passwordResetManualErrors.generic && (
                <Banner type="error">
                    {passwordResetManualErrors.generic?.detail ||
                        'Could not complete your password reset request. Please try again.'}
                </Banner>
            )}
            <Form
                logic={passwordResetLogic}
                formKey="passwordReset"
                className="deprecated-space-y-4"
                enableFormOnSubmit
            >
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
                        data-attr="password"
                    />
                </Field>

                <Field name="passwordConfirm" label="Confirm Password">
                    <Input
                        autoComplete="new-password"
                        type="password"
                        className="ph-ignore-input"
                        placeholder="••••••••••"
                        data-attr="password-confirm"
                    />
                </Field>

                <Button
                    fullWidth
                    type="primary"
                    center
                    htmlType="submit"
                    data-attr="password-reset-complete"
                    loading={isPasswordResetSubmitting}
                >
                    Change my password
                </Button>
            </Form>
        </>
    )
}

function ResetInvalid(): JSX.Element {
    return (
        <div className="text-center">
            The provided link is <b>invalid or has expired</b>. Please request a new link.
            <div className="mt-4">
                <Button fullWidth type="primary" center data-attr="back-to-login" to={urls.passwordReset()}>
                    Request new link
                </Button>
            </div>
        </div>
    )
}
