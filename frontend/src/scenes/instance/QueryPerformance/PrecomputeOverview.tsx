import { useActions, useValues } from 'kea'

import { Button } from '@hanzo/elements'

import { Card } from 'lib/elements/Card'
import { Skeleton } from 'lib/elements/Skeleton'
import { Table, TableColumns } from 'lib/elements/Table'
import { Tag, TagType } from 'lib/elements/Tag'
import { Tooltip } from 'lib/elements/Tooltip'
import { humanFriendlyDuration } from 'lib/utils/durations'
import { humanFriendlyNumber, humanizeBytes } from 'lib/utils/numbers'

import { PrecomputeTrends } from './PrecomputeTrends'
import { EXCEPTION_CODE_LABELS, PrecomputePathStats, queryPerformanceLogic } from './queryPerformanceLogic'

const TIME_RANGE_OPTIONS = [
    { label: '1h', hours: 1 },
    { label: '6h', hours: 6 },
    { label: '24h', hours: 24 },
    { label: '7d', hours: 168 },
]

const SKIP_REASON_LABELS: Record<string, string> = {
    team_disabled: 'Precompute off for team',
    min_runtime: 'Experiment <12h old',
    override_direct: 'Forced direct (query override)',
    data_warehouse: 'Data warehouse metric',
    group_aggregation: 'Group-aggregated experiment',
}

