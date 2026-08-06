import { DataTableNode, InsightsQLQuery, NodeKind } from '~/queries/schema/schema-general'

import { getExecutedQueryTabLabel } from './QueryTabs'

describe('getExecutedQueryTabLabel', () => {
    it('keeps the datastore label for regular InsightsQL queries', () => {
        const query: InsightsQLQuery = {
            kind: NodeKind.InsightsQLQuery,
            query: 'SELECT 1',
        }

        expect(getExecutedQueryTabLabel(query)).toEqual('Datastore')
    })

    it('shows raw sql for direct-source InsightsQL queries', () => {
        const query: InsightsQLQuery = {
            kind: NodeKind.InsightsQLQuery,
            query: 'SELECT 1',
            connectionId: 'postgres-connection-id',
        }

        expect(getExecutedQueryTabLabel(query)).toEqual('Raw SQL')
    })

    it('shows raw sql when a data table wraps a direct-source InsightsQL query', () => {
        const query: DataTableNode = {
            kind: NodeKind.DataTableNode,
            source: {
                kind: NodeKind.InsightsQLQuery,
                query: 'SELECT 1',
                connectionId: 'postgres-connection-id',
            },
        }

        expect(getExecutedQueryTabLabel(query)).toEqual('Raw SQL')
    })
})
