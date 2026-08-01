import { MOCK_TEAM_ID } from 'lib/api.mock'

import { dayjs } from 'lib/dayjs'
import { getAppContext } from 'lib/utils/getAppContext'
import { teamLogic } from 'scenes/teamLogic'

import { DataTableNode, DataVisualizationNode, NodeKind } from '~/queries/schema/schema-general'
import type { InsightQueryNode } from '~/queries/schema/schema-general'
import { initKeaTests } from '~/test/init'
import { AppContext, ChartDisplayType, FunnelVizType, TeamType } from '~/types'

import {
    convertDataTableNodeToDataVisualizationNode,
    dataWarehouseSourcesFromResponse,
    escapeDottedInsightsQLIdentifier,
    escapeInsightsQLString,
    escapePropertyAsInsightsQLIdentifier,
    getDisplay,
    insightsql,
    queryUsesDataWarehouse,
    queryVizDefinitelyRendersToCanvas,
    queryVizRendersToCanvas,
    supportsBarValueStacking,
} from './utils'

window.POSTFN_APP_CONTEXT = { current_team: { id: MOCK_TEAM_ID } } as unknown as AppContext

describe('insightsql tag', () => {
    // In beforeEach (not describe scope): mounting at collection time fires the preflight
    // load before the MSW harness's beforeAll has installed its fetch stub
    beforeEach(() => {
        initKeaTests()
        teamLogic.mount()
    })

    it('properly returns query with no substitutions', () => {
        expect(insightsql`SELECT * FROM events`).toEqual('SELECT * FROM events')
    })

    it('properly returns query with simple identifier substition', () => {
        expect(insightsql`SELECT * FROM ${insightsql.identifier('events')}`).toEqual('SELECT * FROM events')
    })

    it('properly returns query with escaped identifier substition', () => {
        expect(insightsql`SELECT properties.${insightsql.identifier('odd property')} FROM events`).toEqual(
            'SELECT properties."odd property" FROM events'
        )
    })

    it('properly returns query with string and number substitutions', () => {
        expect(insightsql`SELECT * FROM events WHERE properties.foo = ${'bar'} AND properties.baz = ${3}`).toEqual(
            "SELECT * FROM events WHERE properties.foo = 'bar' AND properties.baz = 3"
        )
    })

    it('properly returns query with string array substitution', () => {
        expect(insightsql`SELECT * FROM events WHERE properties.foo IN ${['bar', 'baz']}`).toEqual(
            "SELECT * FROM events WHERE properties.foo IN ['bar', 'baz']"
        )
    })

    it('properly returns query with date substitution in UTC', () => {
        teamLogic.actions.loadCurrentTeamSuccess({ id: MOCK_TEAM_ID, timezone: 'UTC' } as TeamType)
        expect(insightsql`SELECT * FROM events WHERE timestamp > ${dayjs('2023-04-04T04:04:00Z')}`).toEqual(
            "SELECT * FROM events WHERE timestamp > '2023-04-04 04:04:00'"
        )
    })

    it('properly returns query with date substitution in non-UTC', () => {
        const context = getAppContext()
        let oldTimezone = context?.current_team?.timezone || 'UTC'
        if (context?.current_team) {
            context.current_team.timezone = 'Europe/Moscow'
        }
        teamLogic.actions.loadCurrentTeamSuccess({ id: MOCK_TEAM_ID, timezone: 'Europe/Moscow' } as TeamType)
        expect(insightsql`SELECT * FROM events WHERE timestamp > ${dayjs('2023-04-04T04:04:00Z')}`).toEqual(
            "SELECT * FROM events WHERE timestamp > '2023-04-04 07:04:00'" // Offset by 3 hours
        )
        if (context?.current_team) {
            context.current_team.timezone = oldTimezone
        }
    })

    it('properly escapes single quotes in string values', () => {
        expect(insightsql`SELECT * FROM events WHERE properties.name = ${"O'Reilly"}`).toEqual(
            "SELECT * FROM events WHERE properties.name = 'O\\'Reilly'"
        )
    })

    it('properly escapes backslashes in string values', () => {
        expect(insightsql`SELECT * FROM events WHERE properties.path = ${'C:\\Users\\test'}`).toEqual(
            "SELECT * FROM events WHERE properties.path = 'C:\\\\Users\\\\test'"
        )
    })
})

