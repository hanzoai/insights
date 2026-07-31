import { useActions, useValues } from 'kea'

import { IconX } from '@hanzo/icons'
import { Tag } from '@hanzo/elements'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { useRestrictedArea } from 'lib/components/RestrictedArea'
import { RestrictionScope } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { Button } from 'lib/elements/Button'
import { Dialog } from 'lib/elements/Dialog'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { createdAtColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { ProfilePicture } from 'lib/elements/ProfilePicture'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { organizationLogic } from 'scenes/organizationLogic'

import { OrganizationInviteType } from '~/types'

import { EmailUnavailableForInvitesBanner } from './InviteModal'
import { inviteLogic } from './inviteLogic'

function InviteLinkComponent(id: string, invite: OrganizationInviteType): JSX.Element {
    const url = new URL(`/signup/${id}`, document.baseURI).href
    return invite.is_expired ? (
        <b>Expired – please recreate</b>
    ) : (
        <CopyToClipboardInline data-attr="invite-link" description="invite link" iconPosition="start">
            {url}
        </CopyToClipboardInline>
    )
}

function makeActionsComponent(
    deleteInvite: (invite: OrganizationInviteType) => void
): (_: any, invite: any) => JSX.Element {
    return function ActionsComponent(_, invite: OrganizationInviteType): JSX.Element {
        return (
            <Button
                title="Cancel the invite"
                data-attr="invite-delete"
                icon={<IconX />}
                status="danger"
                onClick={() => {
                    invite.is_expired
                        ? deleteInvite(invite)
                        : Dialog.open({
                              title: 'Cancel invite',
                              description: `Do you want to cancel the invite for ${invite.target_email}?`,
                              primaryButton: {
                                  children: 'Yes, cancel invite',
                                  status: 'danger',
                                  onClick: () => deleteInvite(invite),
                              },
                              secondaryButton: {
                                  children: 'No, keep invite',
                              },
                          })
                }}
            />
        )
    }
}

export function InvitesTable(): JSX.Element {
    const { invites, invitesLoading } = useValues(inviteLogic)
    const { deleteInvite } = useActions(inviteLogic)

    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
        scope: RestrictionScope.Organization,
    })

    const columns: TableColumns<OrganizationInviteType> = [
        {
            key: 'user_profile_picture',
            render: function ProfilePictureRender(_, invite) {
                return <ProfilePicture user={{ first_name: invite.first_name, email: invite.target_email }} />
            },
            width: 32,
        },
        {
            title: 'Invitee',
            dataIndex: 'target_email',
            key: 'target_email',
            render: function TargetEmail(_, invite): JSX.Element | string {
                return invite.target_email ? (
                    <div className="ph-no-capture flex items-center">
                        {invite.target_email}
                        {invite.first_name ? ` (${invite.first_name})` : ''}
                    </div>
                ) : (
                    <i>no one</i>
                )
            },
            width: '20%',
        },
        {
            title: 'Level',
            dataIndex: 'level',
            render: function LevelRender(_, invite) {
                return (
                    <Tag data-attr="invite-membership-level">{OrganizationMembershipLevel[invite.level]}</Tag>
                )
            },
        },
        createdByColumn() as TableColumn<OrganizationInviteType, keyof OrganizationInviteType | undefined>,
        createdAtColumn() as TableColumn<OrganizationInviteType, keyof OrganizationInviteType | undefined>,
        {
            title: 'Invite Link',
            dataIndex: 'id',
            key: 'link',
            render: (_, invite) => InviteLinkComponent(invite.id, invite),
        },
        {
            title: '',
            key: 'actions',
            width: 24,
            render: !restrictionReason ? makeActionsComponent(deleteInvite) : undefined,
        },
    ]
    return (
        <Table
            dataSource={invites}
            columns={columns}
            rowKey="id"
            loading={invitesLoading}
            data-attr="invites-table"
            emptyState="There are no outstanding invitations. You can invite another team member above."
        />
    )
}

export function Invites(): JSX.Element {
    const { showInviteModal } = useActions(inviteLogic)
    const { preflight } = useValues(preflightLogic)
    const { currentOrganization } = useValues(organizationLogic)

    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
        scope: RestrictionScope.Organization,
    })

    const userCannotInvite = restrictionReason && !currentOrganization?.members_can_invite

    return (
        <div className="deprecated-space-y-4">
            {!preflight?.email_service_available && <EmailUnavailableForInvitesBanner />}
            <InvitesTable />
            <Button
                type="primary"
                onClick={showInviteModal}
                data-attr="invite-teammate-button"
                disabledReason={userCannotInvite && "You don't have permissions to invite others."}
            >
                Invite team member
            </Button>
        </div>
    )
}
