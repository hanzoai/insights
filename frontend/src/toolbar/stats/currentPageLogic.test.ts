import { withoutInsightsInit } from '~/toolbar/stats/currentPageLogic'

const insightsInitHashParam =
    '__insights={%22action%22:%20%22ph_authorize%22,%20%22token%22:%20%the-ph-token%22,%20%22temporaryToken%22:%20%the-insights-token%22,%20%22actionId%22:%20null,%20%22userIntent%22:%20%22heatmaps%22,%20%22toolbarVersion%22:%20%22toolbar%22,%20%22apiURL%22:%20%22https://insights.hanzo.ai%22,%20%22dataAttributes%22:%20[%22data-attr%22],%20%22instrument%22:%20true,%20%22userEmail%22:%20%user-email@gmail.com%22,%20%22distinctId%22:%20%the-distinct-id%22}'

describe('current page logic', () => {
    describe('cleaning href', () => {
        it('can ignore insights init hash param when other hash params present', () => {
            // not technically a valid URL but :shrug:
            expect(withoutInsightsInit(`https://wat.io?something=a#${insightsInitHashParam}#myfragment`)).toBe(
                'https://wat.io?something=a#myfragment'
            )
        })
        it('can handle multiple curly braces in the init', () => {
            // not technically a valid URL but :shrug:
            expect(
                withoutInsightsInit(
                    `https://wat.io?something=a#__insights={something}and something}#myfragment={something}`
                )
            ).toBe('https://wat.io?something=a#myfragment={something}')
        })
        it('can ignore insights init hash param when no other hash params present', () => {
            expect(withoutInsightsInit(`https://wat.io?something=a#${insightsInitHashParam}`)).toBe(
                'https://wat.io?something=a'
            )
        })
        it('gives nonsense back if it receives it', () => {
            expect(withoutInsightsInit('i am not a url')).toBe('i am not a url')
        })
        it('supports wildcards too', () => {
            expect(withoutInsightsInit('https://*.wat.io/category/*/product/1/?something=a#myfragment')).toBe(
                'https://*.wat.io/category/*/product/1/?something=a#myfragment'
            )
        })
    })
})
