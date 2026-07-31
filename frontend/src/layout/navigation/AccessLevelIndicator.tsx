import { Tag } from 'lib/elements/Tag/Tag'
import { membershipLevelToName } from 'lib/utils/permissioning'

import { OrganizationBasicType } from '~/types'

export function AccessLevelIndicator({ organization }: { organization: OrganizationBasicType }): JSX.Element {
    return (
        <Tag className="AccessLevelIndicator" title={`Your ${organization.name} organization access level`}>
            {(organization.membership_level ? membershipLevelToName.get(organization.membership_level) : null) || '?'}
        </Tag>
    )
}
