import { escapeInsightsQLString, parseIfJSONString, parseRecordIfJSONString } from './parsing'

describe('timeline item parsing helpers', () => {
    it('parses JSON strings and preserves non-string values', () => {
        expect(parseIfJSONString<{ ok: boolean }>('{"ok":true}')).toEqual({ ok: true })
        expect(parseIfJSONString<{ ok: boolean }>({ ok: true })).toEqual({ ok: true })
        expect(parseIfJSONString('{oops')).toBeUndefined()
    })

    it('returns only object-like values for parseRecordIfJSONString', () => {
        expect(parseRecordIfJSONString('{"name":"value"}')).toEqual({ name: 'value' })
        expect(parseRecordIfJSONString({ name: 'value' })).toEqual({ name: 'value' })
        expect(parseRecordIfJSONString('[1,2,3]')).toEqual({})
        expect(parseRecordIfJSONString(null)).toEqual({})
    })

    it('escapes InsightsQL-sensitive characters', () => {
        expect(escapeInsightsQLString("a\\b'c")).toBe("a\\\\b\\'c")
    })
})
