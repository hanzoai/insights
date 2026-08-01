import { Markdown } from 'lib/elements/Markdown'

import { HighlightedContentWrapper } from './HighlightedContentWrapper'

interface HighlightedLemonMarkdownProps {
    children: string
    className?: string
    searchQuery?: string
}

export function HighlightedLemonMarkdown({
    children,
    className,
    searchQuery,
}: HighlightedLemonMarkdownProps): JSX.Element {
    return (
        <HighlightedContentWrapper searchQuery={searchQuery}>
            <Markdown className={className}>{children}</Markdown>
        </HighlightedContentWrapper>
    )
}
