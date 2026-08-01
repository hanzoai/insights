import { useActions, useValues } from 'kea'
import { combineUrl, router } from 'kea-router'
import insights from 'insights-js'
import React from 'react'

import { IconLlmPromptManagement } from '@hanzo/icons'
import { Button, Divider, Dropdown, Input } from '@hanzo/elements'

import { Dialog } from 'lib/elements/Dialog'
import { Field } from 'lib/elements/Field'
import { urls } from 'scenes/urls'

import { llmPlaygroundModelLogic } from './llmPlaygroundModelLogic'
import {
    cleanSourceSearchParams,
    getLinkedSourceLabel,
    llmPlaygroundPromptsLogic,
    type PromptConfig,
} from './llmPlaygroundPromptsLogic'

export function PlaygroundSaveMenu({ prompt }: { prompt: PromptConfig }): JSX.Element | null {
    const { effectiveModelOptions } = useValues(llmPlaygroundModelLogic)
    const { linkedSource, saving } = useValues(llmPlaygroundPromptsLogic)
    const { clearLinkedSource, saveToLinkedPrompt, saveToLinkedEvaluation, saveAsNewPrompt, saveAsNewEvaluation } =
        useActions(llmPlaygroundPromptsLogic)
    const { searchParams } = useValues(router)

    const selectedModel = effectiveModelOptions.find((model) => model.id === prompt.model)

    const { promptName: linkedPromptName, evaluationId: linkedEvaluationId } = linkedSource
    const hasLinkedSource = !!linkedPromptName || !!linkedEvaluationId
    const linkedLabel = getLinkedSourceLabel(linkedSource)

    const modelConfig = selectedModel
        ? {
              model: prompt.model,
              provider: selectedModel.provider?.toLowerCase() ?? '',
              provider_key_id: prompt.selectedProviderKeyId ?? null,
          }
        : null

    const openSaveAsNewPromptDialog = (): void => {
        Dialog.openForm({
            title: 'Save as new prompt',
            initialValues: { name: '' },
            content: (
                <Field name="name" label="Name">
                    <Input placeholder="Enter a name for this prompt" autoFocus />
                </Field>
            ),
            errors: { name: (name) => (!name ? 'A name is required' : undefined) },
            onSubmit: ({ name }) => saveAsNewPrompt(prompt.id, name),
        })
    }

    const openSaveAsNewEvaluationDialog = (): void => {
        Dialog.openForm({
            title: 'Save as new evaluation',
            initialValues: { name: '' },
            content: (
                <Field name="name" label="Name">
                    <Input placeholder="Enter a name for this evaluation" autoFocus />
                </Field>
            ),
            errors: { name: (name) => (!name ? 'A name is required' : undefined) },
            onSubmit: ({ name }) => saveAsNewEvaluation(prompt.id, name, modelConfig),
        })
    }

    const confirmSaveToLinkedSource = (): void => {
        if (!linkedLabel) {
            return
        }
        const isPrompt = linkedSource.type === 'prompt'
        Dialog.open({
            title: `Save to ${linkedLabel}?`,
            description: isPrompt
                ? 'This will publish a new version of the prompt with the system prompt from the playground.'
                : 'This will update the evaluation prompt and model configuration with the current playground state.',
            primaryButton: {
                children: isPrompt ? 'Publish version' : 'Save',
                type: 'primary',
                onClick: () =>
                    isPrompt ? saveToLinkedPrompt(prompt.id) : saveToLinkedEvaluation(prompt.id, modelConfig),
            },
            secondaryButton: { children: 'Cancel', type: 'secondary' },
        })
    }

    const clearLinkedSourceState = (): void => {
        insights.capture('llma playground source unlinked')
        clearLinkedSource()
        router.actions.replace(combineUrl(urls.aiObservabilityPlayground(), cleanSourceSearchParams(searchParams)).url)
    }

    const linkedActions: JSX.Element[] = []
    const saveAsNewActions: JSX.Element[] = []
    const loadActions: JSX.Element[] = []

    const isLinkedSourceEnabled =
        (linkedSource.type === 'prompt' && linkedPromptName) ||
        (linkedSource.type === 'evaluation' && linkedEvaluationId && modelConfig)

    if (linkedLabel && isLinkedSourceEnabled) {
        linkedActions.push(
            <Button
                key="save-linked-source"
                type="tertiary"
                size="small"
                fullWidth
                className="justify-start"
                onClick={confirmSaveToLinkedSource}
            >
                <span className="block w-full whitespace-normal break-all text-left" title={`Save to ${linkedLabel}`}>
                    Save to {linkedLabel}
                </span>
            </Button>
        )
    }

    if (hasLinkedSource) {
        linkedActions.push(
            <Button key="unlink-source" type="tertiary" size="small" fullWidth onClick={clearLinkedSourceState}>
                Unlink from source
            </Button>
        )
    }

    saveAsNewActions.push(
        <Button key="save-new-prompt" type="tertiary" size="small" fullWidth onClick={openSaveAsNewPromptDialog}>
            Save as new prompt
        </Button>
    )
    loadActions.push(
        <Button key="load-prompt" type="tertiary" size="small" fullWidth to={urls.aiObservabilityPrompts()}>
            Load prompt
        </Button>
    )

    if (modelConfig) {
        saveAsNewActions.push(
            <Button
                key="save-new-evaluation"
                type="tertiary"
                size="small"
                fullWidth
                onClick={openSaveAsNewEvaluationDialog}
            >
                Save as new evaluation
            </Button>
        )
        loadActions.push(
            <Button
                key="load-evaluation"
                type="tertiary"
                size="small"
                fullWidth
                to={urls.aiObservabilityEvaluations()}
            >
                Load evaluation
            </Button>
        )
    }

    const menuGroups = [linkedActions, saveAsNewActions, loadActions].filter((group) => group.length > 0)
    if (menuGroups.length === 0) {
        return null
    }

    return (
        <Dropdown
            overlay={
                <div className={`${hasLinkedSource ? 'w-72' : 'w-56'} p-1`}>
                    {menuGroups.map((group, groupIndex) => (
                        <React.Fragment key={`group-${groupIndex}`}>
                            {groupIndex > 0 ? <Divider className="my-1" /> : null}
                            {group}
                        </React.Fragment>
                    ))}
                </div>
            }
            placement="bottom-end"
        >
            <Button
                size="small"
                icon={<IconLlmPromptManagement className="text-warning" />}
                tooltip={
                    hasLinkedSource
                        ? 'Save changes back to the linked item or create a new one'
                        : 'Save this system prompt as a prompt or evaluation'
                }
                noPadding
                loading={saving}
                data-attr="llma-playground-save-system-prompt"
            />
        </Dropdown>
    )
}
