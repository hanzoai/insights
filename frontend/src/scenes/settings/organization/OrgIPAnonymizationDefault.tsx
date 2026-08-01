import { useActions, useValues } from 'kea'

import { Switch } from '@hanzo/elements'

import { useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'

import { organizationLogic } from '~/scenes/organizationLogic'

import { ORG_ADMIN_REQUIRED_TOOLTIP } from './organizationSettingsConstants'

export function OrgIPAnonymizationDefault(): JSX.Element {
    const { currentOrganization, currentOrganizationLoading } = useValues(organizationLogic)
    const { updateOrganization } = useActions(organizationLogic)

    const restrictionReason = useRestrictedArea({
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
    })

    return (
        <Switch
            onChange={(checked) => {
                updateOrganization({ default_anonymize_ips: checked })
            }}
            checked={!!currentOrganization?.default_anonymize_ips}
            disabledReason={restrictionReason ? ORG_ADMIN_REQUIRED_TOOLTIP : undefined}
            loading={currentOrganizationLoading}
            label="Discard client IP data by default for new projects"
            bordered
        />
    )
}
