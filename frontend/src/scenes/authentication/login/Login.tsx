import { useValues } from 'kea'
import { router } from 'kea-router'

import { Button } from '@hanzo/elements'

import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import { Banner } from 'lib/elements/Banner'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { ERROR_MESSAGES } from '../shared/loginErrorMessages'
import { SupportModalButton } from '../shared/SupportModalButton'

export const scene: SceneExport = {
    component: Login,
}

/**
 * `/login` is the identity provider handshake: the server sends the browser straight on to it. This
 * scene renders only when the handshake comes back with `error_code`, so the message has somewhere
 * to land instead of bouncing into a retry loop.
 */
export function Login(): JSX.Element {
    const { searchParams } = useValues(router)

    return (
        <BridgePage view="login" footer={<SupportModalButton />}>
            <div className="deprecated-space-y-4">
                <h2>Could not sign you in</h2>
                <Banner type="error">
                    {ERROR_MESSAGES[searchParams.error_code] ?? 'Sign in failed. Please try again.'}
                </Banner>
                <Button
                    type="primary"
                    fullWidth
                    center
                    size="large"
                    to={urls.login()}
                    disableClientSideRouting
                    data-attr="login-retry"
                >
                    Try again
                </Button>
            </div>
        </BridgePage>
    )
}

export default Login
