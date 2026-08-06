import { useActions, useValues } from 'kea'
import { useEffect, useMemo, useState } from 'react'

import { IconCheck, IconChevronLeft, IconRefresh, IconShare, IconShieldLock, IconTrash, IconX } from '@hanzo/icons'
import { Button, Dialog, Divider, Snack, Switch, Tag, Tooltip } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel, TeamMembershipLevel } from 'lib/constants'
import { Link } from 'lib/elements/Link'
import { teamLogic } from 'scenes/teamLogic'

import type {
    MCPServerInstallationApi,
    MCPServerInstallationToolApi,
    MCPServerTemplateApi,
} from '../generated/api.schemas'
import { type ToolApprovalState, mcpStoreLogic } from '../mcpStoreLogic'
import { ServerIcon } from './icons'
import { ToolRow } from './ToolRow'

function authorizeUrl(teamId: number | null, installationId: string): string {
    return `/api/environments/${teamId}/mcp_server_installations/authorize/?installation_id=${installationId}`
}

function countBy<T>(items: T[], predicate: (item: T) => boolean): number {
    return items.filter(predicate).length
}

function PendingOAuthView({ installation }: { installation: MCPServerInstallationApi }): JSX.Element {
    const { currentTeamId } = useValues(teamLogic)
    const { uninstallServer } = useActions(mcpStoreLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Member,
    })

    return (
        <div className="border border-dashed border-primary rounded p-6 text-center deprecated-space-y-3">
            <h3 className="mb-0">Finish connecting</h3>
            <p className="text-secondary mb-0">
                This server hasn't completed its OAuth handshake yet. Click below to continue.
            </p>
            <div className="flex items-center justify-center gap-2">
                <Button
                    type="primary"
                    onClick={() => {
                        window.location.href = authorizeUrl(currentTeamId, installation.id)
                    }}
                    disabledReason={restrictedReason}
                >
                    Continue OAuth
                </Button>
                <Button
                    type="secondary"
                    status="danger"
                    icon={<IconTrash />}
                    onClick={() => uninstallServer(installation.id)}
                    disabledReason={restrictedReason}
                >
                    Cancel install
                </Button>
            </div>
        </div>
    )
}

interface ToolsSectionProps {
    installation: MCPServerInstallationApi
    disabledReason: string | null
}

