import { isTrustedInsightsUrl } from './trustedUrl'

describe('isTrustedInsightsUrl', () => {
    // jsdom serves tests from http://localhost, so same-origin checks resolve against localhost.
    it.each([
        ['/static/screenshot.png'],
        ['http://localhost/img.png'],
        ['https://hanzo.ai/img.png'],
        ['https://us.hanzo.ai/img.png'],
        ['https://app.hanzo.ai/a/b/c.png'],
    ])('trusts %s', (url) => {
        expect(isTrustedInsightsUrl(url)).toBe(true)
    })

    it.each([
        ['https://evil.com/img.png'],
        ['https://nothanzo.ai/img.png'],
        ['https://evil.hanzo.ai.attacker.com/img.png'],
        ['https://hanzo.ai.attacker.com/img.png'],
        ['data:image/png;base64,iVBORw0KGgo='],
        ['blob:https://hanzo.ai/abc'],
        ['javascript:alert(1)'],
        [''],
        [undefined],
    ])('distrusts %s', (url) => {
        expect(isTrustedInsightsUrl(url)).toBe(false)
    })
})
