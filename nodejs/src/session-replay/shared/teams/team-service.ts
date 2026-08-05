import { Team, TeamId } from '../../../types'
import { BackgroundRefresher } from '../../../utils/background-refresher'
import { PostgresRouter, PostgresUse } from '../../../utils/db/postgres'
import { logger } from '../../../utils/logger'
import { RetentionPeriod } from '../constants'
import { TeamServiceMetrics } from './metrics'
import { TeamForReplay } from './types'

interface TeamServiceData {
    orgMap: Record<string, TeamForReplay>
    retentionMap: Record<TeamId, RetentionPeriod>
    encryptionMap: Record<TeamId, boolean>
}

export class TeamService {
    private readonly teamRefresher: BackgroundRefresher<TeamServiceData>

    constructor(private postgres: PostgresRouter) {
        this.teamRefresher = new BackgroundRefresher(
            () => this.fetchOrgProjectsWithRecordings(),
            5 * 60 * 1000, // 5 minutes
            (e) => {
                // We ignore the error and wait for postgres to recover
                logger.error('Error refreshing org projects', e)
                TeamServiceMetrics.incrementRefreshErrors()
            }
        )
    }

    /**
     * Resolve the project a recording belongs to from the ORG that produced it.
     *
     * The org is a routing fact, not a credential. It arrives already authenticated:
     * the only producer on this topic is cloud's /v1/replay door, which resolves it
     * server-side from the IAM-issued publishable key before it ever reaches the
     * wire. Nothing here re-authenticates it, and nothing here should — a second
     * credential on this path is precisely what was removed.
     */
    public async getTeamByOrg(org: string): Promise<TeamForReplay | null> {
        const { orgMap } = await this.teamRefresher.get()
        const teamConfig = orgMap[org]

        if (!teamConfig?.teamId) {
            return null
        }

        return teamConfig
    }

    public async getRetentionPeriodByTeamId(teamId: TeamId): Promise<RetentionPeriod | null> {
        const { retentionMap } = await this.teamRefresher.get()
        const retentionPeriod = retentionMap[teamId]

        if (retentionPeriod === undefined) {
            return null
        }

        return retentionPeriod
    }

    public async getEncryptionEnabledByTeamId(teamId: TeamId): Promise<boolean> {
        const { encryptionMap } = await this.teamRefresher.get()
        return encryptionMap[teamId] ?? false
    }

    private async fetchOrgProjectsWithRecordings(): Promise<TeamServiceData> {
        return fetchOrgProjectsWithRecordings(this.postgres)
    }
}

/**
 * Which project each org's recordings land in.
 *
 * AN ORG OWNS ONE PROJECT ON THIS PLANE, and the rule for which one is not invented
 * here: it is `organization.teams.order_by("id").first()`, the same answer the app
 * gives everywhere a user lands somewhere by default (`insights/models/user.py`) and
 * the same one `manage.py route_orgs` publishes to `org_team` for the events plane.
 * `DISTINCT ON (o.slug) ... ORDER BY o.slug, t.id` is that rule in SQL. A second rule
 * here — "the org's first project that has recording enabled", say — would be a
 * routing answer free to disagree with the events plane about who owns what, which is
 * the bug `route_orgs` exists to have fixed.
 *
 * The opt-in is then a GATE on the resolved project rather than part of resolving it:
 * an org whose project has session recording off resolves to that project and is
 * dropped, instead of quietly resolving to a different project that happens to have
 * it on.
 */
export async function fetchOrgProjectsWithRecordings(client: PostgresRouter): Promise<TeamServiceData> {
    const selectResult = await client.query<
        {
            org: string
            session_recording_opt_in: boolean
            capture_console_log_opt_in: boolean
            session_recording_retention_period: RetentionPeriod
            session_recording_encryption: boolean | null
        } & Pick<Team, 'id'>
    >(
        PostgresUse.COMMON_READ,
        `
            SELECT DISTINCT ON (o.slug)
                o.slug AS org,
                t.id,
                t.session_recording_opt_in,
                t.capture_console_log_opt_in,
                t.session_recording_retention_period,
                t.session_recording_encryption
            FROM insights_team t
            JOIN insights_organization o ON o.id = t.organization_id
            ORDER BY o.slug, t.id
        `,
        [],
        'fetchOrgProjectsWithRecordings'
    )

    const recording = selectResult.rows.filter((row) => row.session_recording_opt_in)

    const orgMap = recording.reduce(
        (acc, row) => {
            acc[row.org] = {
                teamId: row.id,
                consoleLogIngestionEnabled: row.capture_console_log_opt_in,
            }
            return acc
        },
        {} as Record<string, TeamForReplay>
    )

    const retentionMap = recording.reduce(
        (acc, row) => {
            acc[row.id] = row.session_recording_retention_period
            return acc
        },
        {} as Record<TeamId, RetentionPeriod>
    )

    const encryptionMap = recording.reduce(
        (acc, row) => {
            acc[row.id] = row.session_recording_encryption ?? false
            return acc
        },
        {} as Record<TeamId, boolean>
    )

    TeamServiceMetrics.incrementRefreshCount()

    return { orgMap, retentionMap, encryptionMap }
}
