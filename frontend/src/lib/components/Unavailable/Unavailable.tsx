import { CAPABILITIES, CapabilityKey } from 'lib/capabilities'
import { EmptyMessage } from 'lib/components/EmptyMessage/EmptyMessage'

export interface UnavailableProps {
    capability: CapabilityKey
}

/**
 * The honest state for a capability this build doesn't carry. Render it where someone can still
 * land on the surface. Where the entry point itself can go away, remove it instead of showing this.
 */
export function Unavailable({ capability }: UnavailableProps): JSX.Element {
    const { title, body, link } = CAPABILITIES[capability]

    return <EmptyMessage title={title} description={body} buttonText={link?.label} buttonTo={link?.to()} />
}
