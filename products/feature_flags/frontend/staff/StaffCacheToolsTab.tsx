import { useActions, useAsyncActions, useValues } from 'kea'

import { IconEye } from '@hanzo/icons'
import {
    Banner,
    Button,
    Dialog,
    Switch,
    Table,
    TableColumns,
    Tag,
} from '@hanzo/elements'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { TZLabel } from 'lib/components/TZLabel'
import { Progress } from 'lib/elements/Progress'
import { truncate } from 'lib/utils/strings'

import {
    CACHE_LABELS,
    featureFlagsStaffToolsLogic,
    StaffCacheEntryStatus,
    StaffCacheKind,
    StaffReadableCacheKind,
    StaffTeamResult,
    StaffWarmRun,
} from './featureFlagsStaffToolsLogic'
import { StaffCacheEntryModal } from './StaffCacheEntryModal'
import { StaffTeamSearchInput } from './StaffTeamSearchInput'

const NO_SELECTION_REASON = 'Select at least one team'

const ALL_CACHES: StaffCacheKind[] = ['evaluation', 'definitions']

const READABLE_CACHE_KINDS: StaffReadableCacheKind[] = ['evaluation', 'definitions']

const WARM_RUN_STATE_TAGS: Record<StaffWarmRun['state'], { type: 'completion' | 'success' | 'muted'; label: string }> =
    {
        running: { type: 'completion', label: 'Running' },
        completed: { type: 'success', label: 'Completed' },
        cancelled: { type: 'muted', label: 'Cancelled' },
    }

const WARM_RUN_SCOPE_LABELS: Record<StaffWarmRun['scope'], string> = {
    all_teams: 'all teams',
    teams_with_flags: 'teams with flags',
}

function WarmRunPanel(): JSX.Element {
    const { warmRun, warmRunCancelResultLoading } = useValues(featureFlagsStaffToolsLogic)
    const { cancelWarmRun } = useAsyncActions(featureFlagsStaffToolsLogic)

    if (!warmRun) {
        return (
            <div className="border rounded p-4">
                <h3 className="mb-1">Warm-all run</h3>
                <p className="text-secondary mb-0">
                    No warm-all run has been recorded. Runs started with the Rust warmer (<code>warm-flags-cache</code>)
                    publish live status here.
                </p>
            </div>
        )
    }

    const stateTag = WARM_RUN_STATE_TAGS[warmRun.state]
    const percent = warmRun.total > 0 ? Math.min(100, Math.round((warmRun.processed / warmRun.total) * 100)) : 0
    const cancelDisabledReason = warmRun.cancel_requested ? 'Cancellation already requested' : undefined

    return (
        <div className="border rounded p-4 space-y-2">
            <div className="flex items-center gap-2">
                <h3 className="mb-0">Warm-all run</h3>
                <Tag type={stateTag.type}>{stateTag.label}</Tag>
                {warmRun.is_stale && <Tag type="warning">Stale</Tag>}
                <span className="flex items-baseline gap-1 text-secondary">
                    {WARM_RUN_SCOPE_LABELS[warmRun.scope] ?? warmRun.scope} · started
                    <TZLabel time={warmRun.started_at} />
                </span>
                {warmRun.state === 'running' && !warmRun.is_stale && (
                    <Button
                        status="danger"
                        type="secondary"
                        size="small"
                        className="ml-auto"
                        loading={warmRunCancelResultLoading}
                        disabledReason={cancelDisabledReason}
                        onClick={() =>
                            Dialog.open({
                                title: 'Cancel the warm-all run?',
                                description:
                                    'The warmer stops dispatching new teams at its next heartbeat and finishes the teams already in flight. Already-warmed caches are kept.',
                                shouldAwaitSubmit: true,
                                primaryButton: {
                                    children: 'Cancel run',
                                    status: 'danger',
                                    onClick: async () => await cancelWarmRun(),
                                },
                                secondaryButton: {
                                    children: 'Keep running',
                                },
                            })
                        }
                    >
                        Cancel run
                    </Button>
                )}
            </div>
            <Progress percent={percent} />
            <div className="flex items-center gap-2 text-secondary">
                <span>
                    {warmRun.processed.toLocaleString()}/{warmRun.total.toLocaleString()} teams ({percent}%) ·{' '}
                    {warmRun.successful.toLocaleString()} ok, {warmRun.failed.toLocaleString()} failed
                </span>
                <span className="flex items-baseline gap-1 ml-auto">
                    Last heartbeat
                    <TZLabel time={warmRun.updated_at} />
                </span>
            </div>
            {warmRun.is_stale && (
                <Banner type="warning">
                    This run stopped reporting progress. The warmer process likely died (deploy, OOM, or manual kill)
                    without writing a final state. Re-run the warmer to continue; its status shows the last dispatched
                    team id ({warmRun.last_team_id ?? 'unknown'}) as a resume cursor.
                </Banner>
            )}
        </div>
    )
}

