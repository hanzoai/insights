import { promoteInsightsCustomMetadata } from './custom-metadata'

describe('promoteInsightsCustomMetadata', () => {
    it.each([
        ['insights_tags', 'tags', ['beta', 'internal']],
        ['insights_environment', 'environment', 'prod'],
        ['insights_constructor', 'constructor', 'ctor-value'],
    ])('promotes <namespace>%s to %s with the prefix stripped', (suffix, name, value) => {
        const props: Record<string, unknown> = { [`ns.${suffix}`]: value }
        promoteInsightsCustomMetadata(props, 'ns.')
        expect(props[name]).toEqual(value)
    })

    it.each([
        ['a non-insights key', 'ns.org_id', 'org_id'],
        ['a reserved $-prefixed name', 'ns.insights_$ai_model', '$ai_model'],
        ['the reserved distinct_id name', 'ns.insights_distinct_id', 'distinct_id'],
    ])('does not promote %s', (_label, key, resultName) => {
        const props: Record<string, unknown> = { [key]: 'value' }
        promoteInsightsCustomMetadata(props, 'ns.')
        expect(props[resultName]).toBeUndefined()
    })

    it('does not overwrite an existing property', () => {
        const props: Record<string, unknown> = { tags: ['keep'], 'ns.insights_tags': ['drop'] }
        promoteInsightsCustomMetadata(props, 'ns.')
        expect(props['tags']).toEqual(['keep'])
    })

    it('skips __proto__ instead of polluting the prototype', () => {
        const props: Record<string, unknown> = { 'ns.insights___proto__': { polluted: true } }
        promoteInsightsCustomMetadata(props, 'ns.')
        expect(Object.getPrototypeOf(props)).toBe(Object.prototype)
    })
})
