import { expectLogic } from 'kea-test-utils'

import api from 'lib/api'

import { initKeaTests } from '~/test/init'
import { InsightsFunctionType } from '~/types'

import { insightsFunctionBackfillsLogic } from './insightsFunctionBackfillsLogic'

// Mock only the insightsFunctions namespace on the default api export — replacing the module
// object wholesale would leave `api.query` & co undefined for connected logics
jest.mock('lib/api', () => {
    const actual = jest.requireActual('lib/api')
    return {
        ...actual,
        __esModule: true,
        default: {
            ...actual.default,
            insightsFunctions: {
                get: jest.fn(),
                getTemplate: jest.fn(),
                update: jest.fn(),
                create: jest.fn(),
                enableBackfills: jest.fn(),
            },
        },
    }
})

jest.mock('lib/utils/product-intents', () => ({
    addProductIntent: jest.fn().mockResolvedValue(null),
}))

const mockApi = api.insightsFunctions as jest.Mocked<typeof api.insightsFunctions>

const MOCK_FN_FUNCTION_ID = 'script-func-001'
const MOCK_BATCH_EXPORT_ID = 'batch-export-from-script-func'

function makeInsightsFunction(overrides: Partial<InsightsFunctionType> = {}): InsightsFunctionType {
    return {
        id: MOCK_FN_FUNCTION_ID,
        type: 'destination',
        name: 'Test Destination',
        description: '',
        created_at: '2024-01-01T00:00:00Z',
        created_by: {} as any,
        updated_at: '2024-01-01T00:00:00Z',
        enabled: true,
        script: '',
        inputs_schema: [],
        inputs: {},
        filters: {},
        icon_url: null,
        template: null,
        masking: null,
        ...overrides,
    } as InsightsFunctionType
}

describe('insightsFunctionBackfillsLogic', () => {
    let logic: ReturnType<typeof insightsFunctionBackfillsLogic.build>

    beforeEach(() => {
        jest.clearAllMocks()
        initKeaTests()
    })

    it('calls enableInsightsFunctionBackfills when batch_export_id is missing', async () => {
        mockApi.get.mockResolvedValue(makeInsightsFunction())
        mockApi.enableBackfills.mockResolvedValue({} as any)

        logic = insightsFunctionBackfillsLogic({ id: MOCK_FN_FUNCTION_ID })
        logic.mount()
        await expectLogic(logic).toFinishAllListeners()

        expect(mockApi.enableBackfills).toHaveBeenCalledWith(MOCK_FN_FUNCTION_ID)
    })

    it('does not call enableInsightsFunctionBackfills when batch_export_id is already set', async () => {
        mockApi.get.mockResolvedValue(makeInsightsFunction({ batch_export_id: MOCK_BATCH_EXPORT_ID }))

        logic = insightsFunctionBackfillsLogic({ id: MOCK_FN_FUNCTION_ID })
        logic.mount()
        await expectLogic(logic).toFinishAllListeners()

        expect(mockApi.enableBackfills).not.toHaveBeenCalled()
    })

    it('does not throw when enableBackfills API fails', async () => {
        mockApi.get.mockResolvedValue(makeInsightsFunction())
        mockApi.enableBackfills.mockRejectedValue(new Error('Network error'))

        logic = insightsFunctionBackfillsLogic({ id: MOCK_FN_FUNCTION_ID })
        logic.mount()
        await expectLogic(logic).toDispatchActions(['enableInsightsFunctionBackfills']).toFinishAllListeners()

        // The error is caught gracefully — logic stays mounted and isn't in a broken state
        expect(mockApi.enableBackfills).toHaveBeenCalled()
        expect(logic.isMounted()).toBeTruthy()
    })
})
