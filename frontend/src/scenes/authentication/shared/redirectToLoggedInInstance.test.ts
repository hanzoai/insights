import { cleanedCookieSubdomain } from 'scenes/authentication/shared/RedirectToLoggedInInstance'

describe('RedirectToLoggedInInstance cleanedCookieSubdomain', () => {
    test.each([
        ['handles null', null, null],
        ['handles the empty string', '', null],
        ['handles the sneaky string', '         ', null],
        ['handles not URLs', 'yo ho ho', null],
        ['handles EU', 'https://eu.hanzo.ai', 'eu'],
        ['handles app', 'https://app.hanzo.ai', null],
        ['handles US', 'https://us.hanzo.ai', 'us'],
        ['handles leading quotes', '"https://eu.hanzo.ai', 'eu'],
        ['handles trailing quotes', 'https://eu.hanzo.ai"', 'eu'],
        ['handles wrapping quotes', '"https://eu.hanzo.ai"', 'eu'],
        ['handles ports', 'https://us.hanzo.ai:8123', 'us'],
        ['handles longer urls', 'https://eu.hanzo.ai:1234?query=parameter#hashParam', 'eu'],
    ])('%s', (_name, cookie, expected) => {
        expect(cleanedCookieSubdomain(cookie)).toEqual(expected)
    })
})
