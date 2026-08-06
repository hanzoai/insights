import { Suspense } from 'react'

import { Spinner } from 'lib/elements/Spinner'
import { lazyWithRetry } from 'lib/utils/retryImport'

import { Markdown, MarkdownProps } from './Markdown'

const LazyMermaidDiagram = lazyWithRetry(() => import('./MermaidDiagram'))

function renderMermaid(code: string): JSX.Element {
    return (
        <Suspense fallback={<Spinner />}>
            <LazyMermaidDiagram code={code} />
        </Suspense>
    )
}

/**
 * `Markdown` with Mermaid diagram rendering enabled. Use this in surfaces that need to render
 * ` ```mermaid ` fences (skills, prompts) — the mermaid library is loaded into its own chunk on
 * demand, so only bundles that opt in pay the cost.
 */
export function MarkdownWithMermaid(props: Omit<MarkdownProps, 'renderMermaid'>): JSX.Element {
    return <Markdown {...props} renderMermaid={renderMermaid} />
}
