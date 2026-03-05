import { v4 } from 'uuid'

import { ScriptTransformerService } from '../../cdp/script-transformations/script-transformer.service'
import { ProjectId, Team } from '../../types'
import { PipelineResultType } from '../pipelines/results'
import { PrefetchCustomFunctionsStepInput, createPrefetchCustomFunctionsStep } from './prefetch-custom-functions-step'

const createTestTeam = (overrides: Partial<Team> = {}): Team => ({
    id: 1,
    project_id: 1 as ProjectId,
    organization_id: 'test-org-id',
    uuid: v4(),
    name: 'Test Team',
    anonymize_ips: false,
    api_token: 'test-api-token',
    slack_incoming_webhook: null,
    session_recording_opt_in: true,
    person_processing_opt_out: null,
    heatmaps_opt_in: null,
    ingested_event: true,
    person_display_name_properties: null,
    test_account_filters: null,
    cookieless_server_hash_mode: null,
    timezone: 'UTC',
    available_features: [],
    drop_events_older_than_seconds: null,
    ...overrides,
})

const createTestInput = (team: Team): PrefetchCustomFunctionsStepInput => ({
    team,
})

describe('prefetchCustomFunctionsStep', () => {
    let mockScriptTransformer: jest.Mocked<ScriptTransformerService>
    let mockGetCustomFunctionIdsForTeams: jest.Mock

    beforeEach(() => {
        mockGetCustomFunctionIdsForTeams = jest.fn()
        mockScriptTransformer = {
            clearCustomFunctionStates: jest.fn(),
            fetchAndCacheCustomFunctionStates: jest.fn(),
            customFunctionManager: {
                getCustomFunctionIdsForTeams: mockGetCustomFunctionIdsForTeams,
            },
        } as unknown as jest.Mocked<ScriptTransformerService>
    })

    it('clears cached custom function states before processing', async () => {
        mockGetCustomFunctionIdsForTeams.mockResolvedValue({})

        const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 1)
        const input = createTestInput(createTestTeam())

        await step([input])

        expect(mockScriptTransformer.clearCustomFunctionStates).toHaveBeenCalledTimes(1)
    })

    it('returns events unchanged when no events provided', async () => {
        const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 1)

        const results = await step([])

        expect(results).toEqual([])
        expect(mockScriptTransformer.clearCustomFunctionStates).toHaveBeenCalledTimes(1)
        expect(mockGetCustomFunctionIdsForTeams).not.toHaveBeenCalled()
    })

    it('extracts unique team IDs and fetches custom function IDs', async () => {
        mockGetCustomFunctionIdsForTeams.mockResolvedValue({ 1: ['func-1', 'func-2'] })
        mockScriptTransformer.fetchAndCacheCustomFunctionStates.mockResolvedValue(undefined)

        const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 1)
        const team = createTestTeam({ id: 1 })
        const inputs = [createTestInput(team), createTestInput(team), createTestInput(team)]

        await step(inputs)

        expect(mockGetCustomFunctionIdsForTeams).toHaveBeenCalledWith([1], ['transformation'])
    })

    it('handles multiple teams and deduplicates team IDs', async () => {
        mockGetCustomFunctionIdsForTeams.mockResolvedValue({
            1: ['func-1'],
            2: ['func-2'],
            3: ['func-3'],
        })
        mockScriptTransformer.fetchAndCacheCustomFunctionStates.mockResolvedValue(undefined)

        const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 1)
        const team1 = createTestTeam({ id: 1 })
        const team2 = createTestTeam({ id: 2 })
        const team3 = createTestTeam({ id: 3 })
        const inputs = [
            createTestInput(team1),
            createTestInput(team1),
            createTestInput(team2),
            createTestInput(team3),
            createTestInput(team2),
        ]

        await step(inputs)

        expect(mockGetCustomFunctionIdsForTeams).toHaveBeenCalledTimes(1)
        const calledTeamIds = mockGetCustomFunctionIdsForTeams.mock.calls[0][0]
        expect(calledTeamIds).toHaveLength(3)
        expect(calledTeamIds).toContain(1)
        expect(calledTeamIds).toContain(2)
        expect(calledTeamIds).toContain(3)
    })

    it('fetches and caches custom function states when functions exist', async () => {
        mockGetCustomFunctionIdsForTeams.mockResolvedValue({
            1: ['func-1', 'func-2'],
            2: ['func-3'],
        })
        mockScriptTransformer.fetchAndCacheCustomFunctionStates.mockResolvedValue(undefined)

        const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 1)
        const inputs = [createTestInput(createTestTeam({ id: 1 })), createTestInput(createTestTeam({ id: 2 }))]

        await step(inputs)

        expect(mockScriptTransformer.fetchAndCacheCustomFunctionStates).toHaveBeenCalledWith(['func-1', 'func-2', 'func-3'])
    })

    it('does not fetch custom function states when no functions exist', async () => {
        mockGetCustomFunctionIdsForTeams.mockResolvedValue({})

        const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 1)
        const inputs = [createTestInput(createTestTeam({ id: 1 }))]

        await step(inputs)

        expect(mockScriptTransformer.fetchAndCacheCustomFunctionStates).not.toHaveBeenCalled()
    })

    it('returns all events as OK results unchanged', async () => {
        mockGetCustomFunctionIdsForTeams.mockResolvedValue({ 1: ['func-1'] })
        mockScriptTransformer.fetchAndCacheCustomFunctionStates.mockResolvedValue(undefined)

        const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 1)
        const team = createTestTeam({ id: 1 })
        const inputs = [
            { team, extraField: 'value1' },
            { team, extraField: 'value2' },
        ]

        const results = await step(inputs)

        expect(results).toHaveLength(2)
        expect(results[0].type).toBe(PipelineResultType.OK)
        expect(results[1].type).toBe(PipelineResultType.OK)
        if (results[0].type === PipelineResultType.OK && results[1].type === PipelineResultType.OK) {
            expect(results[0].value).toEqual(inputs[0])
            expect(results[1].value).toEqual(inputs[1])
        }
    })

    it('handles teams with empty custom function arrays', async () => {
        mockGetCustomFunctionIdsForTeams.mockResolvedValue({
            1: [],
            2: [],
        })

        const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 1)
        const inputs = [createTestInput(createTestTeam({ id: 1 })), createTestInput(createTestTeam({ id: 2 }))]

        await step(inputs)

        expect(mockScriptTransformer.fetchAndCacheCustomFunctionStates).not.toHaveBeenCalled()
    })

    describe('sampling rate', () => {
        let mockRandom: jest.SpyInstance

        beforeEach(() => {
            mockRandom = jest.spyOn(Math, 'random')
        })

        afterEach(() => {
            mockRandom.mockRestore()
        })

        it('prefetches when random value is below sample rate', async () => {
            mockRandom.mockReturnValue(0.2)
            mockGetCustomFunctionIdsForTeams.mockResolvedValue({ 1: ['func-1'] })
            mockScriptTransformer.fetchAndCacheCustomFunctionStates.mockResolvedValue(undefined)

            const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 0.3)
            const inputs = [createTestInput(createTestTeam({ id: 1 }))]

            await step(inputs)

            expect(mockScriptTransformer.clearCustomFunctionStates).toHaveBeenCalled()
            expect(mockGetCustomFunctionIdsForTeams).toHaveBeenCalled()
            expect(mockScriptTransformer.fetchAndCacheCustomFunctionStates).toHaveBeenCalledWith(['func-1'])
        })

        it('skips prefetching when random value is above sample rate', async () => {
            mockRandom.mockReturnValue(0.4)

            const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 0.3)
            const inputs = [createTestInput(createTestTeam({ id: 1 }))]

            await step(inputs)

            expect(mockScriptTransformer.clearCustomFunctionStates).not.toHaveBeenCalled()
            expect(mockGetCustomFunctionIdsForTeams).not.toHaveBeenCalled()
            expect(mockScriptTransformer.fetchAndCacheCustomFunctionStates).not.toHaveBeenCalled()
        })

        it('skips prefetching when random value equals sample rate', async () => {
            mockRandom.mockReturnValue(0.3)

            const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 0.3)
            const inputs = [createTestInput(createTestTeam({ id: 1 }))]

            await step(inputs)

            // 0.3 < 0.3 is false, so should skip
            expect(mockScriptTransformer.clearCustomFunctionStates).not.toHaveBeenCalled()
            expect(mockGetCustomFunctionIdsForTeams).not.toHaveBeenCalled()
        })

        it('always prefetches when sample rate is 1', async () => {
            mockRandom.mockReturnValue(0.999)
            mockGetCustomFunctionIdsForTeams.mockResolvedValue({ 1: ['func-1'] })
            mockScriptTransformer.fetchAndCacheCustomFunctionStates.mockResolvedValue(undefined)

            const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 1)
            const inputs = [createTestInput(createTestTeam({ id: 1 }))]

            await step(inputs)

            expect(mockScriptTransformer.clearCustomFunctionStates).toHaveBeenCalled()
            expect(mockGetCustomFunctionIdsForTeams).toHaveBeenCalled()
        })

        it('skips prefetching when sample rate is 0', async () => {
            mockRandom.mockReturnValue(0.5)

            const step = createPrefetchCustomFunctionsStep(mockScriptTransformer, 0)
            const inputs = [createTestInput(createTestTeam({ id: 1 }))]

            await step(inputs)

            expect(mockScriptTransformer.clearCustomFunctionStates).not.toHaveBeenCalled()
            expect(mockGetCustomFunctionIdsForTeams).not.toHaveBeenCalled()
        })
    })
})
