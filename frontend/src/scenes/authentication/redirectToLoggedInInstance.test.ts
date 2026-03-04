import { cleanedCookieSubdomain } from 'scenes/authentication/RedirectToLoggedInInstance'

describe('RedirectToLoggedInInstance cleanedCookieSubdomain', () => {
    test.each([
        ['handles null', null, null],
        ['handles the empty string', '', null],
        ['handles the sneaky string', '         ', null],
        ['handles not URLs', 'yo ho ho', null],
        ['handles EU', 'https://insights.hanzo.ai', 'eu'],
        ['handles app', 'https://insights.hanzo.ai', null],
        ['handles US', 'https://insights.hanzo.ai', 'us'],
        ['handles leading quotes', '"https://insights.hanzo.ai', 'eu'],
        ['handles trailing quotes', 'https://insights.hanzo.ai"', 'eu'],
        ['handles wrapping quotes', '"https://insights.hanzo.ai"', 'eu'],
        ['handles ports', 'https://insights.hanzo.ai:8123', 'us'],
        ['handles longer urls', 'https://insights.hanzo.ai:1234?query=parameter#hashParam', 'eu'],
    ])('%s', (_name, cookie, expected) => {
        expect(cleanedCookieSubdomain(cookie)).toEqual(expected)
    })
})