describe('escapeInsightsQLString', () => {
    it.each([
        ['simple', "'simple'"],
        ["O'Reilly", "'O\\'Reilly'"],
        ["'; DROP TABLE users; --", "'\\'; DROP TABLE users; --'"],
        ['C:\\Users\\test', "'C:\\\\Users\\\\test'"],
        ['line1\nline2', "'line1\\nline2'"],
        ['tab\there', "'tab\\there'"],
        ['carriage\rreturn', "'carriage\\rreturn'"],
        ['', "''"],
        ["multiple'quotes'here", "'multiple\\'quotes\\'here'"],
        ['back\\slash', "'back\\\\slash'"],
    ])('escapes %s to %s', (input, expected) => {
        expect(escapeInsightsQLString(input)).toEqual(expected)
    })
})

describe('escapePropertyAsInsightsQLIdentifier', () => {
    it('leaves simple identifiers unquoted', () => {
        expect(escapePropertyAsInsightsQLIdentifier('browser')).toEqual('browser')
        expect(escapePropertyAsInsightsQLIdentifier('$browser')).toEqual('$browser')
    })

    it('double-quotes identifiers with special characters but no double quote', () => {
        expect(escapePropertyAsInsightsQLIdentifier('order items')).toEqual('"order items"')
    })

    it('backtick-wraps identifiers containing a double quote', () => {
        expect(escapePropertyAsInsightsQLIdentifier('a"b')).toEqual('`a"b`')
    })

    it('doubles inner backticks when an identifier has both a double quote and a backtick', () => {
        // Backslash-escaping (`a"b\`c`) would be rejected by the InsightsQL parser; doubling round-trips.
        expect(escapePropertyAsInsightsQLIdentifier('a"b`c')).toEqual('`a"b``c`')
    })

    it('escapes backslashes so they survive the parser instead of forming an escape sequence', () => {
        expect(escapePropertyAsInsightsQLIdentifier('a\\b')).toEqual('"a\\\\b"')
        expect(escapePropertyAsInsightsQLIdentifier('end\\')).toEqual('"end\\\\"')
        // A backslash alongside a double quote takes the backtick branch and still escapes both.
        expect(escapePropertyAsInsightsQLIdentifier('a"\\b')).toEqual('`a"\\\\b`')
        // A backslash immediately before an inner backtick (which forces the backtick branch).
        expect(escapePropertyAsInsightsQLIdentifier('a"b\\`c')).toEqual('`a"b\\\\``c`')
    })

    it('escapes control characters instead of emitting them raw', () => {
        expect(escapePropertyAsInsightsQLIdentifier('a\tb')).toEqual('"a\\tb"')
        expect(escapePropertyAsInsightsQLIdentifier('a\nb')).toEqual('"a\\nb"')
        expect(escapePropertyAsInsightsQLIdentifier('a\bb')).toEqual('"a\\bb"')
        // An embedded double quote forces the backtick branch; the control char is still escaped.
        expect(escapePropertyAsInsightsQLIdentifier('a"\tb')).toEqual('`a"\\tb`')
    })
})

describe('escapeDottedInsightsQLIdentifier', () => {
    it('leaves simple dotted identifiers unquoted', () => {
        expect(escapeDottedInsightsQLIdentifier('demo.orders')).toEqual('demo.orders')
    })

    it('quotes each dotted segment independently when needed', () => {
        expect(escapeDottedInsightsQLIdentifier('demo.order items')).toEqual('demo."order items"')
    })
})

describe('convertDataTableNodeToDataVisualizationNode', () => {
    it('preserves visible and pinned columns from legacy InsightsQL data table nodes', () => {
        const convertedNode = convertDataTableNodeToDataVisualizationNode({
            kind: NodeKind.DataTableNode,
            source: {
                kind: NodeKind.InsightsQLQuery,
                query: 'select * from events',
            },
            columns: ['event', 'timestamp', 'person_id'],
            hiddenColumns: ['person_id'],
            pinnedColumns: ['event', 'person_id'],
        } as DataTableNode)

        expect(convertedNode).toEqual({
            kind: NodeKind.DataVisualizationNode,
            source: {
                kind: NodeKind.InsightsQLQuery,
                query: 'select * from events',
            },
            display: ChartDisplayType.ActionsTable,
            tableSettings: {
                columns: [{ column: 'event' }, { column: 'timestamp' }],
                pinnedColumns: ['event'],
            },
        } as DataVisualizationNode)
    })

    it('preserves additional legacy table config when converting InsightsQL data table nodes', () => {
        const convertedNode = convertDataTableNodeToDataVisualizationNode({
            kind: NodeKind.DataTableNode,
            source: {
                kind: NodeKind.InsightsQLQuery,
                query: 'select * from events limit 10',
            },
            full: true,
            embedded: true,
            showReload: true,
            columns: ['event'],
        } as DataTableNode)

        expect(convertedNode).toEqual({
            kind: NodeKind.DataVisualizationNode,
            source: {
                kind: NodeKind.InsightsQLQuery,
                query: 'select * from events limit 10',
            },
            display: ChartDisplayType.ActionsTable,
            full: true,
            embedded: true,
            showReload: true,
            tableSettings: {
                columns: [{ column: 'event' }],
            },
        })
    })
})

