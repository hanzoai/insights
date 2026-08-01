// Regression test: the @hanzo/insightsql-parser package works in Jest without mocks
import createInsightsQLParser from '@hanzo/insightsql-parser'

describe('@hanzo/insightsql-parser', () => {
    it('exports a factory function', () => {
        expect(typeof createInsightsQLParser).toBe('function')
    })

    it('factory resolves to a parser with parseSelect', async () => {
        const parser = await createInsightsQLParser()
        expect(typeof parser.parseSelect).toBe('function')
    })

    it('parses a simple SELECT statement', async () => {
        const parser = await createInsightsQLParser()
        const result = JSON.parse(parser.parseSelect('SELECT 1'))
        expect(result.node).toBe('SelectQuery')
    })
})
