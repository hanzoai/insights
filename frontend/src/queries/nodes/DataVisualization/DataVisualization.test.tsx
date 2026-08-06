import { cleanup, render, waitFor } from '@testing-library/react'

import { DataVisualizationNode, InsightsQLQueryResponse, NodeKind } from '~/queries/schema/schema-general'
import { initKeaTests } from '~/test/init'
import { ChartDisplayType } from '~/types'

import { DataTableVisualization } from './DataVisualization'

type TableMockProps = {
    embedded?: boolean
    allowContentScroll?: boolean
}

let mockLatestTableProps: TableMockProps | null = null
const mockTable = jest.fn((props: TableMockProps): null => {
    mockLatestTableProps = props
    return null
})

jest.mock('@hanzo/elements', () => ({
    ...jest.requireActual('@hanzo/elements'),
    Table: (props: Record<string, unknown>): null => {
        mockTable(props)
        return null
    },
}))

describe('DataTableVisualization', () => {
    const query: DataVisualizationNode = {
        kind: NodeKind.DataVisualizationNode,
        source: {
            kind: NodeKind.InsightsQLQuery,
            query: 'select number from numbers(2)',
        },
        display: ChartDisplayType.ActionsTable,
    }

    const cachedResults: InsightsQLQueryResponse<number[][]> = {
        results: [[1], [2]],
        columns: ['number'],
        types: [['number', 'Int64']],
    }

    beforeEach(() => {
        initKeaTests()
        mockLatestTableProps = null
        mockTable.mockClear()
    })

    afterEach(() => {
        cleanup()
    })

    test.each([
        { embedded: true, expectedAllowContentScroll: true },
        { embedded: false, expectedAllowContentScroll: false },
    ])(
        'sets table scroll mode to $expectedAllowContentScroll when embedded is $embedded',
        async ({ embedded, expectedAllowContentScroll }) => {
            render(
                <DataTableVisualization
                    uniqueKey={`data-visualization-scroll-${embedded}`}
                    query={query}
                    setQuery={jest.fn()}
                    cachedResults={cachedResults}
                    readOnly
                    embedded={embedded}
                />
            )

            await waitFor(() => {
                if (!mockLatestTableProps) {
                    throw new Error('Expected Table to render')
                }
            })

            if (!mockLatestTableProps) {
                throw new Error('Expected Table props to be recorded')
            }
            expect(mockLatestTableProps.embedded).toBe(embedded)
            expect(mockLatestTableProps.allowContentScroll).toBe(expectedAllowContentScroll)
        }
    )
})
