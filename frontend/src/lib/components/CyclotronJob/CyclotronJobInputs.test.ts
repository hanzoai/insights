import { coerceTemplateValueForDisplay } from './CyclotronJobInputs'

describe('coerceTemplateValueForDisplay', () => {
    it.each([
        ['plain string', 'hello', 'script', 'hello'],
        ['template string', 'Hi {person.properties.name}', 'script', 'Hi {person.properties.name}'],
        ['empty string', '', 'script', ''],
        ['null', null, 'script', ''],
        ['undefined', undefined, 'script', ''],
        // Single-expression script templates evaluate to the raw value, preserving the type at runtime
        ['boolean true (script)', true, 'script', '{true}'],
        ['boolean false (script)', false, 'script', '{false}'],
        ['number (script)', 42, 'script', '{42}'],
        ['float (script)', 0.5, 'script', '{0.5}'],
        // Liquid renders to strings anyway, so the plain string form is the closest representation
        ['boolean (liquid)', true, 'liquid', 'true'],
        ['number (liquid)', 42, 'liquid', '42'],
        ['boolean (no templating)', true, false, 'true'],
        ['object', { a: 1 }, 'script', '{"a":1}'],
        ['array', [1, 'two'], 'script', '[1,"two"]'],
    ] as [string, unknown, 'script' | 'liquid' | false, string][])('coerces %s', (_name, value, templating, expected) => {
        expect(coerceTemplateValueForDisplay(value, templating)).toBe(expected)
    })
})
