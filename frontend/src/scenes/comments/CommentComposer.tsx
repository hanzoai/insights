import { useActions, useValues } from 'kea'
import { useEffect } from 'react'

import { Button } from '@hanzo/elements'

import { humanizeScope } from 'lib/components/ActivityLog/humanizeActivity'
import { KeyboardShortcut } from 'lib/components/KeyboardShortcut/KeyboardShortcut'
import { RichContentEditor } from 'lib/elements/RichContent/RichContentEditor'

import { CommentsLogicProps, commentsLogic } from './commentsLogic'

export type CommentComposerProps = CommentsLogicProps & {
    /** The footer variant swaps to a "New comment" button while a reply is in progress; 'inline-reply' renders inside the thread */
    variant?: 'footer' | 'inline-reply'
}

export const CommentComposer = ({ variant = 'footer', ...props }: CommentComposerProps): JSX.Element => {
    const { key, isSendingComment, replyingCommentId, itemContext, isEmpty, currentComposerDraft } = useValues(
        commentsLogic(props)
    )
    const { sendComposedContent, clearItemContext, setRichContentEditor, onRichContentEditorUpdate, startNewComment } =
        useActions(commentsLogic(props))

    const placeholder = replyingCommentId
        ? 'Reply...'
        : `Comment on ${props.item_id ? 'this ' : ''}${humanizeScope(props.scope, !!props.item_id)}`

    useEffect(() => {
        // Only the footer owns the item context - the inline reply composer unmounting must not wipe it
        if (variant !== 'footer') {
            return
        }
        // Whenever the discussion context changes or we fully unmount we clear the item context
        return () => clearItemContext()
        // oxlint-disable-next-line exhaustive-deps
    }, [key, variant, clearItemContext])

    if (variant === 'footer' && replyingCommentId) {
        // The composer is rendered inline in the thread being replied to - offer a way back
        return (
            <div className="flex justify-end pt-2">
                <Button
                    size="small"
                    type="secondary"
                    onClick={() => startNewComment()}
                    data-attr="discussions-new-comment"
                >
                    New comment
                </Button>
            </div>
        )
    }

    const buttonSize = variant === 'inline-reply' ? 'small' : undefined

    return (
        <div className="flex flex-col gap-2">
            <RichContentEditor
                key={key}
                logicKey="discussions"
                placeholder={placeholder}
                initialContent={currentComposerDraft}
                onCreate={setRichContentEditor}
                onUpdate={onRichContentEditorUpdate}
                onPressCmdEnter={() => {
                    // The send buttons are disabled when empty - the shortcut must not bypass that
                    if (!isEmpty) {
                        sendComposedContent(false)
                    }
                }}
                disabled={isSendingComment}
            />
            <div className="flex justify-between items-center gap-2">
                <div className="flex-1" />
                {itemContext ? (
                    <Button size={buttonSize} type="secondary" onClick={() => clearItemContext()}>
                        Cancel
                    </Button>
                ) : null}
                {!replyingCommentId ? (
                    <Button
                        size={buttonSize}
                        type="secondary"
                        onClick={() => sendComposedContent(true)}
                        loading={isSendingComment}
                        disabledReason={isEmpty ? 'No message' : null}
                        data-attr="discussions-comment-task"
                    >
                        Add as task
                    </Button>
                ) : null}
                <Button
                    size={buttonSize}
                    type="primary"
                    onClick={() => sendComposedContent(false)}
                    loading={isSendingComment}
                    disabledReason={isEmpty ? 'No message' : null}
                    sideIcon={<KeyboardShortcut command enter />}
                    data-attr="discussions-comment"
                >
                    Add {replyingCommentId ? 'reply' : 'comment'}
                </Button>
            </div>
        </div>
    )
}
