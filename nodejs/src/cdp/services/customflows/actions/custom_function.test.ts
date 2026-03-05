import { mockFetch } from '~/tests/helpers/mocks/request.mock'

import { DateTime } from 'luxon'

import { FixtureCustomFlowBuilder } from '~/cdp/_tests/builders/customflow.builder'
import { insertCustomFunctionTemplate, insertIntegration } from '~/cdp/_tests/fixtures'
import { createExampleCustomFlowInvocation } from '~/cdp/_tests/fixtures-customflows'
import { createInvocationResult } from '~/cdp/utils/invocation-utils'
import { getFirstTeam, resetTestDatabase } from '~/tests/helpers/sql'
import { Hub, Team } from '~/types'
import { closeHub, createHub } from '~/utils/db/hub'

import { CustomFlowAction } from '../../../../schema/customflow'
import { CyclotronJobInvocationCustomFlow, DBCustomFunctionTemplate } from '../../../types'
import { ScriptExecutorService } from '../../script-executor.service'
import { CustomFunctionTemplateManagerService } from '../../managers/custom-function-template-manager.service'
import { RecipientPreferencesService } from '../../messaging/recipient-preferences.service'
import { CustomFlowFunctionsService } from '../customflow-functions.service'
import { findActionByType } from '../customflow-utils'
import { CustomFunctionHandler } from './custom_function'

describe('CustomFunctionHandler', () => {
    let hub: Hub
    let team: Team
    let customFunctionHandler: CustomFunctionHandler
    let mockCustomFunctionExecutor: ScriptExecutorService
    let mockCustomFunctionTemplateManager: CustomFunctionTemplateManagerService
    let mockCustomFlowFunctionsService: CustomFlowFunctionsService
    let mockRecipientPreferencesService: RecipientPreferencesService

    let invocation: CyclotronJobInvocationCustomFlow
    let action: Extract<CustomFlowAction, { type: 'function' }>
    let template: DBCustomFunctionTemplate

    beforeEach(async () => {
        await resetTestDatabase()
        hub = await createHub()
        team = await getFirstTeam(hub)

        mockCustomFunctionExecutor = new ScriptExecutorService(hub)
        mockCustomFunctionTemplateManager = new CustomFunctionTemplateManagerService(hub.postgres)
        mockCustomFlowFunctionsService = new CustomFlowFunctionsService(
            hub.SITE_URL,
            mockCustomFunctionTemplateManager,
            mockCustomFunctionExecutor
        )
        mockRecipientPreferencesService = {
            shouldSkipAction: jest.fn().mockResolvedValue(false),
        } as any
        customFunctionHandler = new CustomFunctionHandler(
            mockCustomFlowFunctionsService,
            mockRecipientPreferencesService,
            'fetch'
        )

        // Simple custom function that prints the inputs

        template = await insertCustomFunctionTemplate(hub.postgres, {
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

        const customFlow = new FixtureCustomFlowBuilder()
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

        action = findActionByType(customFlow, 'function')!
        invocation = createExampleCustomFlowInvocation(customFlow)

        invocation.state.currentAction = {
            id: action.id,
            startedAtTimestamp: DateTime.utc().toMillis(),
        }
    })

    afterEach(async () => {
        await closeHub(hub)
    })

    it('should execute a custom function with integration inputs and continue', async () => {
        const invocationResult = createInvocationResult<CyclotronJobInvocationCustomFlow>(invocation, {
            queue: 'custom_script',
            queuePriority: 0,
        })

        const handlerResult = await customFunctionHandler.execute({ invocation, action, result: invocationResult })

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
        const action = findActionByType(invocation.customFlow, 'function')!
        action.config.template_id = 'template_123'

        const invocationResult = createInvocationResult<CyclotronJobInvocationCustomFlow>(invocation, {
            queue: 'custom_script',
            queuePriority: 0,
        })

        await expect(customFunctionHandler.execute({ invocation, action, result: invocationResult })).rejects.toThrow(
            "Template 'template_123' not found"
        )
    })

    it('should check recipient preferences before execution', async () => {
        const invocationResult = createInvocationResult<CyclotronJobInvocationCustomFlow>(invocation, {
            queue: 'custom_script',
            queuePriority: 0,
        })

        await customFunctionHandler.execute({ invocation, action, result: invocationResult })

        const callArgs = (mockRecipientPreferencesService.shouldSkipAction as jest.Mock).mock.calls[0]
        expect(callArgs[0]).toBeTruthy()
        expect(callArgs[1]).toBe(action)
    })

    it('should pass proper inputs to buildCustomFunctionInvocation', async () => {
        const buildCustomFunctionInvocationSpy = jest.spyOn(mockCustomFlowFunctionsService, 'buildCustomFunctionInvocation')

        const invocationResult = createInvocationResult<CyclotronJobInvocationCustomFlow>(invocation, {
            queue: 'custom_script',
            queuePriority: 0,
        })

        await customFunctionHandler.execute({ invocation, action, result: invocationResult })

        const calledConfig = buildCustomFunctionInvocationSpy.mock.calls[0][1]
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

        const invocationResult = createInvocationResult<CyclotronJobInvocationCustomFlow>(invocation, {
            queue: 'custom_script',
            queuePriority: 0,
        })

        const handlerResult = await customFunctionHandler.execute({ invocation, action, result: invocationResult })

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
        const invocationResult = createInvocationResult<CyclotronJobInvocationCustomFlow>(invocation, {
            queue: 'custom_script',
            queuePriority: 0,
        })

        await customFunctionHandler.execute({ invocation, action, result: invocationResult })

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
        customFunctionHandler = new CustomFunctionHandler(
            mockCustomFlowFunctionsService,
            mockRecipientPreferencesService,
            'email'
        )

        const invocationResult = createInvocationResult<CyclotronJobInvocationCustomFlow>(invocation, {
            queue: 'custom_script',
            queuePriority: 0,
        })

        await customFunctionHandler.execute({ invocation, action, result: invocationResult })

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
        jest.spyOn(mockCustomFlowFunctionsService, 'executeWithAsyncFunctions').mockResolvedValueOnce({
            finished: false,
            invocation: invocation as any,
            logs: [],
            metrics: [],
            capturedInsightsEvents: [],
        })

        const invocationResult = createInvocationResult<CyclotronJobInvocationCustomFlow>(invocation, {
            queue: 'custom_script',
            queuePriority: 0,
        })

        await customFunctionHandler.execute({ invocation, action, result: invocationResult })

        const billableMetrics = invocationResult.metrics.filter(
            (metric) => metric.metric_name === 'billable_invocation' && metric.metric_kind === 'fetch'
        )

        expect(billableMetrics).toHaveLength(0)
    })

    it('should not emit a billable_invocation metric when recipient opts out', async () => {
        ;(mockRecipientPreferencesService.shouldSkipAction as jest.Mock).mockResolvedValueOnce(true)

        const invocationResult = createInvocationResult<CyclotronJobInvocationCustomFlow>(invocation, {
            queue: 'custom_script',
            queuePriority: 0,
        })

        await customFunctionHandler.execute({ invocation, action, result: invocationResult })

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
