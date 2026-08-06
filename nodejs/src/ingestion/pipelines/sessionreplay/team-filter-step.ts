import { drop, ok } from '~/ingestion/framework/results'
import { ProcessingStep } from '~/ingestion/framework/steps'
import { TeamService } from '~/ingestion/pipelines/sessionreplay/shared/teams/team-service'
import { TeamForReplay } from '~/ingestion/pipelines/sessionreplay/teams/types'

import { SessionReplayHeaders } from './pipeline-types'

export type TeamOrgResolver = Pick<TeamService, 'getTeamByOrg' | 'getRetentionPeriodByTeamId'>

export interface TeamFilterStepInput {
    headers: SessionReplayHeaders
}

export interface TeamFilterStepOutput {
    team: TeamForReplay
}

/**
 * Creates a step that resolves the project a recording belongs to and enriches the
 * message with it. This step is additive - it preserves all input properties and adds
 * team context.
 *
 * THE ORG IS A ROUTING FACT, NOT A CREDENTIAL. The door that produces this topic has
 * already authenticated the caller against IAM and resolved the org server-side; this
 * step decides only WHERE the recording is filed, and nothing here re-authenticates
 * anything.
 *
 * A missing org header is DLQed upstream in the validate step, so `headers.org` is
 * always present here.
 *
 * Error handling:
 * - DROP: Org owns no project, or that project has recording disabled (intentional business logic)
 * - DROP: Missing retention period (project configuration issue)
 */
export function createTeamFilterStep<T extends TeamFilterStepInput>(
    teamService: TeamOrgResolver
): ProcessingStep<T, T & TeamFilterStepOutput> {
    return async function teamFilterStep(input) {
        const { headers } = input

        const team = await teamService.getTeamByOrg(headers.org)
        if (!team) {
            // DROP: Org owns no project, or its project has session recording disabled
            return drop('header_org_present_project_missing_or_disabled')
        }

        const retentionPeriod = await teamService.getRetentionPeriodByTeamId(team.teamId)
        if (!retentionPeriod) {
            // DROP: Team configuration issue - no retention period set
            return drop('team_missing_retention_period')
        }

        return ok({ ...input, team })
    }
}