describe('supportsBarValueStacking', () => {
    const breakdown = { breakdown: '$browser', breakdown_type: 'event' as const }
    const trends = (display: ChartDisplayType, withBreakdown: boolean): InsightQueryNode =>
        ({
            kind: NodeKind.TrendsQuery,
            series: [],
            trendsFilter: { display },
            ...(withBreakdown ? { breakdownFilter: breakdown } : {}),
        }) as InsightQueryNode

    it.each([
        {
            name: 'trends + bar-value + breakdown',
            query: trends(ChartDisplayType.ActionsBarValue, true),
            expected: true,
        },
        {
            name: 'trends + bar-value without breakdown',
            query: trends(ChartDisplayType.ActionsBarValue, false),
            expected: false,
        },
        {
            name: 'trends + vertical bar + breakdown',
            query: trends(ChartDisplayType.ActionsBar, true),
            expected: false,
        },
        {
            name: 'trends + line + breakdown',
            query: trends(ChartDisplayType.ActionsLineGraph, true),
            expected: false,
        },
        {
            name: 'funnels + breakdown',
            query: { kind: NodeKind.FunnelsQuery, series: [], breakdownFilter: breakdown } as InsightQueryNode,
            expected: false,
        },
        { name: 'null query', query: null, expected: false },
    ])('returns $expected for $name', ({ query, expected }) => {
        expect(supportsBarValueStacking(query)).toBe(expected)
    })
})

describe('queryVizRendersToCanvas', () => {
    const insightViz = (source: InsightQueryNode): any => ({ kind: NodeKind.InsightVizNode, source })
    const trends = (display?: ChartDisplayType): InsightQueryNode =>
        ({ kind: NodeKind.TrendsQuery, series: [], trendsFilter: display ? { display } : {} }) as InsightQueryNode

    it.each([
        {
            name: 'InsightsQL data table',
            query: { kind: NodeKind.DataTableNode } as any,
            expectedMayRenderToCanvas: false,
            expectedDefinitelyRendersToCanvas: false,
        },
        {
            name: 'SQL viz as chart',
            query: { kind: NodeKind.DataVisualizationNode, display: ChartDisplayType.ActionsLineGraph } as any,
            expectedMayRenderToCanvas: true,
            expectedDefinitelyRendersToCanvas: true,
        },
        {
            name: 'SQL viz as table (no display)',
            query: { kind: NodeKind.DataVisualizationNode } as any,
            expectedMayRenderToCanvas: false,
            expectedDefinitelyRendersToCanvas: false,
        },
        {
            name: 'SQL viz with auto display',
            query: { kind: NodeKind.DataVisualizationNode, display: ChartDisplayType.Auto } as any,
            expectedMayRenderToCanvas: true,
            expectedDefinitelyRendersToCanvas: false,
        },
        {
            name: 'trends line chart',
            query: insightViz(trends(ChartDisplayType.ActionsLineGraph)),
            expectedMayRenderToCanvas: true,
            expectedDefinitelyRendersToCanvas: true,
        },
        {
            name: 'trends default display',
            query: insightViz(trends()),
            expectedMayRenderToCanvas: true,
            expectedDefinitelyRendersToCanvas: true,
        },
        {
            name: 'trends bold number',
            query: insightViz(trends(ChartDisplayType.BoldNumber)),
            expectedMayRenderToCanvas: false,
            expectedDefinitelyRendersToCanvas: false,
        },
        {
            name: 'trends table',
            query: insightViz(trends(ChartDisplayType.ActionsTable)),
            expectedMayRenderToCanvas: false,
            expectedDefinitelyRendersToCanvas: false,
        },
        {
            name: 'trends world map',
            query: insightViz(trends(ChartDisplayType.WorldMap)),
            expectedMayRenderToCanvas: false,
            expectedDefinitelyRendersToCanvas: false,
        },
        {
            name: 'funnel steps (default)',
            query: insightViz({ kind: NodeKind.FunnelsQuery, series: [] } as InsightQueryNode),
            expectedMayRenderToCanvas: true,
            expectedDefinitelyRendersToCanvas: true,
        },
        {
            name: 'funnel flow (Sankey)',
            query: insightViz({
                kind: NodeKind.FunnelsQuery,
                series: [],
                funnelsFilter: { funnelVizType: FunnelVizType.Flow },
            } as InsightQueryNode),
            expectedMayRenderToCanvas: false,
            expectedDefinitelyRendersToCanvas: false,
        },
        {
            name: 'funnel time to convert (table)',
            query: insightViz({
                kind: NodeKind.FunnelsQuery,
                series: [],
                funnelsFilter: { funnelVizType: FunnelVizType.TimeToConvert },
            } as InsightQueryNode),
            expectedMayRenderToCanvas: false,
            expectedDefinitelyRendersToCanvas: false,
        },
        {
            name: 'funnel trends (line chart)',
            query: insightViz({
                kind: NodeKind.FunnelsQuery,
                series: [],
                funnelsFilter: { funnelVizType: FunnelVizType.Trends },
            } as InsightQueryNode),
            expectedMayRenderToCanvas: true,
            expectedDefinitelyRendersToCanvas: true,
        },
        {
            name: 'retention',
            query: insightViz({ kind: NodeKind.RetentionQuery } as InsightQueryNode),
            expectedMayRenderToCanvas: false,
            expectedDefinitelyRendersToCanvas: false,
        },
        {
            name: 'paths',
            query: insightViz({ kind: NodeKind.PathsQuery } as InsightQueryNode),
            expectedMayRenderToCanvas: false,
            expectedDefinitelyRendersToCanvas: false,
        },
        {
            name: 'null query',
            query: null,
            expectedMayRenderToCanvas: true,
            expectedDefinitelyRendersToCanvas: false,
        },
    ])('classifies $name', ({ query, expectedMayRenderToCanvas, expectedDefinitelyRendersToCanvas }) => {
        expect(queryVizRendersToCanvas(query)).toBe(expectedMayRenderToCanvas)
        expect(queryVizDefinitelyRendersToCanvas(query)).toBe(expectedDefinitelyRendersToCanvas)
    })
})

