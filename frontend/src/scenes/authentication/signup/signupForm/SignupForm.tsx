import { useActions, useValues } from 'kea'
import { useEffect, useState } from 'react'

import { IconArrowLeft } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { supportLogic } from 'lib/components/Support/supportLogic'
import { Banner } from 'lib/elements/Banner'
import { Link } from 'lib/elements/Link'
import { SpinnerOverlay } from 'lib/elements/Spinner/Spinner'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { SceneExport } from 'scenes/sceneTypes'

import { userLogic } from '../../../userLogic'
import { SignupPanelAuth } from './panels/SignupPanelAuth'
import { SignupPanelEmail } from './panels/SignupPanelEmail'
import { SignupPanelOnboarding } from './panels/SignupPanelOnboarding'
import { signupLogic } from './signupLogic'

export const scene: SceneExport = {
    component: SignupForm,
    logic: signupLogic,
}

export function SignupForm(): JSX.Element | null {
    const { user } = useValues(userLogic)
    const {
        isSignupPanelOnboardingSubmitting,
        signupPanelOnboardingManualErrors,
        signupPanelEmail,
        panel,
        panelTitle,
    } = useValues(signupLogic)
    const { setPanel } = useActions(signupLogic)
    const { preflight } = useValues(preflightLogic)
    const { openSupportForm } = useActions(supportLogic)
    const [showSpinner, setShowSpinner] = useState(true)

    const supportLink = preflight?.cloud ? (
        <>
            {' '}
            <Link
                data-attr="login-error-contact-support"
                onClick={(e) => {
                    e.preventDefault()
                    openSupportForm({ kind: 'support', target_area: 'login', email: signupPanelEmail.email })
                }}
            >
                Contact us
            </Link>{' '}
            to resolve this.
        </>
    ) : null

    useEffect(() => {
        setShowSpinner(true)
        const t = setTimeout(() => {
            setShowSpinner(false)
        }, 500)
        return () => clearTimeout(t)
    }, [panel])

    return !user ? (
        <div className="deprecated-space-y-2">
            {panelTitle ? <h2>{panelTitle}</h2> : null}
            {!isSignupPanelOnboardingSubmitting && signupPanelOnboardingManualErrors?.generic && (
                <Banner type="error">
                    {signupPanelOnboardingManualErrors.generic?.detail ||
                        'Could not complete your signup. Please try again.'}
                    {supportLink}
                </Banner>
            )}
            {panel === 0 ? (
                <SignupPanelEmail />
            ) : panel === 1 ? (
                <>
                    <SignupPanelAuth />
                    <div className="flex justify-center">
                        <Button
                            icon={<IconArrowLeft />}
                            onClick={() => setPanel(0)}
                            size="small"
                            center
                            data-attr="signup-go-back"
                        >
                            or go back
                        </Button>
                    </div>
                </>
            ) : (
                <>
                    <SignupPanelOnboarding />
                    <div className="flex justify-center">
                        <Button
                            icon={<IconArrowLeft />}
                            onClick={() => setPanel(panel - 1)}
                            size="small"
                            center
                            data-attr="signup-go-back"
                        >
                            or go back
                        </Button>
                    </div>
                </>
            )}
            {showSpinner ? <SpinnerOverlay sceneLevel /> : null}
        </div>
    ) : null
}
