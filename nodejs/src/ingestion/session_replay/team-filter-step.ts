import { ParsedMessageData } from '../../session-recording/stream/types'
import { TeamForReplay } from '../../session-recording/teams/types'
import { TeamService } from '../../session-replay/shared/teams/team-service'
import { dlq, drop, ok } from '../pipelines/results'
import { ProcessingStep } from '../pipelines/steps'

export type TeamOrgResolver = Pick<TeamService, 'getTeamByOrg' | 'getRetentionPeriodByTeamId'>

export interface TeamFilterStepInput {
    parsedMessage: ParsedMessageData
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
 * Error handling:
 * - DLQ: Missing org (the door always adds this header, so its absence is a bug)
 * - DROP: Org owns no project, or that project has recording disabled
 * - DROP: Missing retention period (project configuration issue)
 */
export function createTeamFilterStep<T extends TeamFilterStepInput>(
    teamService: TeamOrgResolver
): ProcessingStep<T, T & TeamFilterStepOutput> {
    return async function teamFilterStep(input) {
        const { parsedMessage } = input

        const org = parsedMessage.org
        if (!org) {
            // DLQ: The door always adds an org header. Missing org indicates a bug.
            return dlq('no_org_in_header')
        }

        const team = await teamService.getTeamByOrg(org)
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
