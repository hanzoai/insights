import { useActions, useValues } from 'kea'

import { Button, Divider } from '@hanzo/elements'
import { IconChevronLeft, IconChevronRight } from '@hanzo/icons'

import { BridgePage } from 'lib/components/BridgePage/BridgePage'
import { Link } from 'lib/elements/Link'
import { ProfilePicture } from 'lib/elements/ProfilePicture'
import { SpinnerOverlay } from 'lib/elements/Spinner/Spinner'
import { SupportModalButton } from 'scenes/authentication/shared/SupportModalButton'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { PrevalidatedInvite } from '~/types'

import { ErrorCodes, ErrorInterface, inviteSignupLogic } from './inviteSignupLogic'

export const scene: SceneExport = {
    component: InviteSignup,
    logic: inviteSignupLogic,
}

const UTM_TAGS = 'utm_medium=in-product&utm_campaign=invite-signup'

interface ErrorMessage {
    title: string
    detail: JSX.Element | string
    actions: JSX.Element
}

function HelperLinks(): JSX.Element {
    return (
        <div className="font-bold text-center">
            <Link to="/">App Home</Link>
            <span className="mx-2">|</span>
            <Link to={`https://hanzo.ai?${UTM_TAGS}&utm_message=invalid-invite`}>Insights Website</Link>
        </div>
    )
}

function BackToInsights(): JSX.Element {
    return (
        <Button type="secondary" icon={<IconChevronLeft />} center fullWidth to={urls.default()}>
            Go back to Insights
        </Button>
    )
}

function ErrorView({ error }: { error: ErrorInterface }): JSX.Element {
    const { user } = useValues(userLogic)

    const ErrorMessages: Record<ErrorCodes, ErrorMessage> = {
        [ErrorCodes.InvalidInvite]: {
            title: 'Oops! This invite link is invalid or has expired',
            detail: (
                <>
                    {error.detail} If you believe this is a mistake, please contact whoever created this invite and{' '}
                    <b>ask them for a new invite</b>.
                </>
            ),
            actions: user ? <BackToInsights /> : <HelperLinks />,
        },
        [ErrorCodes.UserAlreadyMember]: {
            title: "You're already a member of this organization",
            detail: (
                <>
                    {error.detail || 'You already are a member of this organization.'} You can't accept this invitation
                    because your account ({user?.email}) already belongs to it. If you meant to join a different
                    organization, ask the inviter to send a new invite to a different email address.
                </>
            ),
            actions: user ? <BackToInsights /> : <HelperLinks />,
        },
        [ErrorCodes.InvalidRecipient]: {
            title: "Oops! This invite link can't be used",
            detail: (
                <>
                    <div>{error.detail}</div>
                    <div className="mt-4">
                        You need to sign in with the email address the invite was sent to, or ask the organization admin
                        to send a{' '}
                        <b>new invite to {user ? `the email address on your account, ${user.email}` : 'your'}</b>{' '}
                        address.
                    </div>
                </>
            ),
            actions: user ? <BackToInsights /> : <HelperLinks />,
        },
        [ErrorCodes.Unknown]: {
            title: 'Oops! We could not validate this invite link',
            detail: `${
                error.detail || ''
            } There was an issue with your invite link, please try again in a few seconds. If the problem persists, contact us.`,
            actions: user ? <BackToInsights /> : <HelperLinks />,
        },
    }

    return (
        <BridgePage view="signup-error" footer={<SupportModalButton />}>
            <h2>{ErrorMessages[error.code].title}</h2>
            <div className="error-message">{ErrorMessages[error.code].detail}</div>
            <Divider dashed className="my-4" />
            <div>{ErrorMessages[error.code].actions}</div>
        </BridgePage>
    )
}

function AcceptInvite({ invite }: { invite: PrevalidatedInvite }): JSX.Element {
    const { user } = useValues(userLogic)
    const { acceptInvite } = useActions(inviteSignupLogic)
    const { acceptedInviteLoading, acceptedInvite } = useValues(inviteSignupLogic)

    return (
        <BridgePage view="accept-invite" footer={<SupportModalButton name={user?.first_name} email={user?.email} />}>
            <div className="deprecated-space-y-2">
                <h2>You have been invited to join {invite.organization_name}</h2>
                <div>
                    You will accept the invite under your <b>existing Insights account</b>:
                </div>
                {user && (
                    <div
                        className="border rounded-lg border-dashed flex items-center gap-2 px-2 py-1"
                        data-attr="accept-invite-whoami"
                    >
                        <ProfilePicture user={user} />
                        <div>
                            <div className="font-bold">{user.first_name}</div>
                            <div>{user.email}</div>
                        </div>
                    </div>
                )}
                <div>
                    Accepting will add <b>{invite.organization_name}</b> to your account. You can switch between
                    organizations at any time using the organization selector in the top-left of the navigation bar.
                </div>
                <div>
                    {!acceptedInvite ? (
                        <>
                            <Button
                                type="primary"
                                center
                                fullWidth
                                onClick={acceptInvite}
                                loading={acceptedInviteLoading}
                            >
                                Accept invite
                            </Button>
                            <div className="mt-2">
                                <Button type="secondary" center fullWidth icon={<IconChevronLeft />} to="/">
                                    Go back to Insights
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Button
                            type="secondary"
                            center
                            fullWidth
                            sideIcon={<IconChevronRight />}
                            onClick={() => (window.location.href = '/')}
                        >
                            Go to Insights
                        </Button>
                    )}
                </div>
            </div>
        </BridgePage>
    )
}

export function InviteSignup(): JSX.Element {
    const { invite, error } = useValues(inviteSignupLogic)
    const { user } = useValues(userLogic)

    if (invite && user) {
        return <AcceptInvite invite={invite} />
    }
    if (error) {
        return <ErrorView error={error} />
    }
    // Still prevalidating, or a valid invite for a signed-out visitor already on its way to the
    // identity provider, which needs the invite in its session to admit the new member.
    return <SpinnerOverlay sceneLevel />
}

export default InviteSignup