function ToolsSection({ installation, disabledReason }: ToolsSectionProps): JSX.Element {
    const { installationTools, installationToolsLoading } = useValues(mcpStoreLogic)
    const { loadInstallationTools, refreshInstallationTools, setToolApprovalState, setBulkApprovalState } =
        useActions(mcpStoreLogic)
    const [showRemoved, setShowRemoved] = useState(false)

    useEffect(() => {
        if (!installationTools[installation.id]) {
            loadInstallationTools({ installationId: installation.id })
        }
    }, [installation.id, installationTools, loadInstallationTools])

    const tools: MCPServerInstallationToolApi[] = installationTools[installation.id] ?? []
    const visibleTools = useMemo(() => tools.filter((t) => showRemoved || !t.removed_at), [tools, showRemoved])
    const removedCount = countBy(tools, (t) => !!t.removed_at)
    const approvedCount = countBy(tools, (t) => t.approval_state === 'approved')
    const pendingCount = countBy(tools, (t) => (t.approval_state ?? 'needs_approval') === 'needs_approval')
    const blockedCount = countBy(tools, (t) => t.approval_state === 'do_not_use')

    return (
        <div className="deprecated-space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <h3 className="mb-0">Tools</h3>
                    <Snack>{tools.length}</Snack>
                </div>
                <Button
                    size="small"
                    type="secondary"
                    icon={<IconRefresh />}
                    onClick={() => refreshInstallationTools({ installationId: installation.id })}
                    loading={installationToolsLoading}
                    disabledReason={disabledReason}
                >
                    Refresh tools
                </Button>
            </div>

            {tools.length > 0 && (
                <div className="flex items-center justify-between gap-2 flex-wrap bg-surface-secondary rounded p-2">
                    <div className="text-xs text-secondary">
                        <span className="font-semibold">{approvedCount}</span> Always Allow ·{' '}
                        <span className="font-semibold">{pendingCount}</span> Needs Approval ·{' '}
                        <span className="font-semibold">{blockedCount}</span> Blocked
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-xs text-secondary mr-1">Set all:</span>
                        <Button
                            size="xsmall"
                            type="secondary"
                            icon={<IconCheck />}
                            onClick={() =>
                                setBulkApprovalState({
                                    installationId: installation.id,
                                    approvalState: 'approved',
                                })
                            }
                            disabledReason={disabledReason}
                        >
                            Always Allow
                        </Button>
                        <Button
                            size="xsmall"
                            type="secondary"
                            icon={<IconShieldLock />}
                            onClick={() =>
                                setBulkApprovalState({
                                    installationId: installation.id,
                                    approvalState: 'needs_approval',
                                })
                            }
                            disabledReason={disabledReason}
                        >
                            Needs Approval
                        </Button>
                        <Button
                            size="xsmall"
                            type="secondary"
                            status="danger"
                            icon={<IconX />}
                            onClick={() =>
                                setBulkApprovalState({
                                    installationId: installation.id,
                                    approvalState: 'do_not_use',
                                })
                            }
                            disabledReason={disabledReason}
                        >
                            Block
                        </Button>
                    </div>
                </div>
            )}

            {removedCount > 0 && (
                <div className="text-xs">
                    <Button size="xsmall" type="tertiary" onClick={() => setShowRemoved((v) => !v)}>
                        {showRemoved ? `Hide ${removedCount} removed` : `Show ${removedCount} removed`}
                    </Button>
                </div>
            )}

            {visibleTools.length === 0 ? (
                <div className="text-center py-8 text-secondary text-sm border border-dashed border-primary rounded">
                    {installationToolsLoading
                        ? 'Loading tools…'
                        : 'No tools reported yet. Click "Refresh tools" after connecting.'}
                </div>
            ) : (
                <div className="border border-primary rounded overflow-hidden">
                    {visibleTools.map((tool) => (
                        <ToolRow
                            key={tool.id}
                            tool={tool}
                            teamScope={installation.scope === 'shared'}
                            disabledReason={disabledReason}
                            onPolicyChange={(state: ToolApprovalState) =>
                                setToolApprovalState({
                                    installationId: installation.id,
                                    toolName: tool.tool_name,
                                    approvalState: state,
                                })
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

interface Props {
    installation: MCPServerInstallationApi | null
    template: MCPServerTemplateApi | null
}

export function ServerDetailPanel({ installation, template }: Props): JSX.Element {
    const { currentTeamId } = useValues(teamLogic)
    const {
        selectServer,
        setSceneView,
        toggleServerEnabled,
        uninstallServer,
        installTemplate,
        shareInstallation,
        unshareInstallation,
    } = useActions(mcpStoreLogic)
    const { installationsLoading } = useValues(mcpStoreLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Member,
    })
    // Sharing carries the same admin gate as creating a shared install outright
    // (see AddCustomServerForm); admins can also unshare or remove another
    // member's shared server. Organization scope, not Project: on a project
    // with no access controls configured every member reports as effective
    // project admin, which must not open up shared-credential management.
    // The backend applies the same gate (plus explicitly-granted project admins).
    const adminRestrictionReason = useRestrictedArea({
        scope: RestrictionScope.Organization,
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
    })
    const isAdmin = !adminRestrictionReason
    const isOwner = installation?.is_owner === true
    // The backend rejects owner-only mutations of shared rows (rename, toggle,
    // tool policy) for non-owners — gate them client-side instead of surfacing 403s.
    const ownerOnlyReason =
        installation?.scope === 'shared' && !isOwner ? 'Only the owner can modify a shared server connection' : null
    const mutationDisabledReason = restrictedReason ?? ownerOnlyReason
    const removeDisabledReason =
        installation?.scope === 'shared' && !isOwner && !isAdmin
            ? 'Only the owner or a project admin can remove a shared server'
            : restrictedReason

    if (!installation && !template) {
        return (
            <div className="text-center py-12">
                <p className="text-secondary">This server could not be found.</p>
                <Button type="secondary" onClick={() => setSceneView('marketplace')}>
                    Back to marketplace
                </Button>
            </div>
        )
    }

    const name = installation?.name ?? template?.name ?? ''
    const description = installation?.description ?? template?.description ?? ''
    const docsUrl = template?.docs_url ?? ''
    const iconDomain = installation?.icon_domain ?? template?.icon_domain ?? null
    const serverUrl = installation?.url ?? template?.url ?? null
    const authType = installation?.auth_type ?? template?.auth_type

    const goBack = (): void => {
        selectServer(null)
        setSceneView('marketplace')
    }

    return (
        <div className="deprecated-space-y-6">
            <Button type="tertiary" icon={<IconChevronLeft />} onClick={goBack} size="small">
                Back to marketplace
            </Button>

            <div className="flex gap-4 items-center">
                <ServerIcon iconDomain={iconDomain} serverUrl={serverUrl} size={56} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="mb-0">{name}</h1>
                        {installation && !installation.pending_oauth && !installation.needs_reauth && (
                            <Tag type="success">Connected</Tag>
                        )}
                        {installation?.needs_reauth && <Tag type="danger">Reconnect required</Tag>}
                        {installation?.pending_oauth && <Tag type="warning">Pending OAuth</Tag>}
                        {authType && <Snack>{authType === 'oauth' ? 'OAuth' : 'API key'}</Snack>}
                    </div>
                    {description && <p className="text-secondary mt-2 mb-0">{description}</p>}
                    {docsUrl && (
                        <Link to={docsUrl} target="_blank" className="text-xs mt-1 inline-block">
                            View documentation
                        </Link>
                    )}
                </div>
                <div className="flex items-end gap-3 flex-col">
                    {!installation && template ? (
                        <Button
                            type="primary"
                            onClick={() => installTemplate({ templateId: template.id })}
                            disabledReason={restrictedReason}
                        >
                            Connect
                        </Button>
                    ) : installation?.needs_reauth ? (
                        <Button
                            type="primary"
                            onClick={() => {
                                window.location.href = authorizeUrl(currentTeamId, installation.id)
                            }}
                            disabledReason={restrictedReason}
                        >
                            Reconnect
                        </Button>
                    ) : null}
                    {installation && !installation.pending_oauth && !installation.needs_reauth && (
                        <Tooltip title="Disable to stop the agent from using this server. Tools stay configured.">
                            <Switch
                                checked={installation.is_enabled !== false}
                                onChange={(checked) => toggleServerEnabled({ id: installation.id, enabled: checked })}
                                disabledReason={mutationDisabledReason ?? undefined}
                            />
                        </Tooltip>
                    )}
                    {installation?.scope === 'personal' && isOwner && isAdmin && (
                        <Button
                            type="secondary"
                            size="small"
                            icon={<IconShare />}
                            loading={installationsLoading}
                            onClick={() =>
                                Dialog.open({
                                    title: `Share "${installation.name}" with the project?`,
                                    description: (
                                        <div className="max-w-120">
                                            Everyone in this project, including the Insights agent, can use{' '}
                                            <strong>{installation.name}</strong> via your connection. Their actions will
                                            be attributed to your account. For better security, connect a service
                                            account. You can unshare anytime.
                                        </div>
                                    ),
                                    secondaryButton: {
                                        type: 'secondary',
                                        children: 'Cancel',
                                    },
                                    primaryButton: {
                                        type: 'primary',
                                        children: 'Share with project',
                                        onClick: () => shareInstallation({ id: installation.id }),
                                    },
                                })
                            }
                        >
                            Share with project
                        </Button>
                    )}
                    {installation?.scope === 'shared' && (isOwner || isAdmin) && (
                        <Button
                            type="secondary"
                            size="small"
                            loading={installationsLoading}
                            onClick={() => unshareInstallation({ id: installation.id })}
                            tooltip="Convert back to a personal server, visible only to its owner."
                        >
                            Unshare
                        </Button>
                    )}
                    {installation && (
                        <Button
                            type="secondary"
                            status="danger"
                            size="small"
                            icon={<IconTrash />}
                            loading={installationsLoading}
                            onClick={() => uninstallServer(installation.id)}
                            disabledReason={removeDisabledReason}
                        >
                            Remove
                        </Button>
                    )}
                </div>
            </div>

            <Divider />

            {installation?.pending_oauth ? (
                <PendingOAuthView installation={installation} />
            ) : installation ? (
                <ToolsSection installation={installation} disabledReason={restrictedReason} />
            ) : (
                <div className="border border-dashed border-primary rounded p-6 text-center text-secondary">
                    Connect this server to manage its tools and permissions.
                </div>
            )}
        </div>
    )
}
