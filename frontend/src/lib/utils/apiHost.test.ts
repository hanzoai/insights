/**
 * @jest-environment-options {"url": "https://insights.hanzo.ai/project/1/activity/live"}
 */
import { isSameOrigin, liveEventsHostOrigin } from './apiHost'

describe('liveEventsHostOrigin', () => {
    afterEach(() => {
        delete window.INSIGHTS_APP_CONTEXT
    })

    it('uses the livestream host the server hands the app', () => {
        window.INSIGHTS_APP_CONTEXT = { livestream_host: 'https://live.hanzo.ai' } as any
        expect(liveEventsHostOrigin()).toBe('https://live.hanzo.ai')
    })
})

describe('isSameOrigin', () => {
    it('keeps Django paths on this origin', () => {
        expect(isSameOrigin('/v1/environments/1/')).toBe(true)
        expect(isSameOrigin('https://insights.hanzo.ai/v1/environments/1/')).toBe(true)
    })

    it('puts the livestream on another origin', () => {
        expect(isSameOrigin('https://live.hanzo.ai/events?columns=%24current_url')).toBe(false)
    })
})
