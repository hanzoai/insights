import { Suspense } from 'react'

import { Dialog } from 'lib/elements/Dialog'
import { Spinner } from 'lib/elements/Spinner'
import { lazyWithRetry } from 'lib/utils/retryImport'

import type { DebugCHQueriesProps } from './DebugCHQueriesImpl'

const LazyDebugCHQueries = lazyWithRetry(() =>
    import('./DebugCHQueriesImpl').then((m) => ({ default: m.DebugCHQueries }))
)

/** Lazy facade so the debug panel's chart.js dependencies stay out of the eager menu/shortcut chunks. */
export function DebugCHQueries(props: DebugCHQueriesProps): JSX.Element {
    return (
        <Suspense fallback={<Spinner />}>
            <LazyDebugCHQueries {...props} />
        </Suspense>
    )
}

export function openCHQueriesDebugModal(): void {
    Dialog.open({
        title: 'Datastore queries recently executed for this user',
        content: <DebugCHQueries />,
        primaryButton: null,
        width: 1600,
    })
}
