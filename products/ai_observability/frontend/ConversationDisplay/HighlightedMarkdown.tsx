import { Markdown } from 'lib/elements/Markdown'

import { HighlightedContentWrapper } from './HighlightedContentWrapper'

interface HighlightedMarkdownProps {
    children: string
    className?: string
    searchQuery?: string
}

export function HighlightedMarkdown({
    children,
    className,
    searchQuery,
}: HighlightedMarkdownProps): JSX.Element {
    return (
        <HighlightedContentWrapper searchQuery={searchQuery}>
            <Markdown className={className}>{children}</Markdown>
        </HighlightedContentWrapper>
    )
}
