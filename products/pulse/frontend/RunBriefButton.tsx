import { useActions, useValues } from 'kea'

import { Button } from 'lib/elements/Button'

import { BRIEF_ALREADY_GENERATING_MESSAGE, pulseLogic } from './pulseLogic'

export function RunBriefButton(): JSX.Element {
    const { isGeneratingForSelectedConfig, generatedBriefLoading, selectedConfigId, dataProcessingAccepted } =
        useValues(pulseLogic)
    const { generateBrief } = useActions(pulseLogic)

    const disabledReason = !dataProcessingAccepted
        ? 'Approve AI data processing first'
        : isGeneratingForSelectedConfig && !generatedBriefLoading
          ? BRIEF_ALREADY_GENERATING_MESSAGE
          : undefined

    return (
        <Button
            type="primary"
            loading={generatedBriefLoading}
            disabledReason={disabledReason}
            onClick={() => generateBrief({ configId: selectedConfigId })}
        >
            Run brief now
        </Button>
    )
}
