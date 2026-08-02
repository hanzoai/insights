import { expectLogic } from 'kea-test-utils'

import { toast } from '@hanzo/elements'

import api from 'lib/api'

import { initKeaTests } from '~/test/init'
import { InsightsFunctionTemplateType, InsightsFunctionType } from '~/types'

import { insightsFunctionConfigurationLogic } from './insightsFunctionConfigurationLogic'

jest.mock('lib/api', () => ({
    ...jest.requireActual('lib/api'),
    insightsFunctions: {
        get: jest.fn(),
        getTemplate: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
    },
}))

// the mock api object

const mockApi = api.insightsFunctions as jest.Mocked<typeof api.insightsFunctions>

const FN_TEMPLATE: InsightsFunctionTemplateType = {
    free: false,
    status: 'beta',
    id: 'template-webhook',
    type: 'destination',
    name: 'HTTP Webhook',
    description: 'Sends a webhook templated by the incoming event data',
    code: "let res := fetch(inputs.url, {\n  'headers': inputs.headers,\n  'body': inputs.body,\n  'method': inputs.method\n});\n\nif (inputs.debug) {\n  print('Response', res.status, res.body);\n}",
    code_language: 'script',
    inputs_schema: [
        {
            key: 'url',
            type: 'string',
            label: 'Webhook URL',
            secret: false,
            required: true,
        },
        {
            key: 'method',
            type: 'choice',
            label: 'Method',
            secret: false,
            choices: [
                {
                    label: 'POST',
                    value: 'POST',
                },
                {
                    label: 'PUT',
                    value: 'PUT',
                },
                {
                    label: 'PATCH',
                    value: 'PATCH',
                },
                {
                    label: 'GET',
                    value: 'GET',
                },
                {
                    label: 'DELETE',
                    value: 'DELETE',
                },
            ],
            default: 'POST',
            required: false,
        },
        {
            key: 'body',
            type: 'json',
            label: 'JSON Body',
            default: {
                event: '{event}',
                person: '{person}',
            },
            secret: false,
            required: false,
        },
        {
            key: 'headers',
            type: 'dictionary',
            label: 'Headers',
            secret: false,
            required: false,
        },
        {
            key: 'debug',
            type: 'boolean',
            label: 'Log responses',
            description: 'Logs the response of http calls for debugging.',
            secret: false,
            required: false,
            default: false,
        },
    ],
    filters: null,
    masking: null,
    icon_url: '/static/insights-icon.svg',
}

const FN_FUNCTION: InsightsFunctionType = {
    ...FN_TEMPLATE,
    script: FN_TEMPLATE.code,
    description: typeof FN_TEMPLATE.description === 'string' ? FN_TEMPLATE.description : '',
    created_at: '2021-09-29T14:00:00Z',
    created_by: {} as any,
    id: '123-456-789',
    updated_at: '2021-09-29T14:00:00Z',
    enabled: true,
    status: undefined,
}

describe('insightsFunctionConfigurationLogic', () => {
    let logic: ReturnType<typeof insightsFunctionConfigurationLogic.build>

    describe('template', () => {
        beforeEach(() => {
            initKeaTests()

            mockApi.getTemplate.mockReturnValue(Promise.resolve(FN_TEMPLATE))
            mockApi.create.mockReturnValue(Promise.resolve(FN_FUNCTION))
            mockApi.update.mockReturnValue(Promise.resolve(FN_FUNCTION))

            logic = insightsFunctionConfigurationLogic({
                templateId: 'test',
            })
        })

        it('has expected defaults', async () => {
            logic.mount()
            await expectLogic(logic).toDispatchActions(['loadTemplate', 'loadTemplateSuccess'])

            expect(logic.values.template).toEqual(FN_TEMPLATE)
            expect(logic.values.configuration).toEqual({
                name: FN_TEMPLATE.name,
                type: FN_TEMPLATE.type,
                description: FN_TEMPLATE.description,
                inputs_schema: FN_TEMPLATE.inputs_schema,
                filters: null,
                script: FN_TEMPLATE.code,
                icon_url: FN_TEMPLATE.icon_url,
                inputs: {
                    method: { value: 'POST' },
                    body: {
                        value: {
                            event: '{event}',
                            person: '{person}',
                        },
                    },
                    debug: {
                        value: false,
                    },
                },
                enabled: true,
            })
        })

        it('sets rejects submission if missing inputs', async () => {
            logic.mount()
            await expectLogic(logic).toDispatchActions(['loadTemplate', 'loadTemplateSuccess'])

            await expectLogic(logic, () => {
                logic.actions.submitConfiguration()
            }).toDispatchActions(['submitConfigurationFailure'])

            expect(logic.values.configurationErrors).toMatchObject({
                inputs: {
                    url: 'This field is required',
                },
            })
        })

        it('saves if form valid', async () => {
            logic.mount()
            await expectLogic(logic).toDispatchActions(['loadTemplate', 'loadTemplateSuccess'])
            logic.actions.setConfigurationValue('inputs.url', { value: 'https://hanzo.ai' })

            await expectLogic(logic, () => {
                logic.actions.submitConfiguration()
            }).toDispatchActions(['upsertInsightsFunction', 'submitConfigurationSuccess'])
        })
    })

    describe('log transformation', () => {
        const LOG_TEMPLATE: InsightsFunctionTemplateType = {
            free: true,
            status: 'stable',
            id: 'template-log-transformation-default',
            type: 'transformation_log',
            name: 'Custom log transformation',
            description: 'Start from scratch.',
            code: 'return record',
            code_language: 'script',
            inputs_schema: [],
            filters: null,
            masking: null,
            icon_url: '/static/mascot/builder-script-01.png',
        }

        beforeEach(() => {
            initKeaTests()
            mockApi.getTemplate.mockReturnValue(Promise.resolve(LOG_TEMPLATE))
            logic = insightsFunctionConfigurationLogic({ templateId: 'test' })
            logic.mount()
        })

        it('seeds the inline tester with a sample record, not an event', async () => {
            await expectLogic(logic).toDispatchActions(['loadTemplate', 'loadTemplateSuccess'])
            const globals = logic.values.exampleInvocationGlobals
            expect(globals.record).toBeTruthy()
            expect(globals.record?.body).toContain('GET /api/users')
            expect(globals.event).toBeUndefined()
        })

        it('surfaces validation errors on `type` as a toast, since no form field renders them', async () => {
            // The feature-flag gate and the enabled-function cap both reject with attr `type`;
            // without the toast the Save button fails with no visible feedback at all.
            const toastSpy = jest.spyOn(toast, 'error').mockImplementation(() => 'id')
            const detail = 'Log transformations are not enabled for this team.'
            mockApi.create.mockRejectedValue({
                status: 400,
                data: { type: 'validation_error', code: 'invalid_input', attr: 'type', detail },
            })
            await expectLogic(logic).toDispatchActions(['loadTemplate', 'loadTemplateSuccess'])

            await expectLogic(logic, () => {
                logic.actions.submitConfiguration()
            }).toDispatchActions(['upsertInsightsFunctionFailure'])

            expect(toastSpy).toHaveBeenCalledWith(detail)
        })
    })
})
