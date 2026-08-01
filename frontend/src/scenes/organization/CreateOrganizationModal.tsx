import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { IconLetter } from '@hanzo/icons'
import { Button, Divider, Input, Modal, Link } from '@hanzo/elements'

import { pendingInvitesLogic } from 'lib/components/Account/pendingInvitesLogic'
import { Banner } from 'lib/elements/Banner'
import { Field } from 'lib/elements/Field'
import { organizationLogic } from 'scenes/organizationLogic'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

export function CreateOrganizationModal({
    isVisible,
    onClose,
    inline = false,
}: {
    isVisible: boolean
    onClose?: () => void
    inline?: boolean
}): JSX.Element {
    const { createOrganization } = useActions(organizationLogic)
    const { currentOrganizationLoading, isCurrentOrganizationUnavailable } = useValues(organizationLogic)
    const { pendingInvites } = useValues(pendingInvitesLogic)
    const { user } = useValues(userLogic)
    const { logout } = useActions(userLogic)
    const [name, setName] = useState<string>('')

    const hasPendingInvites = pendingInvites.length > 0
    // Only stuck users see this: no organization membership and no invite waiting. Someone deliberately creating an
    // additional org from the account menu still has a current org, so this guidance stays hidden for them.
    const showNoInviteHelp = !hasPendingInvites && isCurrentOrganizationUnavailable

    const closeModal: () => void = () => {
        if (onClose) {
            onClose()
            if (name) {
                setName('')
            }
        }
    }
    const handleSubmit = (): void => {
        createOrganization(name)
    }

    return (
        <Modal
            width={440}
            title="Create an organization"
            description={
                <p>
                    Organizations gather people building together.
                    <br />
                    <Link to="https://hanzo.ai/docs/user-guides/organizations-and-projects" target="_blank">
                        Learn more in Insights docs.
                    </Link>
                </p>
            }
            footer={
                <>
                    {onClose && (
                        <Button type="secondary" onClick={() => onClose()}>
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="primary"
                        onClick={() => handleSubmit()}
                        disabledReason={!name ? 'Think of a name!' : null}
                        loading={currentOrganizationLoading}
                        data-attr="create-organization-ok"
                    >
                        Create organization
                    </Button>
                </>
            }
            onClose={closeModal}
            isOpen={isVisible}
            inline={inline}
        >
            {showNoInviteHelp && (
                <Banner type="info" className="mb-4">
                    <p className="mb-2">
                        You're not part of any organization yet. If your team already uses Insights, ask an admin there
                        to send you an invite.
                    </p>
                    <p className="mb-0">
                        You're signed in as <strong>{user?.email}</strong>. If your invite went to a different address,{' '}
                        <Link onClick={() => logout()}>log out</Link> and sign back in with that email. Otherwise,
                        create your own organization below.
                    </p>
                </Banner>
            )}
            {hasPendingInvites && (
                <>
                    <Field.Pure label="You've been invited to join" className="mb-2">
                        <div className="flex flex-col gap-2">
                            {pendingInvites.map((invite) => (
                                <div
                                    key={invite.id}
                                    className="flex items-center gap-2 rounded border border-primary p-2"
                                >
                                    <IconLetter className="text-warning text-lg shrink-0" />
                                    <span className="flex-1 truncate font-medium">{invite.organization_name}</span>
                                    <Button
                                        type="primary"
                                        size="small"
                                        to={urls.inviteSignup(invite.id)}
                                        data-attr={`accept-pending-invite-${invite.id}`}
                                    >
                                        Accept
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </Field.Pure>
                    <Divider className="my-4" />
                    <p className="text-secondary mb-2">Or create your own organization:</p>
                </>
            )}
            <Field.Pure label="Organization name">
                <Input
                    placeholder="Acme Inc."
                    maxLength={64}
                    autoFocus={!hasPendingInvites}
                    value={name}
                    onChange={(value) => setName(value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !currentOrganizationLoading) {
                            handleSubmit()
                        }
                    }}
                    data-attr="organization-name-input"
                />
            </Field.Pure>
        </Modal>
    )
}
