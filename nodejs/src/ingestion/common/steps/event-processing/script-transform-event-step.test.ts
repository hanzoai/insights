import { ScriptTransformerService, TransformationResult } from '~/cdp/script-transformations/script-transformer.service'
import { PipelineResultType, isDropResult, isOkResult } from '~/ingestion/framework/results'
import { PluginEvent } from '~/plugin-scaffold'
import { createTestPluginEvent } from '~/tests/helpers/plugin-event'
import { createTestTeam } from '~/tests/helpers/team'

import { ScriptTransformEventInput, createScriptTransformEventStep } from './script-transform-event-step'

type MockScriptTransformer = Pick<ScriptTransformerService, 'transformEventAndProduceMessages'>

const createTestInput = (): ScriptTransformEventInput => {
    return {
        event: createTestPluginEvent({
            event: '$pageview',
            distinct_id: 'user-1',
            properties: { $current_url: 'https://example.com' },
        }),
        team: createTestTeam(),
    }
}

const createMockScriptTransformer = (transformFn: (event: PluginEvent) => TransformationResult): MockScriptTransformer => {
    return {
        transformEventAndProduceMessages: jest.fn((event) => Promise.resolve(transformFn(event))),
    }
}

describe('createScriptTransformEventStep', () => {
    it('passes through unchanged when no transformer configured', async () => {
        const scriptTransformEventStep = createScriptTransformEventStep(null)
        const input = createTestInput()

        const result = await scriptTransformEventStep(input)

        expect(result.type).toBe(PipelineResultType.OK)
        if (isOkResult(result)) {
            expect(result.value.event).toBe(input.event)
            expect(result.value.transformationsRun).toBe(0)
        }
    })

    it('passes through unchanged when transformer returns same event', async () => {
        const mockTransformer = createMockScriptTransformer((event) => ({
            event,
            invocationResults: [],
        }))
        const scriptTransformEventStep = createScriptTransformEventStep(mockTransformer)
        const input = createTestInput()

        const result = await scriptTransformEventStep(input)

        expect(result.type).toBe(PipelineResultType.OK)
        expect(mockTransformer.transformEventAndProduceMessages).toHaveBeenCalledWith(input.event)
        if (isOkResult(result)) {
            expect(result.value.transformationsRun).toBe(0)
        }
    })

    it('drops event when transformation returns null and emits a warning naming the transformation', async () => {
        const mockTransformer = createMockScriptTransformer(() => ({
            event: null,
            invocationResults: [],
            droppedBy: { id: 'script-fn-1', name: 'Drop internal users' },
        }))
        const scriptTransformEventStep = createScriptTransformEventStep(mockTransformer)
        const input = createTestInput()

        const result = await scriptTransformEventStep(input)

        expect(result.type).toBe(PipelineResultType.DROP)
        if (isDropResult(result)) {
            expect(result.reason).toBe('dropped_by_transformation')
            expect(result.warnings).toEqual([
                {
                    type: 'event_dropped_by_transformation',
                    details: {
                        eventUuid: input.event.uuid,
                        event: '$pageview',
                        distinctId: 'user-1',
                        transformationId: 'script-fn-1',
                        transformationName: 'Drop internal users',
                    },
                    pipelineStep: 'script-transform',
                    key: 'script-fn-1',
                },
            ])
        }
    })

    it('returns transformed event with modified properties', async () => {
        const mockTransformer = createMockScriptTransformer((event) => ({
            event: {
                ...event,
                properties: { ...event.properties, transformed: true },
            },
            invocationResults: [{} as any],
        }))
        const scriptTransformEventStep = createScriptTransformEventStep(mockTransformer)
        const input = createTestInput()

        const result = await scriptTransformEventStep(input)

        expect(result.type).toBe(PipelineResultType.OK)
        if (isOkResult(result)) {
            expect(result.value.event.properties).toMatchObject({
                $current_url: 'https://example.com',
                transformed: true,
            })
            expect(result.value.transformationsRun).toBe(1)
        }
    })

    it('returns transformed event with modified event name', async () => {
        const mockTransformer = createMockScriptTransformer((event) => ({
            event: {
                ...event,
                event: 'custom_event',
            },
            invocationResults: [{} as any],
        }))
        const scriptTransformEventStep = createScriptTransformEventStep(mockTransformer)
        const input = createTestInput()

        const result = await scriptTransformEventStep(input)

        expect(result.type).toBe(PipelineResultType.OK)
        if (isOkResult(result)) {
            expect(result.value.event.event).toBe('custom_event')
            expect(result.value.transformationsRun).toBe(1)
        }
    })

    it('returns transformed event with modified distinct_id', async () => {
        const mockTransformer = createMockScriptTransformer((event) => ({
            event: {
                ...event,
                distinct_id: 'new-user-id',
            },
            invocationResults: [{} as any],
        }))
        const scriptTransformEventStep = createScriptTransformEventStep(mockTransformer)
        const input = createTestInput()

        const result = await scriptTransformEventStep(input)

        expect(result.type).toBe(PipelineResultType.OK)
        if (isOkResult(result)) {
            expect(result.value.event.distinct_id).toBe('new-user-id')
            expect(result.value.transformationsRun).toBe(1)
        }
    })

    it('counts multiple invocation results', async () => {
        const mockTransformer = createMockScriptTransformer((event) => ({
            event,
            invocationResults: [{} as any, {} as any, {} as any],
        }))
        const scriptTransformEventStep = createScriptTransformEventStep(mockTransformer)
        const input = createTestInput()

        const result = await scriptTransformEventStep(input)

        expect(result.type).toBe(PipelineResultType.OK)
        if (isOkResult(result)) {
            expect(result.value.transformationsRun).toBe(3)
        }
    })

    it('rethrows exceptions from the transformer', async () => {
        const mockTransformer: MockScriptTransformer = {
            transformEventAndProduceMessages: jest.fn().mockRejectedValue(new Error('transformer broke')),
        }
        const scriptTransformEventStep = createScriptTransformEventStep(mockTransformer)
        const input = createTestInput()

        await expect(scriptTransformEventStep(input)).rejects.toThrow('transformer broke')
    })
})
