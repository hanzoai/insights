import { useValues } from 'kea'

import { Button } from 'lib/elements/Button'
import { SpinnerOverlay } from 'lib/elements/Spinner/Spinner'

import { oauthLogic } from './oauthLogic'

/**
 * Rendered at /oauth/callback. The code→token exchange is kicked off by oauthLogic's
 * urlToAction; this screen only reflects progress and surfaces any error.
 */
export function OAuthCallback(): JSX.Element {
    const { loginError } = useValues(oauthLogic)

    if (loginError) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
                <div className="flex w-full max-w-md flex-col gap-3 rounded-lg border bg-surface-primary p-6 text-center shadow-sm">
                    <h2 className="m-0 text-lg font-bold">Sign-in failed</h2>
                    <p className="m-0 text-sm text-secondary">{loginError}</p>
                    <Button type="primary" center fullWidth to="/login">
                        Back to sign in
                    </Button>
                </div>
            </div>
        )
    }

    return <SpinnerOverlay sceneLevel visible />
}
