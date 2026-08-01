import { IconCheck, IconShieldLock, IconX } from '@hanzo/icons'
import { Badge, Tag } from '@hanzo/elements'

import { MCPToolApprovalStateEnumApi, UserBasicApi } from '../generated/api.schemas'

/** ProfilePicture wants a UserBasicType-ish shape; the generated UserBasicApi's
 * `mascot_config` type isn't assignable, so pass the fields it actually reads. */
export function toProfileUser(user: UserBasicApi): { first_name?: string; last_name?: string; email: string } {
    return { first_name: user.first_name, last_name: user.last_name, email: user.email }
}

export const POLICY_LABELS: Record<MCPToolApprovalStateEnumApi, string> = {
    approved: 'Always Allow',
    needs_approval: 'Needs Approval',
    do_not_use: 'Blocked',
}

export const POLICY_HINTS: Record<MCPToolApprovalStateEnumApi, string> = {
    approved: 'Runs without asking',
    needs_approval: 'Waits for a human to approve',
    do_not_use: 'Never allowed',
}

export const POLICY_OPTIONS: { value: MCPToolApprovalStateEnumApi; label: string; icon: JSX.Element }[] = [
    { value: 'approved', label: 'Always Allow', icon: <IconCheck /> },
    { value: 'needs_approval', label: 'Needs Approval', icon: <IconShieldLock /> },
    { value: 'do_not_use', label: 'Blocked', icon: <IconX /> },
]

/** Small colored summary of how many tools sit in each policy state. */
export function PolicySummary({ counts }: { counts: Record<MCPToolApprovalStateEnumApi, number> }): JSX.Element {
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
                <Badge.Number count={counts.approved} status="success" showZero />
                <span className="text-secondary">Always Allow</span>
            </span>
            <span className="flex items-center gap-1">
                <Badge.Number count={counts.needs_approval} status="warning" showZero />
                <span className="text-secondary">Needs Approval</span>
            </span>
            <span className="flex items-center gap-1">
                <Badge.Number count={counts.do_not_use} status="danger" showZero />
                <span className="text-secondary">blocked</span>
            </span>
        </div>
    )
}

export function DecisionTag({ decision }: { decision: string }): JSX.Element {
    switch (decision) {
        case 'auto':
            return <Tag type="success">Auto-approved</Tag>
        case 'approved':
            return <Tag type="completion">Approved</Tag>
        case 'pending':
            return <Tag type="warning">Awaiting approval</Tag>
        case 'blocked':
            return <Tag type="danger">Blocked</Tag>
        default:
            return <Tag>{decision}</Tag>
    }
}
