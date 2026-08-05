import { DateTime } from 'luxon'

import { ParsedMessageData } from '../../session-recording/stream/types'
import { TeamForReplay } from '../../session-recording/teams/types'
import { PipelineResultType } from '../pipelines/results'
import { TeamFilterStepInput, TeamOrgResolver, createTeamFilterStep } from './team-filter-step'

describe('createTeamFilterStep', () => {
    const createParsedMessage = (sessionId: string, org: string | null = 'test-org'): ParsedMessageData => ({
        metadata: {
            partition: 0,
            topic: 'test-topic',
            offset: 1,
            timestamp: 1234567890,
            rawSize: 100,
        },
        headers: org ? [{ org: Buffer.from(org) }] : [],
        distinct_id: 'distinct_id',
        session_id: sessionId,
        org,
        eventsByWindowId: { window1: [] },
        eventsRange: { start: DateTime.fromMillis(0), end: DateTime.fromMillis(0) },
        snapshot_source: null,
        snapshot_library: null,
    })

    const createInput = (sessionId: string, org: string | null = 'test-org'): TeamFilterStepInput => ({
        parsedMessage: createParsedMessage(sessionId, org),
    })

    const defaultTeam: TeamForReplay = {
        teamId: 1,
        consoleLogIngestionEnabled: false,
    }

    it('should enrich message with team context when the org resolves to a project', async () => {
        const mockTeamService: TeamOrgResolver = {
            getTeamByOrg: jest.fn().mockResolvedValue(defaultTeam),
            getRetentionPeriodByTeamId: jest.fn().mockResolvedValue(30),
        }

        const step = createTeamFilterStep(mockTeamService)
        const input = createInput('session-1')

        const result = await step(input)

        expect(result.type).toBe(PipelineResultType.OK)
        if (result.type === PipelineResultType.OK) {
            expect(result.value.team.teamId).toBe(1)
            expect(result.value.parsedMessage.session_id).toBe('session-1')
        }
    })

    it('should DLQ message when org is missing', async () => {
        const mockTeamService: TeamOrgResolver = {
            getTeamByOrg: jest.fn(),
            getRetentionPeriodByTeamId: jest.fn(),
        }

        const step = createTeamFilterStep(mockTeamService)
        const input = createInput('session-1', null)

        const result = await step(input)

        expect(result.type).toBe(PipelineResultType.DLQ)
        if (result.type === PipelineResultType.DLQ) {
            expect(result.reason).toBe('no_org_in_header')
        }
        expect(mockTeamService.getTeamByOrg).not.toHaveBeenCalled()
    })

    it('should drop message when the org owns no project', async () => {
        const mockTeamService: TeamOrgResolver = {
            getTeamByOrg: jest.fn().mockResolvedValue(null),
            getRetentionPeriodByTeamId: jest.fn(),
        }

        const step = createTeamFilterStep(mockTeamService)
        const input = createInput('session-1')

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
        const input = createInput('session-1')

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
        const input = createInput('my-session', 'my-org')

        await step(input)

        expect(mockTeamService.getTeamByOrg).toHaveBeenCalledTimes(1)
        expect(mockTeamService.getTeamByOrg).toHaveBeenCalledWith('my-org')
        expect(mockTeamService.getRetentionPeriodByTeamId).toHaveBeenCalledTimes(1)
        expect(mockTeamService.getRetentionPeriodByTeamId).toHaveBeenCalledWith(1)
    })

    it('should not accept a project token in place of an org', async () => {
        // The step reads the org and only the org. A message carrying the old `hi_`
        // project token and no org is a bug at the producer, and it goes to the DLQ
        // rather than being resolved by the credential this path no longer has.
        const mockTeamService: TeamOrgResolver = {
            getTeamByOrg: jest.fn().mockResolvedValue(defaultTeam),
            getRetentionPeriodByTeamId: jest.fn().mockResolvedValue(30),
        }

        const step = createTeamFilterStep(mockTeamService)
        const input = createInput('session-1', null)
        input.parsedMessage.headers = [{ token: Buffer.from('hi_some_project_token') }]

        const result = await step(input)

        expect(result.type).toBe(PipelineResultType.DLQ)
        expect(mockTeamService.getTeamByOrg).not.toHaveBeenCalled()
    })

    it('should preserve all input properties in the output (additive step)', async () => {
        const mockTeamService: TeamOrgResolver = {
            getTeamByOrg: jest.fn().mockResolvedValue(defaultTeam),
            getRetentionPeriodByTeamId: jest.fn().mockResolvedValue(30),
        }

        const step = createTeamFilterStep(mockTeamService)
        const input = createInput('my-session', 'my-org')

        const result = await step(input)

        expect(result.type).toBe(PipelineResultType.OK)
        if (result.type === PipelineResultType.OK) {
            // Verify input is preserved
            expect(result.value.parsedMessage).toBe(input.parsedMessage)
            expect(result.value.parsedMessage.session_id).toBe('my-session')
            expect(result.value.parsedMessage.org).toBe('my-org')
            // Verify team is added
            expect(result.value.team).toBe(defaultTeam)
        }
    })
})
