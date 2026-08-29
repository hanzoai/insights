import { useActions, useValues } from 'kea'
import { useRef, useState } from 'react'

import { Button, toast } from '@hanzo/elements'
import { IconSparkles } from '@hanzo/icons'

import { Popover } from 'lib/elements/Popover'
import { TextArea } from 'lib/elements/TextArea'

import { captureInboxReportAction } from '../../inboxAnalytics'
import { inboxTaskKickoffLogic } from '../../inboxTaskKickoffLogic'
import { SignalReport } from '../../types'

export function DiscussReportButton({ report, reportUrl }: { report: SignalReport; reportUrl: string }): JSX.Element {
    const { isDiscussing, aiConsentDisabledReason } = useValues(inboxTaskKickoffLogic)
    const { discussReport } = useActions(inboxTaskKickoffLogic)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [question, setQuestion] = useState('')

    const submit = (): void => {
        const trimmed = question.trim()
        // Cmd/Ctrl + Enter submits straight from the textarea, so it never sees the button's
        // `loading`/`disabledReason` – each guard has to hold here too, or an impatient second
        // press fires another paid task run for the same report.
        if (!trimmed || isDiscussing) {
            return
        }
        if (aiConsentDisabledReason) {
            toast.error(aiConsentDisabledReason)
            return
        }
        captureInboxReportAction({ report, actionType: 'discuss', surface: 'detail_pane' })
        // The popover stays open on its spinner until the run is created and we navigate to it, so
        // the request is visibly in flight and a failure leaves the draft question to retry with.
        discussReport(report, reportUrl, trimmed)
    }

    return (
        <Popover
            visible={isOpen}
            onClickOutside={(event) => {
                if (event.target instanceof Node && buttonRef.current?.contains(event.target)) {
                    return
                }
                setIsOpen(false)
            }}
            placement="bottom-end"
            overlay={
                <div className="flex flex-col gap-2 p-2 w-[22rem]">
                    <TextArea
                        value={question}
                        onChange={setQuestion}
                        onPressCmdEnter={submit}
                        placeholder="What would you like to ask about this report?"
                        maxLength={4000}
                        rows={4}
                        autoFocus
                        rightFooter={<span className="text-xs text-tertiary">Cmd/Ctrl + Enter to ask AI</span>}
                    />
                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            size="small"
                            onClick={submit}
                            loading={isDiscussing}
                            disabledReason={
                                aiConsentDisabledReason ?? (question.trim() ? undefined : 'Enter a question first')
                            }
                        >
                            Ask AI
                        </Button>
                    </div>
                </div>
            }
        >
            <Button
                ref={buttonRef}
                type="secondary"
                size="small"
                icon={<IconSparkles />}
                sideIcon={null}
                active={isOpen}
                loading={isDiscussing}
                onClick={() => setIsOpen((open) => !open)}
                tooltip="Ask AI about this report"
            >
                Ask AI
            </Button>
        </Popover>
    )
}
