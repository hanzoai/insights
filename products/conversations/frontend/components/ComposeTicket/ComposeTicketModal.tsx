import { useActions, useValues } from 'kea'
import { useRef } from 'react'

import { Button, Input, Modal, Select, Tag } from '@hanzo/elements'

import { RichContentEditorType } from 'lib/components/RichContentEditor/types'

import { SupportEditor, serializeToMarkdown } from '../Editor'
import { composeTicketLogic } from './composeTicketLogic'

export function ComposeTicketModal(): JSX.Element | null {
    const {
        isOpen,
        recipientEmail,
        recipientDistinctId,
        emailSubject,
        emailConfigId,
        emailConfigs,
        emailConfigsLoading,
        composingLoading,
    } = useValues(composeTicketLogic)
    const { closeComposeModal, setRecipientEmail, setEmailSubject, setEmailConfigId, submitCompose } =
        useActions(composeTicketLogic)

    const editorRef = useRef<RichContentEditorType | null>(null)
    const verifiedEmailConfigs = emailConfigs.filter((c) => c.domain_verified)

    const emailConfigOptions = verifiedEmailConfigs.map((c) => ({
        value: c.id,
        label: (
            <span className="flex items-center gap-1">
                {`${c.from_name} <${c.from_email}>`}
                {c.is_default && <Tag type="primary">Primary</Tag>}
            </span>
        ),
    }))

    const handleSubmit = (): void => {
        const richContent = editorRef.current?.getJSON() ?? null
        const content = richContent ? serializeToMarkdown(richContent) : ''
        submitCompose(content, richContent as Record<string, unknown> | null)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeComposeModal}
            title="New outbound ticket"
            footer={
                <>
                    <Button type="secondary" onClick={closeComposeModal}>
                        Cancel
                    </Button>
                    <Button type="primary" onClick={handleSubmit} loading={composingLoading}>
                        Send
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-3 w-[500px] max-w-full">
                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-xs">From</label>
                    <Select
                        value={emailConfigId || undefined}
                        options={emailConfigOptions}
                        onChange={(value) => value && setEmailConfigId(value)}
                        placeholder={emailConfigsLoading ? 'Loading...' : 'Select sender address...'}
                        loading={emailConfigsLoading}
                        fullWidth
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-xs">To</label>
                    <Input
                        type="email"
                        value={recipientEmail}
                        onChange={setRecipientEmail}
                        placeholder="customer@example.com"
                        fullWidth
                        disabledReason={
                            recipientDistinctId && recipientEmail ? 'Email is linked to the selected person' : undefined
                        }
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-xs">Subject</label>
                    <Input
                        value={emailSubject}
                        onChange={setEmailSubject}
                        placeholder="Email subject (optional)"
                        fullWidth
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="font-semibold text-xs">Message</label>
                    <SupportEditor
                        placeholder="Type your message..."
                        onCreate={(editor) => {
                            editorRef.current = editor
                        }}
                        onPressCmdEnter={handleSubmit}
                        minRows={5}
                    />
                </div>
            </div>
        </Modal>
    )
}
