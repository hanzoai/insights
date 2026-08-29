import { useActions } from 'kea'

import { Button, ButtonPropsBase } from '@hanzo/elements'
import { IconPlusSmall } from '@hanzo/icons'

import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { inviteLogic } from 'scenes/settings/organization/inviteLogic'

export function InviteMembersButton({
    text = 'Invite members',
    center = false,
    type = 'tertiary',
    ...props
}: ButtonPropsBase & { text?: string }): JSX.Element {
    const { showInviteModal } = useActions(inviteLogic)
    const { reportInviteMembersButtonClicked } = useActions(eventUsageLogic)

    return (
        <Button
            icon={<IconPlusSmall />}
            onClick={() => {
                showInviteModal()
                reportInviteMembersButtonClicked()
            }}
            center={center}
            type={type}
            fullWidth
            data-attr="top-menu-invite-team-members"
            {...props}
        >
            {text}
        </Button>
    )
}
