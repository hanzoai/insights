import { NextFunction, Request, Response } from 'ultimate-express'

import { PostgresRouter, PostgresUse } from '~/utils/db/postgres'
import { logger } from '~/utils/logger'

import { principalOf } from './principal'

/**
 * Authorization for the routes that name a team in their path.
 *
 * principal.ts answers WHO is calling. This answers whether that caller may name
 * THIS team — the check whose absence is the actual hole. `/api/projects/:team_id/
 * recordings/:session_id` read team_id straight out of the URL and deleted what
 * it pointed at, so a caller who reached the port at all could delete any
 * tenant's recordings by typing a different number.
 *
 * A path segment is a REQUEST for a resource, never a claim about who is asking.
 * So the team is resolved to the org that owns it, and that org must equal the
 * org on the verified principal. The principal's org is signed by IAM; the path
 * is not; only one of the two can decide.
 *
 * The join is the same tenant key the login pipeline uses. Insights maps an IAM
 * org onto Organization.slug (insights/api/iam_org_pipeline.py, slug-only and
 * immutable — matching on the editable, non-unique `name` would let one tenant
 * rename its way into another). A team belongs to exactly one organization, so
 * team -> organization.slug -> IAM owner is total and has one answer.
 *
 * UNKNOWN IS REFUSED. A team id that resolves to no row is 403, not 200: an id
 * we cannot place is an id we cannot authorize.
 */

const DENIED = { error: 'Forbidden' }

/**
 * How long a team's org may be served from memory.
 *
 * A team's organization_id is set when the team is created and is not something
 * the product moves afterwards, so this cannot drift into granting access that
 * was revoked — the mapping it caches is the immutable half of the relation. The
 * cache exists because a single replay request fans out into one block fetch per
 * block, and each of those would otherwise be a query.
 *
 * Misses are cached too, and briefly: a hostile prober sweeping team ids would
 * otherwise turn every request into a database round trip.
 */
const TTL_MS = 60_000
const MISS_TTL_MS = 5_000

interface Entry {
    slug: string | null
    expires: number
}

/** team id -> the slug of the org that owns it. */
export class TeamOrgs {
    private cache = new Map<number, Entry>()

    constructor(private postgres: PostgresRouter) {}

    async orgOf(teamId: number): Promise<string | null> {
        const now = Date.now()
        const cached = this.cache.get(teamId)
        if (cached && cached.expires > now) {
            return cached.slug
        }

        const result = await this.postgres.query<{ slug: string }>(
            PostgresUse.COMMON_READ,
            `
                SELECT o.slug
                FROM insights_team t
                JOIN insights_organization o ON o.id = t.organization_id
                WHERE t.id = $1
            `,
            [teamId],
            'teamOrg'
        )

        const slug = result.rows[0]?.slug ?? null
        this.cache.set(teamId, { slug, expires: now + (slug ? TTL_MS : MISS_TTL_MS) })
        return slug
    }
}

/**
 * Guard for a route carrying `:team_id`.
 *
 * Placed explicitly on each such route rather than inferred from the path, so
 * that adding a route which names a team and forgetting to authorize it is
 * visible in the diff instead of silent.
 */
export function requireTeamAccess(teams: TeamOrgs) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const principal = principalOf(req)
        if (!principal) {
            // Unreachable behind the principal middleware, and still refused:
            // a guard whose safety depends on middleware ordering elsewhere is
            // one reordering away from being no guard at all.
            res.status(403).json(DENIED)
            return
        }

        // Parsed here rather than trusted: the schemas each handler runs are for
        // shaping its own input, and an authorization decision cannot wait on
        // them. Non-numeric ids never reach the query.
        const raw = req.params.team_id
        const teamId = /^\d+$/.test(raw ?? '') ? Number(raw) : NaN
        if (!Number.isSafeInteger(teamId) || teamId <= 0) {
            res.status(403).json(DENIED)
            return
        }

        teams
            .orgOf(teamId)
            .then((org) => {
                if (!org || org !== principal.org) {
                    logger.warn('Request refused: principal may not act on this team', {
                        path: req.path,
                        method: req.method,
                        teamId,
                        principal: principal.user,
                    })
                    res.status(403).json(DENIED)
                    return
                }
                next()
            })
            .catch((error) => {
                // A database that cannot answer "who owns this team" has not
                // said yes.
                logger.error('Request refused: could not resolve the team’s org', {
                    path: req.path,
                    method: req.method,
                    teamId,
                    error,
                })
                res.status(403).json(DENIED)
            })
    }
}
