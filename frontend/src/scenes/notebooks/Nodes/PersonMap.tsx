import { Marker } from 'maplibre-gl'

import { Map } from 'lib/components/Map/Map'

/**
 * The only thing in the app that pulls in maplibre-gl, kept behind a lazy import.
 *
 * maplibre is ~800KB and `lib/components/Map/Map` calls `addProtocol` at module
 * scope, so importing it anywhere costs the whole library at load. It was reached
 * from the app shell -- SidePanel imports NotebookPanel imports Notebook imports
 * Editor, which registers every node type including the map -- so every user paid
 * for it on every page to render a marker on one notebook node.
 *
 * The Marker construction lives here rather than at the call site because Marker
 * comes from maplibre too: constructing it outside this module would pull the
 * library straight back into the main bundle and undo the split.
 */
export function PersonMap({ coordinates }: { coordinates: [number, number] }): JSX.Element {
    return (
        <Map
            center={coordinates}
            markers={[new Marker({ color: 'var(--color-accent)' }).setLngLat(coordinates)]}
            className="h-full"
        />
    )
}
