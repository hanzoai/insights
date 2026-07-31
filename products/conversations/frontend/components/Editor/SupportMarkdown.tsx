import './SupportMarkdown.scss'

import clsx from 'clsx'

import { Markdown, MarkdownProps } from 'lib/elements/Markdown'

export interface SupportMarkdownProps extends MarkdownProps {}

/**
 * Markdown renderer for support messages.
 * Wraps Markdown with support-specific styling.
 */
export function SupportMarkdown({ className, ...props }: SupportMarkdownProps): JSX.Element {
    return <Markdown {...props} className={clsx('SupportMarkdown', className)} />
}
