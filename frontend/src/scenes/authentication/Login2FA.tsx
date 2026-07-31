import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Divider, Input } from '@hanzo/elements'

import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import passkeyLogo from 'lib/components/SocialLoginButton/passkey.svg'
import { Banner } from 'lib/elements/Banner'
import { Field } from 'lib/elements/Field'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { SceneExport } from 'scenes/sceneTypes'

import { login2FALogic } from './login2FALogic'

export function Login2FA(): JSX.Element {
    const { isTwofactortokenSubmitting, generalError, passkey2FALoading, passkeysAvailable, totpAvailable } =
        useValues(login2FALogic)
    const { beginPasskey2FA } = useActions(login2FALogic)
    const { preflight } = useValues(preflightLogic)

    return (
        <BridgePage
            view="login"
            mascot
            message={
                <>
                    Welcome to
                    <br /> Insights{preflight?.cloud ? ' Cloud' : ''}!
                </>
            }
        >
            <div className="deprecated-space-y-2">
                <h2>Two-Factor Authentication</h2>
                <p>Enter a token from your authenticator app, use your passkey, or enter a backup code.</p>

                {passkeysAvailable && (
                    <>
                        <Button
                            type="primary"
                            htmlType="button"
                            onClick={() => beginPasskey2FA()}
                            loading={passkey2FALoading}
                            fullWidth
                            center
                            size="large"
                            icon={<img src={passkeyLogo} alt="Passkey" className="object-contain w-6 h-6" />}
                        >
                            Use passkey
                        </Button>
                        {totpAvailable && <Divider className="my-4" label="Or" />}
                    </>
                )}

                {totpAvailable && (
                    <Form
                        logic={login2FALogic}
                        formKey="twofactortoken"
                        enableFormOnSubmit
                        className="deprecated-space-y-4"
                    >
                        {generalError && <Banner type="error">{generalError.detail}</Banner>}
                        <Field name="token" label="Authenticator token">
                            <Input
                                className="ph-ignore-input"
                                autoFocus={!passkeysAvailable}
                                data-attr="token"
                                placeholder="123456"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                            />
                        </Field>
                        <Button
                            type="primary"
                            status="alt"
                            htmlType="submit"
                            data-attr="2fa-login"
                            fullWidth
                            center
                            loading={isTwofactortokenSubmitting}
                            size="large"
                        >
                            Login
                        </Button>
                    </Form>
                )}

                {!passkeysAvailable && !totpAvailable && (
                    <Banner type="error">
                        No 2FA methods available. Please contact support if you believe this is an error.
                    </Banner>
                )}
            </div>
        </BridgePage>
    )
}

export const scene: SceneExport = {
    component: Login2FA,
    logic: login2FALogic,
}
