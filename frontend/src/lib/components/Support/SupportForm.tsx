import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { useRef } from 'react'

import { IconBug, IconInfo, IconQuestion } from '@hanzo/icons'
import {
    Banner,
    Input,
    SegmentedButton,
    SegmentedButtonOption,
    Link,
    Tooltip,
    toast,
} from '@hanzo/elements'

import { useUploadFiles } from 'lib/hooks/useUploadFiles'
import { IconFeedback } from 'lib/elements/icons'
import { Field } from 'lib/elements/Field'
import { FileInput } from 'lib/elements/FileInput/FileInput'
import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { Select } from 'lib/elements/Select/Select'
import { TextArea } from 'lib/elements/TextArea/TextArea'
import { preflightLogic } from 'lib/logic/preflightLogic'
import { userLogic } from 'scenes/userLogic'

import {
    SEVERITY_LEVEL_TO_NAME,
    SUPPORT_TICKET_TEMPLATES,
    SupportTicketKind,
    TARGET_AREA_OPTIONS,
    supportLogic,
} from './supportLogic'

const SUPPORT_TICKET_OPTIONS: SegmentedButtonOption<SupportTicketKind>[] = [
    {
        value: 'support',
        label: 'Question',
        icon: <IconQuestion />,
    },
    {
        value: 'feedback',
        label: 'Feedback',
        icon: <IconFeedback />,
    },
    {
        value: 'bug',
        label: 'Bug',
        icon: <IconBug />,
    },
]

const SUPPORT_TICKET_KIND_TO_PROMPT: Record<SupportTicketKind, string> = {
    bug: "What's the bug?",
    feedback: 'What feedback do you have?',
    support: 'What can we help you with?',
}

interface SupportFormProps {
    /** Overrides the message field label (e.g. "Anything to add?" for the Insights AI ticket flow) */
    messageLabel?: string
    /** Overrides the message field placeholder */
    messagePlaceholder?: string
}

export function SupportForm({ messageLabel, messagePlaceholder }: SupportFormProps = {}): JSX.Element | null {
    const { sendSupportRequest, conversationsFlagEnabled } = useValues(supportLogic)
    const { setSendSupportRequestValue } = useActions(supportLogic)
    const { objectStorageAvailable } = useValues(preflightLogic)
    // the support model can be shown when logged out, file upload is not offered to anonymous users
    const { user } = useValues(userLogic)
    // only allow authentication issues for logged out users

    const dropRef = useRef<HTMLDivElement>(null)

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>): void => {
        const items = e.clipboardData?.items
        if (!items) {
            return
        }

        // Convert DataTransferItemList to array for iteration
        const itemsArray = Array.from(items)
        for (const item of itemsArray) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile()
                if (file) {
                    setFilesToUpload([...filesToUpload, file])
                }
            }
        }
    }

    const { setFilesToUpload, filesToUpload, uploading } = useUploadFiles({
        onUpload: (url, fileName) => {
            setSendSupportRequestValue('message', sendSupportRequest.message + `\n\nAttachment "${fileName}": ${url}`)
        },
        onError: (detail) => {
            toast.error(`Error uploading image: ${detail}`)
        },
    })

    const changeKind = (kind: SupportTicketKind): void => {
        setSendSupportRequestValue('kind', kind)
        if (kind === 'bug') {
            setSendSupportRequestValue('severity_level', 'medium')
        } else {
            setSendSupportRequestValue('severity_level', 'low')
        }
    }

    return (
        <Form
            logic={supportLogic}
            formKey="sendSupportRequest"
            id="support-modal-form"
            enableFormOnSubmit
            className="deprecated-space-y-4"
        >
            {!user && (
                <>
                    <Field name="name" label="Name">
                        <Input data-attr="name" placeholder="Jane" />
                    </Field>
                    <Field name="email" label="Email">
                        <Input data-attr="email" placeholder="your@email.com" />
                    </Field>
                </>
            )}
            {!conversationsFlagEnabled && (
                <>
                    <Field name="kind" label="Message type">
                        <SegmentedButton onChange={changeKind} fullWidth options={SUPPORT_TICKET_OPTIONS} />
                    </Field>
                    <div className="flex gap-2 flex-col">
                        <div className="flex justify-between items-center">
                            <label className="Label">
                                Topic
                                <Tooltip title="Route your request to the appropriate team.">
                                    <span>
                                        <IconInfo className="opacity-75" />
                                    </span>
                                </Tooltip>
                            </label>
                            <Link
                                target="_blank"
                                disableDocsPanel
                                to="https://hanzo.ai/handbook/engineering/feature-ownership"
                            >
                                Feature ownership
                            </Link>
                        </div>
                        <Field name="target_area">
                            {({ value, onChange }) => (
                                <Tooltip
                                    title={
                                        !user
                                            ? 'Please login to your account before opening a ticket unrelated to authentication issues.'
                                            : undefined
                                    }
                                >
                                    <span className="block">
                                        <InputSelect
                                            mode="single"
                                            fullWidth
                                            disabled={!user}
                                            placeholder="Search for a topic"
                                            data-attr="support-form-target-area"
                                            options={TARGET_AREA_OPTIONS}
                                            value={value ? [value] : []}
                                            onChange={([newValue]) => onChange(newValue ?? null)}
                                        />
                                    </span>
                                </Tooltip>
                            )}
                        </Field>
                    </div>
                    {sendSupportRequest.target_area === 'error_tracking' && (
                        <Banner type="warning">
                            This topic is for our Error Tracking <i>product</i>. If you're reporting an error in Insights
                            please choose the relevant topic so your submission is sent to the correct team.
                        </Banner>
                    )}
                </>
            )}
            <Field
                name="message"
                label={
                    messageLabel ??
                    (sendSupportRequest.kind ? SUPPORT_TICKET_KIND_TO_PROMPT[sendSupportRequest.kind] : 'Content')
                }
            >
                {(props) => (
                    <div ref={dropRef} className="flex flex-col gap-2" onPaste={handlePaste}>
                        <TextArea
                            placeholder={
                                messagePlaceholder ??
                                SUPPORT_TICKET_TEMPLATES[sendSupportRequest.kind] ??
                                'Type your message here'
                            }
                            data-attr="support-form-content-input"
                            minRows={5}
                            {...props}
                        />
                        {objectStorageAvailable && !!user && (
                            <FileInput
                                accept="image/*"
                                multiple={false}
                                alternativeDropTargetRef={dropRef}
                                onChange={setFilesToUpload}
                                loading={uploading}
                                value={filesToUpload}
                            />
                        )}
                    </div>
                )}
            </Field>
            {!conversationsFlagEnabled && (
                <div className="flex gap-2 flex-col">
                    <div className="flex justify-between items-center">
                        <label className="Label">
                            Severity level
                            <Tooltip title="Severity levels help us prioritize your request.">
                                <span>
                                    <IconInfo className="opacity-75" />
                                </span>
                            </Tooltip>
                        </label>
                        <Link
                            target="_blank"
                            disableDocsPanel
                            to="https://hanzo.ai/docs/support-options#severity-levels"
                        >
                            Definitions
                        </Link>
                    </div>
                    <Field name="severity_level">
                        <Select
                            fullWidth
                            options={Object.entries(SEVERITY_LEVEL_TO_NAME).map(([key, value]) => ({
                                label: value,
                                value: key,
                            }))}
                        />
                    </Field>
                </div>
            )}
        </Form>
    )
}
