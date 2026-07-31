import './Markdown.scss'

import clsx from 'clsx'
import { props } from 'kea'
import React, { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { RichContentMention } from 'lib/components/RichContentEditor/RichContentNodeMention'
import { RichContentNodeType } from 'lib/components/RichContentEditor/types'
import { Checkbox } from 'lib/elements/Checkbox'

import { Link } from '../Link'
import remarkMentions from './mention'

interface MarkdownContainerProps {
    children: React.ReactNode
    className?: string
}

function MarkdownContainer({ children, className }: MarkdownContainerProps): JSX.Element {
    return <div className={clsx('Markdown', className)}>{children}</div>
}

export interface MarkdownProps {
    children: string
    /** Whether headings should just be <strong> text. Recommended for item descriptions. */
    lowKeyHeadings?: boolean
    /** Whether to disable the docs sidebar panel behavior and always open links in a new tab */
    disableDocsRedirect?: boolean
    className?: string
    wrapCode?: boolean
}

const MarkdownRenderer = memo(function MarkdownRenderer({
    children,
    lowKeyHeadings = false,
    disableDocsRedirect = false,
    wrapCode = false,
}: MarkdownProps): JSX.Element {
    const renderers = useMemo<{ [nodeType: string]: React.ElementType }>(
        () => ({
            link: ({ href, children }: any): JSX.Element => (
                <Link to={href} target="_blank" targetBlankIcon disableDocsPanel={disableDocsRedirect}>
                    {children}
                </Link>
            ),
            code: ({ language, value }: any): JSX.Element => (
                <CodeSnippet language={language || Language.Text} wrap={wrapCode} compact>
                    {value}
                </CodeSnippet>
            ),
            [RichContentNodeType.Mention]: ({ id }): JSX.Element => <RichContentMention id={id} />,
            listItem: ({ checked, children }: any): JSX.Element => {
                // Handle task list items with Checkbox
                if (checked != null) {
                    return (
                        <li className="Markdown__task">
                            <Checkbox checked={checked} disabledReason="Read-only for display" size="small" />
                            <span className="Markdown__task-content">{children}</span>
                        </li>
                    )
                }
                // Regular list item
                return <li {...props}>{children}</li>
            },
            ...(lowKeyHeadings
                ? {
                      heading: 'strong',
                  }
                : {}),
        }),
        [disableDocsRedirect, lowKeyHeadings, wrapCode]
    )

    return (
        /* eslint-disable-next-line react/forbid-elements */
        <ReactMarkdown
            renderers={renderers}
            disallowedTypes={['html']} // Don't want to deal with the security considerations of HTML
            plugins={[remarkGfm, remarkMentions]}
        >
            {children}
        </ReactMarkdown>
    )
})

/** Beautifully rendered Markdown. */
function MarkdownComponent({
    children,
    lowKeyHeadings = false,
    disableDocsRedirect = false,
    wrapCode = false,
    className,
}: MarkdownProps): JSX.Element {
    return (
        <MarkdownContainer className={className}>
            <MarkdownRenderer
                lowKeyHeadings={lowKeyHeadings}
                disableDocsRedirect={disableDocsRedirect}
                wrapCode={wrapCode}
            >
                {children}
            </MarkdownRenderer>
        </MarkdownContainer>
    )
}

export const Markdown = Object.assign(MarkdownComponent, {
    Container: MarkdownContainer,
    Renderer: MarkdownRenderer,
})
