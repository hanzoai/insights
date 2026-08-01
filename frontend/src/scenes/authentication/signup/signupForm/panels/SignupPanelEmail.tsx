import { useValues } from 'kea'
import { Form } from 'kea-forms'
import { useEffect, useRef } from 'react'

import { Banner, Button, Input } from '@hanzo/elements'

import { SocialLoginButtons } from 'lib/components/SocialLoginButton/SocialLoginButton'
import { Field } from 'lib/elements/Field'
import { Link } from 'lib/elements/Link'
import RegionSelect from 'scenes/authentication/shared/RegionSelect'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

import { JoinExistingOrgLink } from '../JoinExistingOrgLink'
import { signupLogic } from '../signupLogic'
import { PendingInviteBanner } from './PendingInviteBanner'

export function SignupPanelEmail(): JSX.Element | null {
    const { preflight, socialAuthAvailable } = useValues(preflightLogic)
    const {
        isSignupPanelEmailSubmitting,
        loginUrl,
        emailCaseNotice,
        passkeyError,
        error,
        pendingInvite,
        signupPanelEmail,
    } = useValues(signupLogic)
    const emailInputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        emailInputRef?.current?.focus()
    }, [])

    if (pendingInvite) {
        return <PendingInviteBanner invite={pendingInvite} email={signupPanelEmail.email} />
    }

    return (
        <div className="deprecated-space-y-4 Signup__panel__email">
            <RegionSelect />
            {passkeyError && (
                <Banner type="error" className="mb-4">
                    {passkeyError}
                </Banner>
            )}
            {!preflight?.demo && socialAuthAvailable && (
                <>
                    <SocialLoginButtons caption="Sign up with" bottomDivider className="mt-6" />
                    <p className="text-secondary text-center mb-0">Or use email</p>
                </>
            )}
            <Form logic={signupLogic} formKey="signupPanelEmail" className="deprecated-space-y-4" enableFormOnSubmit>
                <Field
                    name="email"
                    label="Email"
                    help={emailCaseNotice && <span className="text-warning">{emailCaseNotice}</span>}
                >
                    <Input
                        className="ph-ignore-input"
                        autoFocus
                        data-attr="signup-email"
                        placeholder="email@yourcompany.com"
                        type="email"
                        inputRef={emailInputRef}
                    />
                </Field>
                {error && <Banner type="error">{error}</Banner>}
                <Button
                    fullWidth
                    type="primary"
                    status="alt"
                    center
                    htmlType="submit"
                    data-attr="signup-start"
                    loading={isSignupPanelEmailSubmitting}
                    size="large"
                >
                    Continue
                </Button>
            </Form>
            {!preflight?.demo && (preflight?.cloud || preflight?.initiated) && (
                <div className="text-center mt-4">
                    Already have an account?{' '}
                    <Link to={loginUrl} data-attr="signup-login-link" className="font-bold">
                        Log in
                    </Link>
                </div>
            )}
            {!preflight?.demo && <JoinExistingOrgLink />}
        </div>
    )
}
