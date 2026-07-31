import { useAsyncActions, useValues } from 'kea'
import insights from '@hanzo/insights'
import { useState } from 'react'

import { IconCheck, IconPencil, IconX } from '@hanzo/icons'
import { Button, Skeleton, Tag, TextAreaMarkdown } from '@hanzo/elements'

import { NotFound } from 'lib/components/NotFound'
import { dayjs } from 'lib/dayjs'
import { Markdown } from 'lib/elements/Markdown'
import { Widget } from 'lib/elements/Widget/Widget'
import { PersonDisplay } from 'scenes/persons/PersonDisplay'
import { SceneExport } from 'scenes/sceneTypes'

import { UserInterviewType } from '~/types'

import { UserInterviewLogicProps, userInterviewLogic } from './userInterviewLogic'

export const scene: SceneExport<UserInterviewLogicProps> = {
    component: UserInterview,
    logic: userInterviewLogic,
    paramsToProps: ({ params: { id } }) => ({ id }),
}

export function UserInterview(): JSX.Element {
    const { userInterview, userInterviewLoading } = useValues(userInterviewLogic)
    const { updateUserInterview } = useAsyncActions(userInterviewLogic)

    const [summaryInEditing, setSummaryInEditing] = useState<string | null>(null)

    if (userInterviewLoading && !userInterview) {
        return (
            <div className="@container">
                <div className="grid grid-cols-1 items-start gap-4 @4xl:grid-cols-3">
                    <Widget title="Summary" className="col-span-2">
                        <div className="space-y-1.5 p-3">
                            <Skeleton.Text className="h-6 w-[20%]" />
                            <Skeleton.Text className="h-3 w-[60%]" />
                            <Skeleton.Text className="h-3 w-[70%]" />
                            <Skeleton.Text className="h-3 w-[80%]" />
                            <Skeleton.Text className="h-3 w-[40%]" />
                            <Skeleton.Text className="h-3 w-[55%]" />
                            <Skeleton.Text className="h-3 w-[65%]" />
                        </div>
                    </Widget>
                    <Widget title="Transcript" className="col-span-1">
                        <div className="space-y-1.5 p-3">
                            <Skeleton.Text className="h-3 w-[80%]" />
                            <Skeleton.Text className="h-3 w-[40%]" />
                            <Skeleton.Text className="h-3 w-[60%]" />
                            <Skeleton.Text className="h-3 w-[70%]" />
                            <Skeleton.Text className="h-3 w-[80%]" />
                            <Skeleton.Text className="h-3 w-[40%]" />
                            <Skeleton.Text className="h-3 w-[60%]" />
                            <Skeleton.Text className="h-3 w-[70%]" />
                        </div>
                    </Widget>
                </div>
            </div>
        )
    }

    if (!userInterview) {
        return <NotFound object="user interview" />
    }

    return (
        <div className="@container">
            <InterviewMetadata interview={userInterview} />
            <div className="grid grid-cols-1 items-start gap-4 @4xl:grid-cols-3">
                <Widget
                    title="Summary"
                    className="col-span-2"
                    actions={
                        summaryInEditing !== null ? (
                            <>
                                <Button
                                    size="xsmall"
                                    icon={<IconX />}
                                    tooltip="Discard changes"
                                    onClick={() => setSummaryInEditing(null)}
                                    disabledReason={userInterviewLoading ? 'Saving…' : undefined}
                                />
                                <Button
                                    size="xsmall"
                                    icon={<IconCheck />}
                                    tooltip="Save"
                                    onClick={() => {
                                        updateUserInterview({ summary: summaryInEditing })
                                            .then(() => {
                                                setSummaryInEditing(null)
                                            })
                                            .catch((e) => insights.captureException(e))
                                    }}
                                    loading={userInterviewLoading}
                                />
                            </>
                        ) : (
                            <Button
                                size="xsmall"
                                icon={<IconPencil />}
                                onClick={() => setSummaryInEditing(userInterview.summary || '')}
                            />
                        )
                    }
                >
                    {summaryInEditing !== null ? (
                        <TextAreaMarkdown
                            value={summaryInEditing}
                            onChange={(newValue) => setSummaryInEditing(newValue)}
                            className="pb-2 px-3"
                        />
                    ) : (
                        <Markdown className="p-3">
                            {userInterview.summary || '_No summary available._'}
                        </Markdown>
                    )}
                </Widget>
                <div className="col-span-1 flex flex-col gap-y-4">
                    <Widget title="Participants">
                        <div className="p-3 flex flex-col gap-y-2">
                            {userInterview.interviewee_emails.map((interviewee_email) => (
                                <PersonDisplay
                                    key={interviewee_email}
                                    person={{
                                        properties: {
                                            email: interviewee_email,
                                        },
                                        distinct_id: interviewee_email,
                                    }}
                                    withIcon
                                />
                            ))}
                        </div>
                    </Widget>
                    <Widget title="Transcript">
                        <Markdown className="p-3">
                            {userInterview.transcript || '_No transcript available._'}
                        </Markdown>
                    </Widget>
                </div>
            </div>
        </div>
    )
}

function InterviewMetadata({ interview }: { interview: UserInterviewType }): JSX.Element {
    return (
        <header className="flex gap-x-2 gap-y-1 flex-wrap items-center">
            {interview.created_at && (
                <Tag className="bg-bg-light">
                    Created: {dayjs(interview.created_at).format('YYYY-MM-DD HH:mm')}
                </Tag>
            )}
        </header>
    )
}
