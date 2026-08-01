import { ApiError } from 'lib/api'
import { toast } from 'lib/elements/Toast/Toast'

import { initKeaTests } from '~/test/init'
import { expectLogic } from '~/test/keaTestUtils'

import { dataCatalogMetricSceneLogic } from './dataCatalogMetricSceneLogic'
import {
    dataCatalogMetricsApproveCreate,
    dataCatalogMetricsPartialUpdate,
    dataCatalogMetricsRetrieve,
    dataCatalogMetricsRunCreate,
} from './generated/api'
import type { DataCatalogMetricApi, DataCatalogMetricRunApi } from './generated/api.schemas'

jest.mock('lib/api', () => {
    class ApiError extends Error {
        status?: number
        detail: string | null
        constructor(message?: string, status?: number, _headers?: unknown, data?: { detail?: string }) {
            super(message)
            this.status = status
            this.detail = data?.detail ?? null
        }
    }
    return {
        __esModule: true,
        default: {},
        ApiConfig: { getCurrentTeamId: jest.fn(() => 1) },
        ApiError,
    }
})

jest.mock('lib/elements/Toast/Toast', () => ({
    toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() },
}))

jest.mock('./generated/api', () => ({
    dataCatalogMetricsRetrieve: jest.fn(),
    dataCatalogMetricsApproveCreate: jest.fn(),
    dataCatalogMetricsRefreshFromInsightCreate: jest.fn(),
    dataCatalogMetricsPartialUpdate: jest.fn(),
    dataCatalogMetricsDestroy: jest.fn(),
    dataCatalogMetricsRunCreate: jest.fn(),
}))

function buildMetric(overrides: Partial<DataCatalogMetricApi> = {}): DataCatalogMetricApi {
    return {
        id: 'metric-1',
        name: 'weekly_active_users',
        description: 'Weekly active users',
        definition_kind: 'InsightsQLQuery',
        definition: { kind: 'InsightsQLQuery', query: 'SELECT 1' },
        status: 'approved',
        is_drifted: false,
        owner: null,
        ...overrides,
    } as DataCatalogMetricApi
}

describe('dataCatalogMetricSceneLogic', () => {
    let logic: ReturnType<typeof dataCatalogMetricSceneLogic.build>

    beforeEach(async () => {
        jest.clearAllMocks()
        ;(dataCatalogMetricsRetrieve as jest.Mock).mockResolvedValue(buildMetric())
        initKeaTests()
        logic = dataCatalogMetricSceneLogic({ name: 'weekly_active_users' })
        logic.mount()
        await expectLogic(logic).toDispatchActions(['loadMetricSuccess'])
    })

    it('saving an approved metric edit reflects the proposed status from the response', async () => {
        ;(dataCatalogMetricsPartialUpdate as jest.Mock).mockResolvedValue(
            buildMetric({ status: 'proposed', definition: { kind: 'InsightsQLQuery', query: 'SELECT 2' } })
        )

        logic.actions.updateMetric({ definition: { kind: 'InsightsQLQuery', query: 'SELECT 2' } })
        await expectLogic(logic).toFinishAllListeners()

        expect(logic.values.metric?.status).toEqual('proposed')
    })

    it('surfaces refresh when approve returns 409 and leaves the metric untouched', async () => {
        ;(dataCatalogMetricsApproveCreate as jest.Mock).mockRejectedValue(new ApiError('drifted', 409))

        logic.actions.approveMetric()
        await expectLogic(logic).toFinishAllListeners()

        expect(logic.values.metric?.status).toEqual('approved')
        const errorCall = (toast.error as jest.Mock).mock.calls.at(-1)
        expect(errorCall?.[1]?.button?.label).toEqual('Refresh from insight')
    })

    it('stores the run result envelope', async () => {
        const envelope: Partial<DataCatalogMetricRunApi> = {
            status: 'approved',
            results: [{ value: 5 }],
            instructions: null,
            compiled_query: 'SELECT count()',
            insights_url: 'https://us.hanzo.ai/project/1/sql',
        }
        ;(dataCatalogMetricsRunCreate as jest.Mock).mockResolvedValue(envelope)

        logic.actions.loadRunResult()
        await expectLogic(logic).toFinishAllListeners()

        expect(logic.values.runResult?.compiled_query).toEqual('SELECT count()')
    })

    it('issues no requests for a traversal-shaped metric name', async () => {
        // props.name is interpolated unencoded into the request path, so a "../"-shaped route
        // value must never reach retrieve/run/approve/refresh/update/delete.
        jest.clearAllMocks()
        const traversalLogic = dataCatalogMetricSceneLogic({ name: '../../../1/data_catalog/metrics/other' })
        traversalLogic.mount()
        await expectLogic(traversalLogic).toDispatchActions(['loadMetricFailure'])

        traversalLogic.actions.approveMetric()
        traversalLogic.actions.refreshMetricFromInsight()
        traversalLogic.actions.updateMetric({ definition: { kind: 'InsightsQLQuery', query: 'SELECT 2' } })
        traversalLogic.actions.deleteMetric()
        traversalLogic.actions.loadRunResult()
        await expectLogic(traversalLogic).toFinishAllListeners()

        expect(dataCatalogMetricsRetrieve).not.toHaveBeenCalled()
        expect(dataCatalogMetricsRunCreate).not.toHaveBeenCalled()
        expect(dataCatalogMetricsApproveCreate).not.toHaveBeenCalled()
        expect(dataCatalogMetricsPartialUpdate).not.toHaveBeenCalled()

        traversalLogic.unmount()
    })
})