describe('queryUsesDataWarehouse', () => {
    it('returns true for a trends query with a data warehouse series', () => {
        expect(
            queryUsesDataWarehouse({
                kind: NodeKind.TrendsQuery,
                series: [{ kind: NodeKind.DataWarehouseNode, id: 'my_table', table_name: 'stripe.charges' }],
            } as any)
        ).toBe(true)
    })

    it('unwraps InsightVizNode to inspect its source', () => {
        expect(
            queryUsesDataWarehouse({
                kind: NodeKind.InsightVizNode,
                source: {
                    kind: NodeKind.TrendsQuery,
                    series: [{ kind: NodeKind.DataWarehouseNode, id: 'my_table', table_name: 'stripe.charges' }],
                },
            } as any)
        ).toBe(true)
    })

    it('returns false for an events-only trends query', () => {
        expect(
            queryUsesDataWarehouse({
                kind: NodeKind.TrendsQuery,
                series: [{ kind: NodeKind.EventsNode, event: '$pageview' }],
            } as any)
        ).toBe(false)
    })

    it('returns false for null/undefined', () => {
        expect(queryUsesDataWarehouse(null)).toBe(false)
        expect(queryUsesDataWarehouse(undefined)).toBe(false)
    })
})

describe('dataWarehouseSourcesFromResponse', () => {
    it('extracts sources from a response that has them', () => {
        expect(
            dataWarehouseSourcesFromResponse({
                results: [],
                used_data_warehouse_sources: [{ id: 'src-1', source_type: 'Stripe', table_name: 'stripe.charges' }],
            })
        ).toEqual([{ id: 'src-1', source_type: 'Stripe', table_name: 'stripe.charges' }])
    })

    it('returns an empty array when the field is absent or the response is not an object', () => {
        expect(dataWarehouseSourcesFromResponse({ results: [] })).toEqual([])
        expect(dataWarehouseSourcesFromResponse(null)).toEqual([])
        expect(dataWarehouseSourcesFromResponse(undefined)).toEqual([])
    })
})

describe('getDisplay', () => {
    // ActionsStackedBar is a deprecated trends/stickiness alias of ActionsBar; the API and MCP
    // accept it, and nothing downstream of getDisplay knows how to render it.
    it.each([
        [
            'trends',
            {
                kind: NodeKind.TrendsQuery,
                series: [],
                trendsFilter: { display: ChartDisplayType.ActionsStackedBar },
            },
        ],
        [
            'stickiness',
            {
                kind: NodeKind.StickinessQuery,
                series: [],
                stickinessFilter: { display: ChartDisplayType.ActionsStackedBar },
            },
        ],
    ])('normalizes the deprecated ActionsStackedBar alias to ActionsBar for %s', (_, query) => {
        expect(getDisplay(query as InsightQueryNode)).toEqual(ChartDisplayType.ActionsBar)
    })
})
