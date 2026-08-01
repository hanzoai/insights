import './SupportMarkdown.scss'

import clsx from 'clsx'

import { Markdown, MarkdownProps } from 'lib/elements/Markdown'

import { useImageLightbox } from './useImageLightbox'

export interface SupportMarkdownProps extends MarkdownProps {}

/**
 * Markdown renderer for support messages.
 * Wraps Markdown with support-specific styling.
 */
export function SupportMarkdown({ className, wrapCode = true, ...props }: SupportMarkdownProps): JSX.Element {
    const { handleClick, lightbox } = useImageLightbox()

    return (
        <>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div onClick={handleClick}>
                <Markdown {...props} wrapCode={wrapCode} className={clsx('SupportMarkdown', className)} />
            </div>
            {lightbox}
        </>
    )
}
