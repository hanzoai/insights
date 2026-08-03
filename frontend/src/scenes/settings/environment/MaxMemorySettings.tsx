import { Unavailable } from 'lib/components/Unavailable/Unavailable'

/**
 * The assistant runs, but it does not remember anything between conversations: what
 * came back with `products/insights_ai` is the thread, not the store of remembered
 * details this form used to edit. Both places that open this — the settings section
 * and the sidebar's memory modal — say so rather than offering a textarea whose
 * contents nothing would read.
 */
export function MaxMemorySettings(): JSX.Element {
    return <Unavailable capability="aiMemory" />
}
