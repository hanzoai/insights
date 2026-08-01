import { useValues } from 'kea'
import { useState } from 'react'

import { PropertyFilters } from 'lib/components/PropertyFilters/PropertyFilters'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'

import { groupsModel } from '~/models/groupsModel'
import {
    EventsNode,
    EventsQuery,
    InsightsQLQuery,
    SessionAttributionExplorerQuery,
    SessionsQuery,
    TracesQuery,
} from '~/queries/schema/schema-general'
import { isInsightsQLQuery, isSessionAttributionExplorerQuery, isSessionsQuery } from '~/queries/utils'
import { AnyPropertyFilter } from '~/types'

interface EventPropertyFiltersProps<
    Q extends EventsNode | EventsQuery | InsightsQLQuery | SessionAttributionExplorerQuery | SessionsQuery | TracesQuery,
> {
    query: Q
    setQuery?: (query: Q) => void
    taxonomicGroupTypes?: TaxonomicFilterGroupType[]
}

let uniqueNode = 0
export function EventPropertyFilters<
    Q extends EventsNode | EventsQuery | InsightsQLQuery | SessionAttributionExplorerQuery | SessionsQuery | TracesQuery,
>({ query, setQuery, taxonomicGroupTypes }: EventPropertyFiltersProps<Q>): JSX.Element {
    const [id] = useState(() => uniqueNode++)
    const properties =
        isInsightsQLQuery(query) || isSessionAttributionExplorerQuery(query)
            ? query.filters?.properties
            : isSessionsQuery(query)
              ? query.eventProperties
              : query.properties
    const eventNames =
        isInsightsQLQuery(query) || isSessionAttributionExplorerQuery(query)
            ? []
            : 'event' in query && query.event
              ? [query.event]
              : []
    const { groupsTaxonomicTypes } = useValues(groupsModel)

    return !properties || Array.isArray(properties) ? (
        <PropertyFilters
            propertyFilters={properties || []}
            taxonomicGroupTypes={
                taxonomicGroupTypes || [
                    TaxonomicFilterGroupType.EventProperties,
                    TaxonomicFilterGroupType.PersonProperties,
                    TaxonomicFilterGroupType.EventFeatureFlags,
                    TaxonomicFilterGroupType.EventMetadata,
                    ...groupsTaxonomicTypes,
                    TaxonomicFilterGroupType.Cohorts,
                    TaxonomicFilterGroupType.Elements,
                    TaxonomicFilterGroupType.InsightsQLExpression,
                    TaxonomicFilterGroupType.PageviewUrls,
                    TaxonomicFilterGroupType.Screens,
                    TaxonomicFilterGroupType.EmailAddresses,
                ]
            }
            onChange={(value: AnyPropertyFilter[]) => {
                if (isInsightsQLQuery(query) || isSessionAttributionExplorerQuery(query)) {
                    setQuery?.({ ...query, filters: { ...query.filters, properties: value } })
                } else if (isSessionsQuery(query)) {
                    setQuery?.({ ...query, eventProperties: value })
                } else {
                    setQuery?.({ ...query, properties: value })
                }
            }}
            pageKey={`EventPropertyFilters.${id}`}
            eventNames={eventNames}
            buttonText="Property filters"
        />
    ) : (
        <div>Error: property groups are not supported.</div>
    )
}