const formatMs = (ms: number | null): string => {
    if (ms == null) {
        return '–'
    }
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`
}

const formatPercent = (numerator: number, denominator: number): string =>
    denominator > 0 ? `${((numerator / denominator) * 100).toFixed(1)}%` : '–'

function StatCard({
    title,
    value,
    subtitle,
    tooltip,
    type,
}: {
    title: string
    value: string
    subtitle?: string
    tooltip?: string
    type?: TagType
}): JSX.Element {
    const card = (
        <Card hoverEffect={false} className="flex-1 min-w-52">
            <div className="text-xs text-muted">{title}</div>
            <div className={`text-xl font-semibold mt-1 ${type === 'danger' ? 'text-danger' : ''}`}>{value}</div>
            {subtitle && <div className="text-xs text-muted mt-1">{subtitle}</div>}
        </Card>
    )
    return tooltip ? <Tooltip title={tooltip}>{card}</Tooltip> : card
}

interface DirectReasonRow {
    reason: string
    label: string
    count: number
    type: TagType
}

interface PathPerfRow {
    path: string
    stats: PrecomputePathStats
}

export function PrecomputeOverview(): JSX.Element {
    const { precomputeOverview, precomputeOverviewLoading, overviewHoursBack } = useValues(queryPerformanceLogic)
    const { loadPrecomputeOverview, setOverviewHoursBack } = useActions(queryPerformanceLogic)

    const overview = precomputeOverview
    const precomputed = overview?.reads.by_exposures_path['precomputed']
    const direct = overview?.reads.by_exposures_path['direct_scan']

    const totalReads = overview?.reads.total ?? 0
    const precomputedReads = precomputed?.reads ?? 0
    const directReads = direct?.reads ?? 0
    // Reads that attempted precompute but still scanned events directly: they paid for the failed
    // build AND the full scan. This is the number that should stay near zero.
    const fallbackReads = direct?.attempted ?? 0
    const attemptedReads = precomputedReads + fallbackReads

    const builds = overview?.builds
    const jobs = overview?.jobs

    const directReasonRows: DirectReasonRow[] = direct
        ? [
              ...Object.entries(direct.skip_reasons).map(
                  (entry): DirectReasonRow => ({
                      reason: entry[0],
                      label: SKIP_REASON_LABELS[entry[0]] ?? entry[0],
                      count: entry[1],
                      type: 'muted',
                  })
              ),
              {
                  reason: 'fallback',
                  label: 'Attempted, but fell back (build failed / not ready)',
                  count: fallbackReads,
                  type: fallbackReads > 0 ? 'danger' : 'muted',
              } satisfies DirectReasonRow,
          ]
              .filter((row) => row.count > 0)
              .sort((a, b) => b.count - a.count)
        : []

    const directReasonColumns: TableColumns<DirectReasonRow> = [
        {
            title: 'Reason',
            render: function Reason(_, row) {
                return <Tag type={row.type}>{row.label}</Tag>
            },
        },
        {
            title: 'Reads',
            width: 120,
            render: function Count(_, row) {
                return <span className="font-mono">{humanFriendlyNumber(row.count)}</span>
            },
        },
        {
            title: '% of direct reads',
            width: 140,
            render: function Share(_, row) {
                return <span className="font-mono">{formatPercent(row.count, directReads)}</span>
            },
        },
    ]

    const pathPerfRows: PathPerfRow[] = overview
        ? Object.entries(overview.reads.by_exposures_path)
              .filter(([, stats]) => stats.reads > 0)
              .map(([path, stats]) => ({ path, stats }))
        : []

    const pathPerfColumns: TableColumns<PathPerfRow> = [
        {
            title: 'Exposures path',
            width: 160,
            render: function Path(_, row) {
                return (
                    <Tag type={row.path === 'precomputed' ? 'success' : 'default'}>
                        {row.path === 'precomputed' ? 'precomputed' : 'direct scan'}
                    </Tag>
                )
            },
        },
        {
            title: 'Reads',
            width: 100,
            render: function Reads(_, row) {
                return <span className="font-mono">{humanFriendlyNumber(row.stats.reads)}</span>
            },
        },
        {
            title: 'Failed',
            width: 100,
            render: function Failed(_, row) {
                return (
                    <span className={`font-mono ${row.stats.failed_reads > 0 ? 'text-danger' : ''}`}>
                        {humanFriendlyNumber(row.stats.failed_reads)}
                    </span>
                )
            },
        },
        {
            title: 'p50',
            width: 90,
            render: function P50(_, row) {
                return <span className="font-mono">{formatMs(row.stats.p50_duration_ms)}</span>
            },
        },
        {
            title: 'p90',
            width: 90,
            render: function P90(_, row) {
                return <span className="font-mono">{formatMs(row.stats.p90_duration_ms)}</span>
            },
        },
        {
            title: 'Avg read',
            width: 110,
            render: function AvgBytes(_, row) {
                return (
                    <span className="font-mono">
                        {row.stats.avg_read_bytes != null ? humanizeBytes(row.stats.avg_read_bytes) : '–'}
                    </span>
                )
            },
        },
        {
            title: 'Total read',
            width: 110,
            render: function TotalBytes(_, row) {
                return <span className="font-mono">{humanizeBytes(row.stats.total_read_bytes)}</span>
            },
        },
    ]

    const metricEvents = overview?.reads.metric_events
    const meApplicable = metricEvents ? metricEvents.precomputed + metricEvents.direct_scan : 0

    return (
        <>
            <PrecomputeTrends />
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <p className="text-muted text-sm mb-0 max-w-200">
                    Global health of exposure/metric-events lazy precomputation: how experiment metric reads are served,
                    why they go direct, and whether the precompute builds themselves succeed. Aggregated from Datastore
                    query_log and the preaggregation job table.
                </p>
                <div className="flex items-center gap-2">
                    {TIME_RANGE_OPTIONS.map(({ label, hours }) => (
                        <Button
                            key={hours}
                            type={overviewHoursBack === hours ? 'primary' : 'tertiary'}
                            size="small"
                            onClick={() => setOverviewHoursBack(hours)}
                        >
                            {label}
                        </Button>
                    ))}
                    <Button
                        type="secondary"
                        size="small"
                        onClick={() => loadPrecomputeOverview()}
                        disabledReason={precomputeOverviewLoading ? 'Loading...' : undefined}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            {!overview && precomputeOverviewLoading ? (
                <div className="flex flex-wrap gap-4 mb-4">
                    {[0, 1, 2, 3].map((i) => (
                        <Card key={i} hoverEffect={false} className="flex-1 min-w-52">
                            <Skeleton className="h-3 w-2/3" />
                            <Skeleton className="h-6 w-1/2 mt-2" />
                            <Skeleton className="h-3 w-3/4 mt-2" />
                        </Card>
                    ))}
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap gap-4 mb-4">
                        <StatCard
                            title="Precompute coverage"
                            value={formatPercent(precomputedReads, totalReads)}
                            subtitle={`${humanFriendlyNumber(precomputedReads)} of ${humanFriendlyNumber(
                                totalReads
                            )} metric reads used precomputed exposures`}
                            tooltip="Share of ALL experiment metric reads served from the precomputed exposures table, including teams where precompute is off."
                        />
                        <StatCard
                            title="Reliability when attempted"
                            value={formatPercent(precomputedReads, attemptedReads)}
                            subtitle={`${humanFriendlyNumber(
                                fallbackReads
                            )} reads fell back to a direct scan after attempting`}
                            tooltip="Of reads that attempted precompute (no skip reason), how many were actually served from precomputed data. Fallbacks paid for the failed build AND the full events scan."
                            type={attemptedReads > 0 && fallbackReads / attemptedReads > 0.05 ? 'danger' : undefined}
                        />
                        <StatCard
                            title="Build success rate"
                            value={builds ? formatPercent(builds.succeeded, builds.total) : '–'}
                            subtitle={
                                builds
                                    ? Object.entries(builds.by_table)
                                          .map(
                                              ([table, counts]) =>
                                                  `${table}: ${humanFriendlyNumber(counts.succeeded)} ok / ${humanFriendlyNumber(counts.failed)} failed`
                                          )
                                          .join(' · ') || 'No builds in this window'
                                    : undefined
                            }
                            type={
                                builds && builds.total > 0 && builds.failed / builds.total > 0.05 ? 'danger' : undefined
                            }
                        />
                        <StatCard
                            title="Reads per successful build"
                            value={
                                builds && builds.succeeded > 0 ? (precomputedReads / builds.succeeded).toFixed(1) : '–'
                            }
                            subtitle="Amortization: how often each build's data is reused"
                            tooltip="Precomputed reads divided by successful builds in the window. Near or below 1 means we rebuild for almost every read (TTL churn or one-off views) and the cache isn't amortizing its cost."
                        />
                    </div>

                    <div className="flex flex-wrap gap-4 mb-4">
                        <StatCard
                            title="Build cost"
                            value={builds ? humanizeBytes(builds.total_read_bytes) : '–'}
                            subtitle={
                                builds
                                    ? `${humanFriendlyDuration(builds.total_duration_ms / 1000)} total Datastore time`
                                    : undefined
                            }
                            tooltip="Total bytes scanned and time spent by precompute-build INSERTs. This is the investment; the read-path savings are the return."
                        />
                        <StatCard
                            title="Wasted on failed builds"
                            value={builds ? humanizeBytes(builds.failed_read_bytes ?? 0) : '–'}
                            subtitle={
                                builds
                                    ? `${humanFriendlyDuration((builds.failed_duration_ms ?? 0) / 1000)} Datastore time on builds that failed`
                                    : undefined
                            }
                            tooltip="Bytes scanned and time spent by precompute-build INSERTs that errored. Pure waste: the read then falls back to a full events scan on top. Should stay near zero."
                            type={
                                builds &&
                                builds.total_read_bytes > 0 &&
                                (builds.failed_read_bytes ?? 0) / builds.total_read_bytes > 0.05
                                    ? 'danger'
                                    : undefined
                            }
                        />
                        <StatCard
                            title="Metric-events precompute"
                            value={metricEvents ? formatPercent(metricEvents.precomputed, meApplicable) : '–'}
                            subtitle={
                                metricEvents
                                    ? `${humanFriendlyNumber(metricEvents.not_applicable)} reads not applicable (only ordered funnels qualify)`
                                    : undefined
                            }
                            tooltip="Hit rate of the metric-events precompute among reads where it applies. Not applicable covers mean/ratio/retention metrics, unordered/strict funnels, breakdowns, CUPED, and data warehouse metrics."
                        />
                        <StatCard
                            title="Jobs (Postgres)"
                            value={
                                jobs
                                    ? `${humanFriendlyNumber(jobs.ready)} ready · ${humanFriendlyNumber(
                                          jobs.failed
                                      )} failed`
                                    : '–'
                            }
                            subtitle={
                                jobs
                                    ? `${humanFriendlyNumber(jobs.pending)} pending · ${humanFriendlyNumber(
                                          jobs.stale_failed
                                      )} stale (executor crashed)`
                                    : undefined
                            }
                            tooltip="PreaggregationJob rows created in the window, across all lazy-computation users (experiments, web analytics, marketing analytics). Stale = a waiter marked the job failed because the owning executor stopped heartbeating."
                        />
                        <StatCard
                            title="Stuck pending jobs"
                            value={jobs ? humanFriendlyNumber(jobs.stuck_pending) : '–'}
                            subtitle="PENDING for >15 min right now"
                            tooltip="Jobs no INSERT will ever finish. Waiters block on these until stale detection fires, so a non-zero number here means slow experiment loads right now."
                            type={jobs && jobs.stuck_pending > 0 ? 'danger' : undefined}
                        />
                    </div>

                    <h3>Why reads went direct</h3>
                    <Table
                        size="small"
                        columns={directReasonColumns}
                        dataSource={directReasonRows}
                        loading={precomputeOverviewLoading}
                        emptyState="No direct-scan reads in this window"
                        className="overflow-visible! flex-none! mb-6 max-w-160"
                    />

                    <div className="flex items-center gap-2">
                        <h3 className="mb-0">Read performance by path</h3>
                        <Tooltip title="Indicative, not causal: teams with precompute enabled are typically the largest, so their direct scans would be even slower than the direct-scan row suggests.">
                            <Tag type="muted">selection bias</Tag>
                        </Tooltip>
                    </div>
                    <Table
                        size="small"
                        columns={pathPerfColumns}
                        dataSource={pathPerfRows}
                        loading={precomputeOverviewLoading}
                        emptyState="No experiment metric reads in this window"
                        className="overflow-visible! flex-none! mt-2 mb-6"
                    />

                    {builds && builds.failed > 0 && (
                        <>
                            <h3>Build failures by exit code</h3>
                            <div className="flex flex-wrap gap-2 mb-8">
                                {Object.entries(builds.failures_by_code)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([code, count]) => (
                                        <Tag key={code} type="danger">
                                            {code}
                                            {EXCEPTION_CODE_LABELS[code]
                                                ? ` (${EXCEPTION_CODE_LABELS[code]})`
                                                : ''} ×{' '}
                                            {humanFriendlyNumber(count)}
                                        </Tag>
                                    ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </>
    )
}
