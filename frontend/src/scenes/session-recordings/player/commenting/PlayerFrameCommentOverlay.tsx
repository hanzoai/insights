import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { RichContentEditor } from 'lib/elements/RichContent/RichContentEditor'
import { sessionRecordingPlayerLogic } from 'scenes/session-recordings/player/sessionRecordingPlayerLogic'

import { playerCommentOverlayLogic } from './playerFrameCommentOverlayLogic'

/**
 * Only exported individually so we can easily put it in a story file
 */
export const PlayerCommentModal = (): JSX.Element => {
    const {
        sessionPlayerData: { sessionRecordingId },
        logicProps,
    } = useValues(sessionRecordingPlayerLogic)
    const { setIsCommenting } = useActions(sessionRecordingPlayerLogic)

    const playerCommentOverlayLogicProps = { recordingId: sessionRecordingId, ...logicProps }
    const theBuiltOverlayLogic = playerCommentOverlayLogic(playerCommentOverlayLogicProps)
    const { recordingComment, isRecordingCommentSubmitting, richContentEditor } = useValues(theBuiltOverlayLogic)
    const { submitRecordingComment, resetRecordingComment, setRichContentEditor, setRichContent } =
        useActions(theBuiltOverlayLogic)

    return (
        <div className="absolute bottom-4 left-4 z-20 w-90">
            <div className="flex flex-col bg-primary border border-border rounded p-2 shadow-lg">
                <Form
                    logic={playerCommentOverlayLogic}
                    props={playerCommentOverlayLogicProps}
                    formKey="recordingComment"
                    id="recording-comment-form"
                    enableFormOnSubmit
                    className="flex flex-col gap-y-1"
                >
                    <div className="flex flex-col gap-y-1">
                        <Field name="commentId" className="hidden">
                            <input type="hidden" />
                        </Field>
                        <Field
                            name="timeInRecording"
                            label={<span>Comment at</span>}
                            inline={true}
                            className="justify-end"
                        >
                            <Input disabled={true} />
                        </Field>
                    </div>
                    <div>
                        <Field name="content">
                            <RichContentEditor
                                placeholder="Comment on this recording? Use @ to mention team members"
                                data-attr="create-recording-comment-input"
                                onPressCmdEnter={submitRecordingComment}
                                initialContent={recordingComment.richContent}
                                onCreate={setRichContentEditor}
                                onUpdate={() => {
                                    // it can't be null by now, but TS doesn't know that
                                    if (richContentEditor) {
                                        setRichContent(richContentEditor.getJSON())
                                    }
                                }}
                                minRows={3}
                            />
                        </Field>
                    </div>
                    <div className="flex gap-2 mt-2 justify-between">
                        <Button
                            data-attr="cancel-recording-comment"
                            type="secondary"
                            onClick={() => {
                                resetRecordingComment()
                                setIsCommenting(false)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            form="recording-comment-form"
                            type="primary"
                            onClick={submitRecordingComment}
                            data-attr="create-recording-comment-submit"
                            size="small"
                            loading={isRecordingCommentSubmitting}
                        >
                            {recordingComment.commentId ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    )
}

export function PlayerFrameCommentOverlay(): JSX.Element | null {
    const { isCommenting } = useValues(sessionRecordingPlayerLogic)

    return isCommenting ? <PlayerCommentModal /> : null
}
