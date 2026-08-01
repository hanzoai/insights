import { buildInsightsCodeDeepLink } from './AgentPromptButton'

describe('AgentPromptButton', () => {
    it.each([
        ['with a repository', 'insights/insights', 'insights-code://new?prompt=fix%20this&repo=insights%2Finsights'],
        ['without a repository', undefined, 'insights-code://new?prompt=fix%20this'],
    ])('builds a Insights Code deep link %s', (_, repository, expected) => {
        expect(buildInsightsCodeDeepLink('fix this', repository)).toBe(expected)
    })
})
