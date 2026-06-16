import { mockFetch } from '~/tests/helpers/mocks/request.mock'

import { DateTime } from 'luxon'

import { FixtureInsightsFlowBuilder } from '~/cdp/_tests/builders/insightsflow.builder'
import { insertInsightsFunctionTemplate, insertIntegration } from '~/cdp/_tests/fixtures'
import { createExampleInsightsFlowInvocation } from '~/cdp/_tests/fixtures-insightsflows'
import { createInvocationResult } from '~/cdp/utils/invocation-utils'
import { getFirstTeam, resetTestDatabase } from '~/tests/helpers/sql'
import { Hub, Team } from '~/types'
import { closeHub, createHub } from '~/utils/db/hub'

import { InsightsFlowAction } from '../../../../schema/insightsflow'
import { CyclotronJobInvocationInsightsFlow, DBInsightsFunctionTemplate } from '../../../types'
import { ScriptExecutorService } from '../../script-executor.service'
import { InsightsFunctionTemplateManagerService } from '../../managers/insights-function-template-manager.service'
import { RecipientPreferencesService } from '../../messaging/recipient-preferences.service'
import { InsightsFlowFunctionsService } from '../insightsflow-functions.service'
import { findActionByType } from '../insightsflow-utils'
import { InsightsFunctionHandler } from './insights_function'

