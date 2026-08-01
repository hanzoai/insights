// Run with: node --test .github/scripts/schema-impact.test.js
//
// JS-side: schema.json diffing, product unioning, and one end-to-end pass
// through buildImportMap. Scanner resolution is unit-tested in
// test_schema_usage_scan.py.

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')

const { diffDefinitions, affectedProductsFor, buildImportMap } = require('./schema-impact')

const schema = (defs) => JSON.stringify({ $schema: 'x', definitions: defs })

test('diffDefinitions classifies added/removed/modified', () => {
    const base = schema({ A: { type: 'object', a: 1 }, B: { type: 'string' } })
    const head = schema({ A: { type: 'object', a: 2 }, C: { type: 'number' } })
    const { added, removed, modified } = diffDefinitions(base, head)
    assert.deepEqual(added, ['C'])
    assert.deepEqual(removed, ['B'])
    assert.deepEqual(modified, ['A'])
})

test('diffDefinitions: purely additive change has empty modified+removed', () => {
    const base = schema({ A: { type: 'object' } })
    const head = schema({ A: { type: 'object' }, NewType: { type: 'string' } })
    const { added, removed, modified } = diffDefinitions(base, head)
    assert.deepEqual(added, ['NewType'])
    assert.deepEqual(removed, [])
    assert.deepEqual(modified, [])
})

test('affectedProductsFor unions products across all changed types', () => {
    const map = new Map([
        ['A', new Set(['logs'])],
        ['B', new Set(['logs', 'experiments'])],
        ['C', new Set(['surveys'])],
    ])
    assert.deepEqual(affectedProductsFor(['A', 'B'], map), ['experiments', 'logs'])
    assert.deepEqual(affectedProductsFor(['nonexistent'], map), [])
})

test('affectedProductsFor includes wildcard products on any change', () => {
    const map = new Map([
        ['A', new Set(['logs'])],
        ['*', new Set(['alerts'])],
    ])
    assert.deepEqual(affectedProductsFor(['A'], map), ['alerts', 'logs'])
    assert.deepEqual(affectedProductsFor(['Unrelated'], map), ['alerts'])
    assert.deepEqual(affectedProductsFor([], map), [])
})

test('buildImportMap resolves every import shape end-to-end (via the AST scanner)', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-impact-'))
    try {
        const mk = (name) => {
            const dir = path.join(root, name, 'backend')
            fs.mkdirSync(dir, { recursive: true })
            return dir
        }
        // direct symbol import
        fs.writeFileSync(path.join(mk('logs'), 'a.py'), 'from insights.schema import LogsQuery, InsightsQLFilters\n')
        // `from insights import schema` + attribute refs
        fs.writeFileSync(
            path.join(mk('product_analytics'), 'b.py'),
            'from insights import schema\nx = schema.InsightVizNode\ny = schema.DataVisualizationNode\n'
        )
        // `import insights.schema` + dotted ref
        fs.writeFileSync(path.join(mk('alerts'), 'c.py'), 'import insights.schema\ns = insights.schema.AlertState["FIRING"]\n')
        // module bound but used dynamically → wildcard
        fs.writeFileSync(path.join(mk('mystery'), 'd.py'), 'from insights import schema\nregister(schema)\n')
        // noise: no schema usage at all
        fs.writeFileSync(path.join(mk('noise'), 'e.py'), 'import os\n')

        const map = buildImportMap(root)
        assert.deepEqual([...map.get('LogsQuery')], ['logs'])
        assert.deepEqual([...map.get('InsightsQLFilters')], ['logs'])
        assert.deepEqual([...map.get('InsightVizNode')], ['product-analytics'])
        assert.deepEqual([...map.get('DataVisualizationNode')], ['product-analytics'])
        assert.deepEqual([...map.get('AlertState')], ['alerts'])
        assert.deepEqual([...map.get('*')], ['mystery'])
        assert.equal(map.has('NeverImported'), false)
    } finally {
        fs.rmSync(root, { recursive: true, force: true })
    }
})
