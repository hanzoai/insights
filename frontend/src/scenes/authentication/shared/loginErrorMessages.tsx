import { Link } from 'lib/elements/Link'

// Copy for the `error_code` a failed handshake redirects back to `/login` with, also used by the
// exporter's share-link screen.
export const ERROR_MESSAGES: Record<string, string | JSX.Element> = {
    no_new_organizations:
        'Your email address is not associated with an account. Please ask your administrator for an invite.',
    invalid_sso_provider: (
        <>
            The SSO provider you specified is invalid. Visit{' '}
            <Link to="https://hanzo.ai/sso" target="_blank">
                https://hanzo.ai/sso
            </Link>{' '}
            for details.
        </>
    ),
    improperly_configured_sso: (
        <>
            Cannot login with SSO provider because the provider is not configured, or your instance does not have the
            required license. Please visit{' '}
            <Link to="https://hanzo.ai/sso" target="_blank">
                https://hanzo.ai/sso
            </Link>{' '}
            for details.
        </>
    ),
    jit_not_enabled:
        'We could not find an account with your email address and your organization does not support automatic enrollment. Please contact your administrator for an invite.',
    sso_enforced: "Please log in with your organization's required SSO method.",
    verified_domain_required:
        "Your organization only allows members with a verified email domain. Contact your organization's admin for access.",
    oauth_cancelled: "Sign in was cancelled. Please try again when you're ready.",
    invalid_invite:
        'This invite link is no longer valid. It may have expired or been revoked. Please ask your administrator for a new invite.',
    social_login_failure: 'Login failed. Please try again or contact your administrator.',
}
