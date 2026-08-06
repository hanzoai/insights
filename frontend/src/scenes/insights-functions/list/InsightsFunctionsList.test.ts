import { InsightsFunctionType } from '~/types'

import { urlForInsightsFunction } from './InsightsFunctionsList'

const makeFn = (id: string): InsightsFunctionType => ({ id }) as InsightsFunctionType

describe('urlForInsightsFunction', () => {
    it('returns the bare script function path when returnTo is undefined', () => {
        expect(urlForInsightsFunction(makeFn('abc123'))).toBe('/functions/abc123')
    })

    it('appends returnTo as a query param for a script function id', () => {
        expect(urlForInsightsFunction(makeFn('abc123'), '/health/sdk-health')).toBe(
            '/functions/abc123?returnTo=%2Fhealth%2Fsdk-health'
        )
    })

    it('does not append returnTo for plugin- prefix IDs', () => {
        expect(urlForInsightsFunction(makeFn('plugin-7'), '/health/sdk-health')).toBe('/pipeline/plugins/7')
    })

    it('does not append returnTo for batch-export- prefix IDs', () => {
        expect(urlForInsightsFunction(makeFn('batch-export-9'), '/health/sdk-health')).toBe('/pipeline/batch-exports/9')
    })
})
