import { useValues } from 'kea'
import { Suspense, lazy } from 'react'

import { Skeleton } from '@hanzo/elements'

import { NotFound } from 'lib/components/NotFound'
import { createInsightsWidgetNode } from 'scenes/notebooks/Nodes/NodeWrapper'
import { personLogic } from 'scenes/persons/personLogic'

import { NotebookNodeProps, NotebookNodeType } from '../types'
import { NotebookNodeEmptyState } from './components/NotebookNodeEmptyState'
import { notebookNodeLogic } from './notebookNodeLogic'

// maplibre-gl is ~800KB and Map calls addProtocol at module scope, so a static
// import costs every page load. This node is reachable from the app shell
// (SidePanel -> NotebookPanel -> Notebook -> Editor registers every node type),
// which put the whole library in the main bundle for one marker. Same lazy shape
// Trends already uses for WorldMap and RegionMap.
const PersonMap = lazy(() => import('./PersonMap').then((m) => ({ default: m.PersonMap })))

const Component = ({ attributes }: NotebookNodeProps<NotebookNodeMapAttributes>): JSX.Element | null => {
    const { id, distinctId } = attributes
    const { expanded } = useValues(notebookNodeLogic)

    const logic = personLogic({ id, distinctId })
    const { person, personLoading } = useValues(logic)

    if (personLoading) {
        return <Skeleton className="h-6" />
    } else if (!person) {
        return <NotFound object="person" />
    }

    if (!expanded) {
        return null
    }

    const longtitude = person?.properties?.['$geoip_longitude']
    const latitude = person?.properties?.['$geoip_latitude']
    const personCoordinates: [number, number] | null =
        !isNaN(longtitude) && !isNaN(latitude) ? [longtitude, latitude] : null

    if (!personCoordinates) {
        return <NotebookNodeEmptyState message="No map available." />
    }

    return (
        <Suspense fallback={<Skeleton className="h-full" />}>
            <PersonMap coordinates={personCoordinates} />
        </Suspense>
    )
}

type NotebookNodeMapAttributes = {
    id: string
    distinctId: string
}

export const NotebookNodeMap = createInsightsWidgetNode<NotebookNodeMapAttributes>({
    nodeType: NotebookNodeType.Map,
    titlePlaceholder: 'Location',
    Component,
    resizeable: true,
    heightEstimate: 150,
    expandable: true,
    startExpanded: true,
    attributes: {
        id: {},
        distinctId: {},
    },
})
