import { PipelineResultType } from '~/ingestion/framework/results'
import { TeamForReplay } from '~/ingestion/pipelines/sessionreplay/teams/types'

import { TeamFilterStepInput, TeamOrgResolver, createTeamFilterStep } from './team-filter-step'

describe('createTeamFilterStep', () => {
    // Headers are guaranteed by the upstream validate step, so they're always present here.
    const createInput = (org: string): TeamFilterStepInput => ({
        headers: { org, session_id: 'session-1', distinct_id: 'distinct-1' },
    })

    const defaultTeam: TeamForReplay = {
        teamId: 1,
        consoleLogIngestionEnabled: false,
        aiTrainingOptedIn: true,
    }

    it('should enrich message with team context when the org resolves to a project', async () => {
        const mockTeamService: TeamOrgResolver = {
            getTeamByOrg: jest.fn().mockResolvedValue(defaultTeam),
            getRetentionPeriodByTeamId: jest.fn().mockResolvedValue(30),
        }

        const step = createTeamFilterStep(mockTeamService)
        const input = createInput('test-org')

        const result = await step(input)

        expect(result.type).toBe(PipelineResultType.OK)
        if (result.type === PipelineResultType.OK) {
            expect(result.value.team.teamId).toBe(1)
        }
    })

    it('should drop message when the org owns no project', async () => {
        const mockTeamService: TeamOrgResolver = {
            getTeamByOrg: jest.fn().mockResolvedValue(null),
            getRetentionPeriodByTeamId: jest.fn(),
        }

        const step = createTeamFilterStep(mockTeamService)
        const input = createInput('test-org')

        const result = await step(input)

        expect(result.type).toBe(PipelineResultType.DROP)
        if (result.type === PipelineResultType.DROP) {
            expect(result.reason).toBe('header_org_present_project_missing_or_disabled')
        }
        expect(mockTeamService.getRetentionPeriodByTeamId).not.toHaveBeenCalled()
    })

    it('should drop message when retention period is missing', async () => {
        const mockTeamService: TeamOrgResolver = {
            getTeamByOrg: jest.fn().mockResolvedValue(defaultTeam),
            getRetentionPeriodByTeamId: jest.fn().mockResolvedValue(null),
        }

        const step = createTeamFilterStep(mockTeamService)
        const input = createInput('test-org')

        const result = await step(input)

        expect(result.type).toBe(PipelineResultType.DROP)
        if (result.type === PipelineResultType.DROP) {
            expect(result.reason).toBe('team_missing_retention_period')
        }
    })

    it('should resolve the project from the org, and from nothing else', async () => {
        const mockTeamService: TeamOrgResolver = {
            getTeamByOrg: jest.fn().mockResolvedValue(defaultTeam),
            getRetentionPeriodByTeamId: jest.fn().mockResolvedValue(30),
        }

        const step = createTeamFilterStep(mockTeamService)
        const input = createInput('my-org')

        await step(input)

        expect(mockTeamService.getTeamByOrg).toHaveBeenCalledTimes(1)
        expect(mockTeamService.getTeamByOrg).toHaveBeenCalledWith('my-org')
        expect(mockTeamService.getRetentionPeriodByTeamId).toHaveBeenCalledTimes(1)
        expect(mockTeamService.getRetentionPeriodByTeamId).toHaveBeenCalledWith(1)
    })

    it('should preserve all input properties in the output (additive step)', async () => {
        const mockTeamService: TeamOrgResolver = {
            getTeamByOrg: jest.fn().mockResolvedValue(defaultTeam),
            getRetentionPeriodByTeamId: jest.fn().mockResolvedValue(30),
        }

        const step = createTeamFilterStep(mockTeamService)
        const input = createInput('my-org')

        const result = await step(input)

        expect(result.type).toBe(PipelineResultType.OK)
        if (result.type === PipelineResultType.OK) {
            // Verify input is preserved
            expect(result.value.headers).toBe(input.headers)
            expect(result.value.headers.org).toBe('my-org')
            // Verify team is added
            expect(result.value.team).toBe(defaultTeam)
        }
    })
})
