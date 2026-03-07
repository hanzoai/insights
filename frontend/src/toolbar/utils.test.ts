import { joinWithUiHost, slashDotDataAttrUnescape } from './utils'

describe('utils', () => {
    describe('joinWithUiHost', () => {
        const testCases: Array<{ uiHost: string; path: string; expected: string }> = [
            {
                uiHost: 'https://insights.hanzo.ai',
                path: '/settings/project',
                expected: 'https://insights.hanzo.ai/settings/project',
            },
            {
                uiHost: 'https://insights.hanzo.ai/',
                path: '/settings/project',
                expected: 'https://insights.hanzo.ai/settings/project',
            },
            {
                uiHost: 'https://insights.hanzo.ai///',
                path: 'settings/project',
                expected: 'https://insights.hanzo.ai/settings/project',
            },
            {
                uiHost: 'https://insights.hanzo.ai',
                path: 'settings/project',
                expected: 'https://insights.hanzo.ai/settings/project',
            },
            {
                uiHost: 'https://insights.hanzo.ai/',
                path: '///settings/project',
                expected: 'https://insights.hanzo.ai/settings/project',
            },
            {
                uiHost: 'https://insights.hanzo.ai',
                path: `${'/settings/project'}#heatmaps`,
                expected: 'https://insights.hanzo.ai/settings/project#heatmaps',
            },
            { uiHost: 'https://insights.hanzo.ai', path: '?a=1', expected: 'https://insights.hanzo.ai/?a=1' },
            { uiHost: 'https://insights.hanzo.ai', path: '#hash', expected: 'https://insights.hanzo.ai/#hash' },
            { uiHost: 'https://insights.hanzo.ai', path: 'https://example.com/x', expected: 'https://example.com/x' },
            { uiHost: 'https://insights.hanzo.ai', path: '//example.com/x', expected: '//example.com/x' },
            { uiHost: '', path: '/settings/project', expected: '/settings/project' },
        ]

        testCases.forEach(({ uiHost, path, expected }) => {
            it(`joins "${uiHost}" + "${path}"`, () => {
                expect(joinWithUiHost(uiHost, path)).toBe(expected)
            })
        })
    })

    describe('slashDotDataAttrUnescape', () => {
        const testCases = [
            {
                input: 'div[data-attr="test"]',
                expected: 'div[data-attr="test"]',
            },
            {
                input: 'div[data-attr="test\\."]',
                expected: 'div[data-attr="test."]',
            },
            {
                input: 'div[data-something="test\\.test\\.test"]',
                expected: 'div[data-something="test.test.test"]',
            },
            {
                input: '.tomato div[data-something="test\\.test\\.test"]',
                expected: '.tomato div[data-something="test.test.test"]',
            },
            {
                input: '\\.tomato div[data-something="test\\.test\\.test"]',
                expected: '.tomato div[data-something="test.test.test"]',
            },
        ]
        testCases.forEach(({ input, expected }) => {
            it(`should unescape "${input}" to "${expected}"`, () => {
                const result = slashDotDataAttrUnescape(input)
                expect(result).toBe(expected)
            })
        })
    })
})
