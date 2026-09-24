/**
 * @jest-environment-options {"url": "https://insights.hanzo.ai/project/1/activity/live"}
 */
import { liveEventsHostOrigin } from './apiHost'

describe('liveEventsHostOrigin', () => {
    afterEach(() => {
        delete window.INSIGHTS_APP_CONTEXT
    })

    it('uses the livestream host the server hands the app', () => {
        window.INSIGHTS_APP_CONTEXT = { livestream_host: 'https://live.hanzo.ai' } as any
        expect(window.location.origin).toBe('https://insights.hanzo.ai')
        expect(liveEventsHostOrigin()).toBe('https://live.hanzo.ai')
    })

    it('falls back to the local livestream when the server names none', () => {
        window.INSIGHTS_APP_CONTEXT = {} as any
        expect(liveEventsHostOrigin()).toBe('http://localhost:8666')
    })
})
