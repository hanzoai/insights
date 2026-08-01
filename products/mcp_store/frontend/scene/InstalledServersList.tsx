import { useActions, useValues } from 'kea'

import { Card, Tag } from '@hanzo/elements'

import { mcpStoreLogic } from '../mcpStoreLogic'
import { ServerIcon } from './icons'

export function InstalledServersList(): JSX.Element | null {
    const { installations, filteredInstallations } = useValues(mcpStoreLogic)
    const { selectServer } = useActions(mcpStoreLogic)

    if (installations.length === 0) {
        return null
    }

    return (
        <div className="deprecated-space-y-2">
            <h2 className="mb-0 text-base font-semibold">Installed</h2>

            {filteredInstallations.length === 0 ? (
                <div className="text-sm text-secondary px-1 py-2">No installed servers match your search.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredInstallations.map((installation) => {
                        const statusTag = installation.pending_oauth ? (
                            <Tag type="warning" size="small">
                                Pending OAuth
                            </Tag>
                        ) : installation.needs_reauth ? (
                            <Tag type="danger" size="small">
                                Reconnect
                            </Tag>
                        ) : installation.is_enabled === false ? (
                            <Tag type="muted" size="small">
                                Disabled
                            </Tag>
                        ) : (
                            <Tag type="success" size="small">
                                Connected
                            </Tag>
                        )

                        const toolCount = installation.tool_count ?? 0

                        return (
                            <Card
                                key={installation.id}
                                hoverEffect
                                className="cursor-pointer"
                                onClick={() => selectServer(installation.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <ServerIcon
                                        iconDomain={installation.icon_domain}
                                        serverUrl={installation.url}
                                        size={32}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="mb-0 truncate">{installation.name}</h4>
                                        <div className="text-xs text-secondary truncate">
                                            {toolCount} tool{toolCount === 1 ? '' : 's'}
                                            {installation.description ? ` · ${installation.description}` : ''}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {installation.scope === 'shared' && (
                                            <Tag type="highlight" size="small">
                                                Shared
                                            </Tag>
                                        )}
                                        {statusTag}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
