import { expectLogic } from 'kea-test-utils'

import { toast } from '@hanzo/elements'

import { useMocks } from '~/mocks/jest'
import { initKeaTests } from '~/test/init'

import { logsViewerDataLogic } from './logsViewerDataLogic'

jest.mock('@hanzo/elements', () => ({
    ...jest.requireActual('@hanzo/elements'),
    toast: {
        error: jest.fn(),
    },
}))

describe('logsViewerDataLogic', () => {
    let logic: ReturnType<typeof logsViewerDataLogic.build>

    beforeEach(async () => {
        useMocks({
            post: {
                '/api/environments/:team_id/logs/query/': () => [200, { results: [], maxExportableLogs: 5000 }],
                '/api/environments/:team_id/logs/sparkline/': () => [200, []],
            },
        })
        initKeaTests()
        logic = logsViewerDataLogic({ id: 'test-tab' })
        logic.mount()

        await expectLogic(logic).toFinishAllListeners()
    })

    afterEach(() => {
        logic.unmount()
    })

    describe('error handling', () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })

        it.each([
            ['new query started', 'exact match for NEW_QUERY_STARTED_ERROR_MESSAGE'],
            ['Fetch is aborted', 'Safari abort message'],
            ['The operation was aborted', 'alternative abort message'],
            ['ABORTED', 'uppercase abort'],
            ['Request aborted by user', 'abort substring'],
        ])('suppresses fetchLogs error "%s" (%s)', async (error) => {
            logic.actions.fetchLogsFailure(error)
            await expectLogic(logic).toFinishAllListeners()

            expect(toast.error).not.toHaveBeenCalled()
        })

        it.each([['Network error'], ['Server returned 500'], ['Timeout exceeded']])(
            'shows toast for legitimate fetchLogs error "%s"',
            async (error) => {
                logic.actions.fetchLogsFailure(error)
                await expectLogic(logic).toFinishAllListeners()

                expect(toast.error).toHaveBeenCalledWith(`Failed to load logs: ${error}`)
            }
        )

        it.each([
            ['Fetch is aborted', 'Safari abort message'],
            ['new query started', 'exact match for NEW_QUERY_STARTED_ERROR_MESSAGE'],
        ])('suppresses fetchNextLogsPage error "%s" (%s)', async (error) => {
            logic.actions.fetchNextLogsPageFailure(error)
            await expectLogic(logic).toFinishAllListeners()

            expect(toast.error).not.toHaveBeenCalled()
        })

        it('shows toast for legitimate fetchNextLogsPage error', async () => {
            logic.actions.fetchNextLogsPageFailure('Network error')
            await expectLogic(logic).toFinishAllListeners()

            expect(toast.error).toHaveBeenCalledWith('Failed to load more logs: Network error')
        })
    })

    describe('loading state on failure', () => {
        // A real failure ends the request with nothing to replace it, so the spinner has to come
        // down. Latching it on left the viewer spinning forever whenever the backend errored.
        it.each([['Network error'], ['Server returned 500'], ['Timeout exceeded']])(
            'stops the logs spinner after real failure "%s"',
            async (error) => {
                logic.actions.fetchLogs()
                expect(logic.values.logsLoading).toBe(true)

                logic.actions.fetchLogsFailure(error)
                expect(logic.values.logsLoading).toBe(false)
            }
        )

        it.each([['new query started'], ['Fetch is aborted'], ['ABORTED']])(
            'keeps the logs spinner up when superseded by "%s"',
            async (error) => {
                logic.actions.fetchLogs()
                logic.actions.fetchLogsFailure(error)

                expect(logic.values.logsLoading).toBe(true)
            }
        )

        it('stops the pagination spinner after a real failure', async () => {
            logic.actions.fetchNextLogsPage()
            expect(logic.values.logsLoading).toBe(true)

            logic.actions.fetchNextLogsPageFailure('Server returned 500')
            expect(logic.values.logsLoading).toBe(false)
        })

        it('stops the sparkline spinner after a real failure', async () => {
            logic.actions.fetchSparkline()
            expect(logic.values.sparklineLoading).toBe(true)

            logic.actions.fetchSparklineFailure('Server returned 500')
            expect(logic.values.sparklineLoading).toBe(false)
        })

        it('keeps the sparkline spinner up when superseded', async () => {
            logic.actions.fetchSparkline()
            logic.actions.fetchSparklineFailure('new query started')

            expect(logic.values.sparklineLoading).toBe(true)
        })
    })
})
