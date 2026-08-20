import { hexToRGBA, toOpaqueHex } from 'lib/utils/colors'

describe('colors utils', () => {
    describe('hexToRGBA()', () => {
        it('converts hex to RGBA correctly', () => {
            expect(hexToRGBA('#ff0000', 0.3)).toEqual('rgba(255,0,0,0.3)')
            expect(hexToRGBA('#0000Cc', 0)).toEqual('rgba(0,0,204,0)')
            expect(hexToRGBA('#5375ff', 1)).toEqual('rgba(83,117,255,1)')
        })
    })

    describe('toOpaqueHex()', () => {
        it.each([
            ['rgba(61,61,61,0.5)', '#3d3d3d'],
            ['rgba(61, 61, 61, 0.5)', '#3d3d3d'],
            ['rgb(61,61,61)', '#3d3d3d'],
            ['rgba(0,0,0,0.5)', '#000000'],
            ['#3d3d3d80', '#3d3d3d'],
            ['#3d3d3d', '#3d3d3d'],
            ['var(--data-color-1)', 'var(--data-color-1)'],
        ])('strips alpha from %s -> %s', (input, expected) => {
            expect(toOpaqueHex(input)).toEqual(expected)
        })
    })
})
