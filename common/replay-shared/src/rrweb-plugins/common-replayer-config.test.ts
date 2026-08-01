import { COMMON_REPLAYER_CONFIG } from './index'

// insights-js/* ships ESM that the test transform can't load directly; these values are
// only used by sibling plugins, not by the config object under test.
jest.mock('insights-js/rrweb', () => ({
    Replayer: jest.fn(),
    canvasMutation: jest.fn(),
}))
jest.mock('insights-js/rrweb-types', () => ({
    EventType: {},
    IncrementalSource: {},
}))

describe('COMMON_REPLAYER_CONFIG', () => {
    it('keeps the replay iframe scriptless by never enabling UNSAFE_replayCanvas', () => {
        // UNSAFE_replayCanvas makes rrweb add `allow-scripts` to the replay iframe sandbox.
        // Combined with the `allow-same-origin` rrweb requires, that pair lets untrusted
        // recorded content remove its own sandbox and run with full app-origin access.
        // Insights renders canvas via CanvasReplayerPlugin instead, so this must stay off.
        expect(COMMON_REPLAYER_CONFIG.UNSAFE_replayCanvas).toBe(false)
    })
})
