import { AnyDataNode, NodeKind } from '~/queries/schema/schema-general'

export function getContextSourceQuery(sourceQuery: AnyDataNode | undefined, query: string): AnyDataNode | undefined {
    if (sourceQuery?.kind !== NodeKind.InsightsQLQuery) {
        return sourceQuery
    }

    const sourceQueryText = sourceQuery.query?.trim()
    if (!sourceQueryText) {
        return undefined
    }

    if (sourceQuery.query === query) {
        return undefined
    }

    return sourceQuery
}
