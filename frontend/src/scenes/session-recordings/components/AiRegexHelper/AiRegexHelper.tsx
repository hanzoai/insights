/**
 * @fileoverview A component that helps you to generate regex for your settings using AI
 */
import { useActions, useValues } from 'kea'
import insights from '@hanzo/insights'

import { IconAI, IconCopy, IconPlus } from '@hanzo/icons'
import { Banner, Button, Modal, TextArea } from '@hanzo/elements'

import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { maxGlobalLogic } from 'scenes/max/maxGlobalLogic'
import { AIConsentPopoverWrapper } from 'scenes/settings/organization/AIConsentPopoverWrapper'

import { aiRegexHelperLogic } from './aiRegexHelperLogic'

type AiRegexHelperProps = {
    onApply: (regex: string) => void
}

export function AiRegexHelper({ onApply }: AiRegexHelperProps): JSX.Element {
    const { isOpen, input, generatedRegex, error, isLoading } = useValues(aiRegexHelperLogic)
    const { setInput, handleGenerateRegex, onClose, handleCopyToClipboard } = useActions(aiRegexHelperLogic)
    const { dataProcessingAccepted, dataProcessingApprovalDisabledReason } = useValues(maxGlobalLogic)

    const { preflight } = useValues(preflightLogic)
    const aiAvailable = preflight?.openai_available

    const disabledReason = !aiAvailable
        ? 'To use AI features, set environment variable OPENAI_API_KEY for this instance of Insights'
        : !dataProcessingAccepted
          ? dataProcessingApprovalDisabledReason || 'You must accept the data processing agreement to use AI features'
          : isLoading
            ? 'Generating...'
            : !input.length
              ? 'Provide a prompt first'
              : null

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="AI Regex Helper">
                Explain your regex in natural language:
                <TextArea
                    placeholder="I want a regex that covers all urls that include 'insights.hanzo.ai/auth/*'"
                    className="w-full my-2"
                    maxRows={4}
                    minRows={2}
                    value={input}
                    onChange={(value) => setInput(value)}
                />
                <div className="flex flex-col gap-2 mt-2">
                    {generatedRegex && (
                        <div>
                            <h3 className="text-sm font-bold">Your regex is:</h3>
                            <div className="flex flex-row gap-2 justify-between items-center">
                                <Banner type="info" className="w-full">
                                    {generatedRegex}
                                </Banner>
                                <div>
                                    <Button
                                        type="secondary"
                                        onClick={handleCopyToClipboard}
                                        tooltip="Copy to clipboard"
                                        icon={<IconCopy />}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="secondary" onClick={onClose} tooltip="Close">
                            Close
                        </Button>

                        <AIConsentPopoverWrapper>
                            <Button
                                type={generatedRegex ? 'secondary' : 'primary'}
                                onClick={handleGenerateRegex}
                                disabledReason={disabledReason}
                                loading={isLoading}
                            >
                                {generatedRegex ? 'Regenerate' : 'Generate Regex'}
                            </Button>
                        </AIConsentPopoverWrapper>

                        {generatedRegex && (
                            <Button
                                type="primary"
                                onClick={() => {
                                    insights.capture('path_cleaning_regex_ai_applied', {
                                        prompt: input,
                                        regex: generatedRegex,
                                    })
                                    onApply(generatedRegex)
                                    onClose()
                                }}
                                tooltip="Apply"
                                icon={<IconPlus />}
                            >
                                Apply
                            </Button>
                        )}
                    </div>

                    {error && <Banner type="error">{error}</Banner>}
                </div>
            </Modal>
        </>
    )
}

export function AiRegexHelperButton(): JSX.Element {
    const { setIsOpen } = useActions(aiRegexHelperLogic)

    return (
        <Button
            type="tertiary"
            size="small"
            icon={<IconAI />}
            onClick={() => {
                setIsOpen(true)
                insights.capture('ai_regex_helper_open')
            }}
        >
            Help me with Regex
        </Button>
    )
}
