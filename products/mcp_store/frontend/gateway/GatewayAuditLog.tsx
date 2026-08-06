import { useActions, useValues } from 'kea'

import { IconSparkles } from '@hanzo/icons'
import {
    Button,
    Select,
    SelectOptions,
    Snack,
    Table,
    Tag,
    ProfilePicture,
} from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'

import { AuditCountsApi } from '../generated/api.schemas'
import { AUDIT_PAGE_SIZE, AuditQuickFilter, gatewayAuditLogic } from './gatewayAuditLogic'
import { DecisionTag, toProfileUser } from './gatewayUtils'
import { mcpGatewayLogic } from './mcpGatewayLogic'

const FILTERS: { key: AuditQuickFilter; label: string; countKey: keyof AuditCountsApi }[] = [
    { key: 'all', label: 'All activity', countKey: 'all' },
    { key: 'agents', label: 'Agents only', countKey: 'agents' },
    { key: 'approvals', label: 'Approvals', countKey: 'approvals' },
    { key: 'blocked', label: 'Blocked', countKey: 'blocked' },
]

export function GatewayAuditLog(): JSX.Element {
    const { auditResponse, auditResponseLoading, callerFilter, counts, hasActiveFilters, quickFilter, page } =
        useValues(gatewayAuditLogic)
    const { clearFilters, setCallerFilter, setQuickFilter, setPage } = useActions(gatewayAuditLogic)
    const { isAdmin, serviceAccounts, serviceAccountsLoading } = useValues(mcpGatewayLogic)
    const callerOptions: SelectOptions<string> = [
        { options: [{ value: 'all', label: 'Everyone' }] },
        ...(serviceAccounts.length > 0
            ? [
                  {
                      title: 'Agents',
                      options: serviceAccounts.map((account) => ({ value: account.id, label: account.name })),
                  },
              ]
            : []),
    ]
    const selectedCallerName =
        callerFilter === 'all'
            ? 'Everyone'
            : (serviceAccounts.find((account) => account.id === callerFilter)?.name ?? 'Agent')

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h2 className="mb-1">Audit log</h2>
                <p className="mb-0 text-sm text-secondary">
                    {isAdmin
                        ? 'This log shows every tool call routed through the gateway and how the gateway handled it.'
                        : 'This log shows tool calls made through your MCP server connections, including calls from agents you shared them with.'}
                </p>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    {FILTERS.map((filter) => (
                        <Button
                            key={filter.key}
                            size="small"
                            type={quickFilter === filter.key ? 'primary' : 'tertiary'}
                            aria-pressed={quickFilter === filter.key}
                            onClick={() => setQuickFilter(filter.key)}
                        >
                            {filter.label}
                            {counts && <Snack className="ml-1">{counts[filter.countKey] ?? 0}</Snack>}
                        </Button>
                    ))}
                </div>
                <Select
                    aria-label="Filter by caller"
                    value={callerFilter}
                    onChange={setCallerFilter}
                    options={callerOptions}
                    loading={serviceAccountsLoading}
                    size="small"
                    renderButtonContent={() => `Caller: ${selectedCallerName}`}
                />
            </div>

            <div className="flex items-center gap-2 text-sm text-secondary">
                <span>
                    {auditResponse.count} tool {auditResponse.count === 1 ? 'call' : 'calls'}
                    {hasActiveFilters
                        ? auditResponse.count === 1
                            ? ' matches your filters'
                            : ' match your filters'
                        : ''}
                </span>
                {hasActiveFilters && (
                    <Button type="tertiary" size="xsmall" onClick={clearFilters}>
                        Clear filters
                    </Button>
                )}
            </div>

            <Table
                loading={auditResponseLoading}
                dataSource={auditResponse.results}
                emptyState={
                    hasActiveFilters
                        ? 'No tool calls match these filters. Clear the filters to see more activity.'
                        : 'No tool calls are available in this audit log yet.'
                }
                pagination={{
                    controlled: true,
                    pageSize: AUDIT_PAGE_SIZE,
                    currentPage: page,
                    entryCount: auditResponse.count,
                    onForward: () => setPage(page + 1),
                    onBackward: () => setPage(page - 1),
                }}
                columns={[
                    {
                        title: 'Time',
                        dataIndex: 'created_at',
                        render: (_, row) => <TZLabel time={row.created_at} />,
                    },
                    {
                        title: 'Caller',
                        key: 'caller',
                        render: (_, row) => (
                            <div className="flex items-center gap-2 min-w-0">
                                {row.actor_service_account ? (
                                    <span className="flex items-center gap-1 min-w-0">
                                        <IconSparkles />
                                        <span className="truncate">{row.actor_service_account.name}</span>
                                    </span>
                                ) : row.actor_user ? (
                                    <ProfilePicture user={toProfileUser(row.actor_user)} size="sm" showName />
                                ) : (
                                    <span className="text-secondary truncate">{row.actor_label || 'Unknown'}</span>
                                )}
                                <Tag
                                    size="small"
                                    type={
                                        row.actor_service_account ? 'completion' : row.actor_user ? 'muted' : 'warning'
                                    }
                                >
                                    {row.actor_service_account ? 'Agent' : row.actor_user ? 'Human' : 'Deleted'}
                                </Tag>
                            </div>
                        ),
                    },
                    {
                        title: 'MCP server · tool called',
                        key: 'server',
                        render: (_, row) => (
                            <div>
                                <div className="font-semibold text-xs">{row.server_name}</div>
                                <div className="font-mono text-xs text-secondary">{row.tool_name}()</div>
                            </div>
                        ),
                    },
                    {
                        title: 'Decision',
                        dataIndex: 'decision',
                        render: (_, row) => <DecisionTag decision={row.decision} />,
                    },
                ]}
            />
        </div>
    )
}
