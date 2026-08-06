import './Setup2FA.scss'

import { useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input } from '@hanzo/elements'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { Banner } from 'lib/elements/Banner'
import { Field } from 'lib/elements/Field'

import { twoFactorLogic } from './twoFactorLogic'

export function TwoFactorSetup({ onSuccess }: { onSuccess: () => void }): JSX.Element | null {
    const { startSetupLoading, startSetup, generalError } = useValues(twoFactorLogic({ onSuccess }))
    if (startSetupLoading) {
        return null
    }

    return (
        <>
            <Form
                logic={twoFactorLogic}
                formKey="token"
                enableFormOnSubmit
                className="flex flex-col deprecated-space-y-4"
            >
                <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded">
                        <img
                            src="/account/two_factor/qrcode/"
                            className="Setup2FA__image"
                            alt="QR code for two-factor authentication setup"
                        />
                    </div>

                    {/* Secret key for manual entry */}
                    {startSetup?.secret && (
                        <div className="ph-no-capture mt-4 p-3 bg-secondary rounded text-center w-full max-w-md">
                            <p className="text-default">
                                If you can't scan the QR code, you can use the secret key below to manually set up your
                                authenticator app.
                            </p>
                            <CopyToClipboardInline description="2FA secret key" selectable iconSize="xsmall">
                                {startSetup.secret}
                            </CopyToClipboardInline>
                        </div>
                    )}
                </div>
                {generalError && <Banner type="error">{generalError.detail}</Banner>}
                <Field name="token" label="Authenticator token">
                    <Input
                        className="ph-ignore-input"
                        autoFocus
                        data-attr="token"
                        placeholder="123456"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                    />
                </Field>
                <Button htmlType="submit" data-attr="2fa-setup" fullWidth type="primary" center loading={false}>
                    Submit
                </Button>
            </Form>
        </>
    )
}
