import { parseInsightsQLX, renderInsightsQLX } from '~/queries/nodes/InsightsQLX/render'

describe('InsightsQLX', () => {
    describe('parse', () => {
        it('should parse tags', () => {
            const value = parseInsightsQLX(['__hx_tag', 'Sparkline', 'data', [1, 2, 3], 'type', ['line']])
            expect(value).toEqual({
                __hx_tag: 'Sparkline',
                data: [1, 2, 3],
                type: ['line'],
            })
        })

        it('should parse empty tags', () => {
            const value = parseInsightsQLX(['__hx_tag', 'Sparkline'])
            expect(value).toEqual({
                __hx_tag: 'Sparkline',
            })
        })

        it('should parse objects', () => {
            const value = parseInsightsQLX(['__hx_tag', '__hx_obj', 'a', 1, 'b', 2])
            expect(value).toEqual({
                a: 1,
                b: 2,
            })
        })

        it('should handle arrays', () => {
            const value = parseInsightsQLX(['a', 'b', 'c'])
            expect(value).toEqual(['a', 'b', 'c'])
        })

        it('should handle nested arrays', () => {
            const value = parseInsightsQLX(['a', ['b', 'c']])
            expect(value).toEqual(['a', ['b', 'c']])
        })

        it('should handle nested objects', () => {
            const value = parseInsightsQLX(['__hx_tag', '__hx_obj', 'a', ['b', 'c']])
            expect(value).toEqual({
                a: ['b', 'c'],
            })
        })

        it('should handle nested objects with tags', () => {
            const value = parseInsightsQLX([
                '__hx_tag',
                '__hx_obj',
                'a',
                ['__hx_tag', 'Sparkline', 'data', [1, 2, 3], 'type', ['line']],
            ])
            expect(value).toEqual({
                a: {
                    __hx_tag: 'Sparkline',
                    data: [1, 2, 3],
                    type: ['line'],
                },
            })
        })
    })

    describe('render', () => {
        it('should render Sparkline', () => {
            const value = {
                __hx_tag: 'Sparkline',
                data: [1, 2, 3],
                type: ['line'],
            }
            const element = renderInsightsQLX(value)
            expect(element).toMatchSnapshot()
        })

        it('should render object', () => {
            const value = {
                a: 1,
                b: 2,
            }
            const element = renderInsightsQLX(value)
            expect(element).toMatchSnapshot()
        })

        it('should render unknown tag', () => {
            const value = {
                __hx_tag: 'Unknown',
            }
            const element = renderInsightsQLX(value)
            expect(element).toMatchSnapshot()
        })

        it('should render array', () => {
            const value = [1, 2, 3]
            const element = renderInsightsQLX(value)
            expect(element).toMatchSnapshot()
        })
    })
})