function CacheStatusCell({ status, onView }: { status?: StaffCacheEntryStatus; onView: () => void }): JSX.Element {
    const tag = !status ? (
        <Tag type="muted">Unknown</Tag>
    ) : status.source !== 'redis' ? (
        <Tag type="warning">Miss</Tag>
    ) : (
        <>
            <Tag type="success">Redis</Tag>
            <span className="text-secondary">{status.flag_count} flags</span>
        </>
    )
    return (
        <span className="flex items-center gap-2">
            {tag}
            <Button size="small" icon={<IconEye />} onClick={onView} tooltip="View cache entry" noPadding />
        </span>
    )
}

export function StaffCacheToolsTab(): JSX.Element {
    const {
        selectedTeams,
        selectedTeamIds,
        cacheStatusByTeamId,
        cacheStatusLoading,
        rebuildResultLoading,
        clearResultLoading,
        teamConfigByTeamId,
        pendingTeamConfigTeamIds,
    } = useValues(featureFlagsStaffToolsLogic)
    const { rebuildCache, clearCache, loadCacheStatus, viewCacheEntry, setMinimalFlagCalledEvents } =
        useActions(featureFlagsStaffToolsLogic)

    const hasSelection = selectedTeamIds.length > 0
    const mutating = rebuildResultLoading || clearResultLoading
    const disabledReason = !hasSelection ? NO_SELECTION_REASON : mutating ? 'Action in progress' : undefined

    const columns: TableColumns<StaffTeamResult> = [
        {
            title: 'Team',
            key: 'team',
            render: (_, team) => (
                <span>
                    {team.name} <span className="text-secondary">(#{team.id})</span>
                </span>
            ),
        },
        {
            title: 'Organization',
            dataIndex: 'organization_name',
        },
        {
            title: 'Project token',
            dataIndex: 'api_token',
            render: (token) => (
                <CopyToClipboardInline
                    explicitValue={String(token)}
                    description="project token"
                    tooltipMessage="Copy project token"
                    iconSize="xsmall"
                    className="font-mono text-xs"
                >
                    {truncate(String(token), 16)}
                </CopyToClipboardInline>
            ),
        },
        {
            title: 'Minimal flag_called events',
            key: 'minimal_flag_called_events',
            render: (_, team) => {
                const config = teamConfigByTeamId[team.id]
                const pending = pendingTeamConfigTeamIds.includes(team.id)
                return (
                    <Switch
                        checked={config?.minimal_flag_called_events ?? false}
                        onChange={(checked) => setMinimalFlagCalledEvents(team.id, checked)}
                        loading={pending}
                        disabledReason={pending ? 'Update in progress' : !config ? 'Loading current value…' : undefined}
                        data-attr="ff-staff-team-config-minimal-flag-called-events"
                    />
                )
            },
        },
        ...READABLE_CACHE_KINDS.map((cacheKind) => ({
            title: CACHE_LABELS[cacheKind],
            key: cacheKind,
            render: (_: unknown, team: StaffTeamResult) => (
                <CacheStatusCell
                    status={cacheStatusByTeamId[team.id]?.[cacheKind]}
                    onView={() => viewCacheEntry({ teamId: team.id, cache: cacheKind })}
                />
            ),
        })),
    ]

    return (
        <div className="space-y-4">
            <WarmRunPanel />

            <StaffTeamSearchInput />

            <div className="flex flex-wrap items-center gap-2 mt-2">
                <Button
                    type="primary"
                    size="small"
                    onClick={() => rebuildCache({ caches: ALL_CACHES })}
                    disabledReason={disabledReason}
                    loading={rebuildResultLoading}
                >
                    Rebuild flag caches
                </Button>
                <Button
                    status="danger"
                    type="secondary"
                    size="small"
                    onClick={() =>
                        Dialog.open({
                            title: 'Clear flag caches?',
                            description: `This immediately clears the evaluation and definitions caches in Redis for ${selectedTeamIds.length} selected team(s). Reads will fall through to the database until the caches are rebuilt.`,
                            primaryButton: {
                                children: 'Clear flag caches',
                                status: 'danger',
                                onClick: () => clearCache({ caches: ALL_CACHES }),
                            },
                            secondaryButton: {
                                children: 'Cancel',
                            },
                        })
                    }
                    disabledReason={disabledReason}
                    loading={clearResultLoading}
                >
                    Clear flag caches
                </Button>
                <Button
                    type="tertiary"
                    size="small"
                    onClick={() => loadCacheStatus()}
                    disabledReason={!hasSelection ? NO_SELECTION_REASON : undefined}
                    className="ml-auto"
                >
                    Refresh status
                </Button>
            </div>

            <Table
                dataSource={selectedTeams}
                columns={columns}
                loading={cacheStatusLoading}
                rowKey={(team) => team.id}
                emptyState="Search for and select one or more teams to inspect and rebuild their flag caches."
            />

            <StaffCacheEntryModal />
        </div>
    )
}