describe('InsightsFunctionHandler', () => {
    let hub: Hub
    let team: Team
    let insightsFunctionHandler: InsightsFunctionHandler
    let mockInsightsFunctionExecutor: ScriptExecutorService
    let mockInsightsFunctionTemplateManager: InsightsFunctionTemplateManagerService
    let mockInsightsFlowFunctionsService: InsightsFlowFunctionsService
    let mockRecipientPreferencesService: RecipientPreferencesService

    let invocation: CyclotronJobInvocationInsightsFlow
    let action: Extract<InsightsFlowAction, { type: 'function' }>
    let template: DBInsightsFunctionTemplate

    beforeEach(async () => {
        await resetTestDatabase()
        hub = await createHub()
        team = await getFirstTeam(hub)

        mockInsightsFunctionExecutor = new ScriptExecutorService(hub)
        mockInsightsFunctionTemplateManager = new InsightsFunctionTemplateManagerService(hub.postgres)
        mockInsightsFlowFunctionsService = new InsightsFlowFunctionsService(
            hub.SITE_URL,
            mockInsightsFunctionTemplateManager,
            mockInsightsFunctionExecutor
        )
        mockRecipientPreferencesService = {
            shouldSkipAction: jest.fn().mockResolvedValue(false),
        } as any
        insightsFunctionHandler = new InsightsFunctionHandler(
            mockInsightsFlowFunctionsService,
            mockRecipientPreferencesService,
            'fetch'
        )

        // Simple custom function that prints the inputs

        template = await insertInsightsFunctionTemplate(hub.postgres, {
            id: 'template-test-customflow-executor',
            name: 'Test Template',
            code: `fetch('http://localhost/test', { 'method': 'POST', 'body': inputs })`,
            inputs_schema: [
                {
                    key: 'name',
                    type: 'string',
                    required: true,
                },
                {
                    key: 'oauth',
                    type: 'integration',
                    required: true,
                },
            ],
        })

        await insertIntegration(hub.postgres, team.id, {
            id: 1,
            kind: 'slack',
            config: { team: 'foobar' },
            sensitive_config: {
                access_token: hub.encryptedFields.encrypt('token'),
                not_encrypted: 'not-encrypted',
            },
        })

        const insightsFlow = new FixtureInsightsFlowBuilder()
            .withTeamId(team.id)
            .withWorkflow({
                actions: {
                    function: {
                        type: 'function',
                        config: {
                            template_id: template.template_id,
                            inputs: {
                                name: {
                                    value: 'John Doe',
                                },
                                oauth: {
                                    value: 1,
                                },
                            },
                            mappings: [
                                {
                                    name: 'input mapping field',
                                },
                            ],
                        },
                    },
                    exit: {
                        type: 'exit',
                        config: {},
                    },
                },
                edges: [
                    {
                        from: 'function',
                        to: 'exit',
                        type: 'continue',
                    },
                ],
            })
            .build()

        action = findActionByType(insightsFlow, 'function')!
        invocation = createExampleInsightsFlowInvocation(insightsFlow)

        invocation.state.currentAction = {
            id: action.id,
            startedAtTimestamp: DateTime.utc().toMillis(),
        }
    })

    afterEach(async () => {
        await closeHub(hub)
    })

    it('should execute a custom function with integration inputs and continue', async () => {
        const invocationResult = createInvocationResult<CyclotronJobInvocationInsightsFlow>(invocation, {
            queue: 'fn',
            queuePriority: 0,
        })

        const handlerResult = await insightsFunctionHandler.execute({ invocation, action, result: invocationResult })

        expect(mockFetch.mock.calls).toMatchInlineSnapshot(`
            [
              [
                "http://localhost/test",
                {
                  "body": "{"name":"John Doe","oauth":{"team":"foobar","access_token":"token","not_encrypted":"not-encrypted","access_token_raw":"token"}}",
                  "headers": {
                    "Content-Type": "application/json",
                  },
                  "method": "POST",
                },
              ],
            ]
        `)

        expect(handlerResult.nextAction?.id).toBe('exit')
        expect(invocationResult.logs).toHaveLength(1)
        expect(invocationResult.logs[0].message).toContain('[Action:function] Function completed')
    })

    it('should throw an error if template is not found', async () => {
        const action = findActionByType(invocation.insightsFlow, 'function')!
        action.config.template_id = 'template_123'

        const invocationResult = createInvocationResult<CyclotronJobInvocationInsightsFlow>(invocation, {
            queue: 'fn',
            queuePriority: 0,
        })

        await expect(insightsFunctionHandler.execute({ invocation, action, result: invocationResult })).rejects.toThrow(
            "Template 'template_123' not found"
        )
    })

    it('should check recipient preferences before execution', async () => {
        const invocationResult = createInvocationResult<CyclotronJobInvocationInsightsFlow>(invocation, {
            queue: 'fn',
            queuePriority: 0,
        })

        await insightsFunctionHandler.execute({ invocation, action, result: invocationResult })

        const callArgs = (mockRecipientPreferencesService.shouldSkipAction as jest.Mock).mock.calls[0]
        expect(callArgs[0]).toBeTruthy()
        expect(callArgs[1]).toBe(action)
    })

    it('should pass proper inputs to buildInsightsFunctionInvocation', async () => {
        const buildInsightsFunctionInvocationSpy = jest.spyOn(mockInsightsFlowFunctionsService, 'buildInsightsFunctionInvocation')

        const invocationResult = createInvocationResult<CyclotronJobInvocationInsightsFlow>(invocation, {
            queue: 'fn',
            queuePriority: 0,
        })

        await insightsFunctionHandler.execute({ invocation, action, result: invocationResult })

        const calledConfig = buildInsightsFunctionInvocationSpy.mock.calls[0][1]
        expect(calledConfig.inputs).toEqual({
            name: {
                value: 'John Doe',
            },
            oauth: {
                value: 1,
            },
        })
        expect(calledConfig.inputs_schema).toEqual([
            {
                key: 'name',
                type: 'string',
                required: true,
            },
            {
                key: 'oauth',
                type: 'integration',
                required: true,
            },
        ])
        expect(calledConfig.template_id).toEqual(template.template_id)
        expect(calledConfig.mappings).toEqual([{ name: 'input mapping field' }])
    })

    it('should skip execution if recipient preferences service returns true', async () => {
        ;(mockRecipientPreferencesService.shouldSkipAction as jest.Mock).mockResolvedValueOnce(true)

        const invocationResult = createInvocationResult<CyclotronJobInvocationInsightsFlow>(invocation, {
            queue: 'fn',
            queuePriority: 0,
        })

        const handlerResult = await insightsFunctionHandler.execute({ invocation, action, result: invocationResult })

        const callArgs = (mockRecipientPreferencesService.shouldSkipAction as jest.Mock).mock.calls[0]
        expect(callArgs[0]).toBeTruthy()
        expect(callArgs[1]).toBe(action)
        expect(handlerResult.nextAction?.id).toBe('exit')
        expect(invocationResult.logs).toHaveLength(1)
        expect(invocationResult.logs[0].message).toContain(
            `[Action:function] Recipient has opted out, skipping message delivery.`
        )
        expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should emit a single billable_invocation metric upon function completion', async () => {
        const invocationResult = createInvocationResult<CyclotronJobInvocationInsightsFlow>(invocation, {
            queue: 'fn',
            queuePriority: 0,
        })

        await insightsFunctionHandler.execute({ invocation, action, result: invocationResult })

        const billableMetrics = invocationResult.metrics.filter(
            (metric) => metric.metric_name === 'billable_invocation' && metric.metric_kind === 'fetch'
        )

        expect(billableMetrics).toHaveLength(1)

        expect(billableMetrics[0]).toMatchObject({
            team_id: team.id,
            app_source_id: invocation.functionId,
            instance_id: invocation.id,
            metric_kind: 'fetch',
            metric_name: 'billable_invocation',
            count: 1,
        })
    })

    it('should emit a billable_invocation metric with email kind when billingMetricType is email', async () => {
        insightsFunctionHandler = new InsightsFunctionHandler(
            mockInsightsFlowFunctionsService,
            mockRecipientPreferencesService,
            'email'
        )

        const invocationResult = createInvocationResult<CyclotronJobInvocationInsightsFlow>(invocation, {
            queue: 'fn',
            queuePriority: 0,
        })

        await insightsFunctionHandler.execute({ invocation, action, result: invocationResult })

        const billableMetrics = invocationResult.metrics.filter(
            (metric) => metric.metric_name === 'billable_invocation' && metric.metric_kind === 'email'
        )

        expect(billableMetrics).toHaveLength(1)

        expect(billableMetrics[0]).toMatchObject({
            team_id: team.id,
            app_source_id: invocation.functionId,
            instance_id: invocation.id,
            metric_kind: 'email',
            metric_name: 'billable_invocation',
            count: 1,
        })
    })

    it('should not emit a billable_invocation metric if function is not finished', async () => {
        // Mock the executeWithAsyncFunctions to return a non-finished result
        jest.spyOn(mockInsightsFlowFunctionsService, 'executeWithAsyncFunctions').mockResolvedValueOnce({
            finished: false,
            invocation: invocation as any,
            logs: [],
            metrics: [],
            capturedInsightsEvents: [],
        })

        const invocationResult = createInvocationResult<CyclotronJobInvocationInsightsFlow>(invocation, {
            queue: 'fn',
            queuePriority: 0,
        })

        await insightsFunctionHandler.execute({ invocation, action, result: invocationResult })

        const billableMetrics = invocationResult.metrics.filter(
            (metric) => metric.metric_name === 'billable_invocation' && metric.metric_kind === 'fetch'
        )

        expect(billableMetrics).toHaveLength(0)
    })

    it('should not emit a billable_invocation metric when recipient opts out', async () => {
        ;(mockRecipientPreferencesService.shouldSkipAction as jest.Mock).mockResolvedValueOnce(true)

        const invocationResult = createInvocationResult<CyclotronJobInvocationInsightsFlow>(invocation, {
            queue: 'fn',
            queuePriority: 0,
        })

        await insightsFunctionHandler.execute({ invocation, action, result: invocationResult })

        const billableMetrics = invocationResult.metrics.filter(
            (metric) => metric.metric_name === 'billable_invocation'
        )

        // Ensure NO billing metrics are emitted when recipient has opted out
        expect(billableMetrics).toHaveLength(0)

        // Verify the function was still marked as finished with the right log
        expect(invocationResult.logs).toHaveLength(1)
        expect(invocationResult.logs[0].message).toContain('Recipient has opted out')
    })
})
