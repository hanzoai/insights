import { router } from 'kea-router'

import { Dialog } from 'lib/elements/Dialog'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input'
import { urls } from 'scenes/urls'

import { ApiConfig } from '~/lib/api'
import { toast } from '~/lib/elements/Toast/Toast'

import { llmPromptsNameDuplicateCreate } from '../generated/api'

export const PROMPT_NAME_MAX_LENGTH = 255

export function validatePromptName(name: string | undefined): string | undefined {
    if (!name?.trim()) {
        return 'Name is required'
    }
    if (name.toLowerCase() === 'new') {
        return "'new' is a reserved name and cannot be used"
    }
    if (name.length > PROMPT_NAME_MAX_LENGTH) {
        return `Name must be ${PROMPT_NAME_MAX_LENGTH} characters or fewer`
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return 'Only letters, numbers, hyphens (-), and underscores (_) are allowed'
    }
    return undefined
}

export const PROMPT_LABEL_MAX_LENGTH = 128
// Mirrors validate_prompt_label_name_value in insights/api/llm_prompt_serializers.py; the backend stays authoritative.
const PROMPT_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/

export function validatePromptLabelName(name: string): string | undefined {
    const trimmed = name.trim()
    if (!trimmed) {
        return 'Label name is required'
    }
    if (trimmed.toLowerCase() === 'latest') {
        return "'latest' is reserved and cannot be used as a label"
    }
    if (/^[0-9]+$/.test(trimmed)) {
        return 'Label names cannot be numbers only, to avoid confusion with version numbers'
    }
    if (trimmed.length > PROMPT_LABEL_MAX_LENGTH) {
        return `Label must be ${PROMPT_LABEL_MAX_LENGTH} characters or fewer`
    }
    if (!PROMPT_LABEL_PATTERN.test(trimmed)) {
        return 'Use lowercase letters, numbers, dots (.), hyphens (-) and underscores (_), starting and ending with a letter or number'
    }
    return undefined
}

export function openCreateLabelDialog({
    labelName,
    version,
    onCreate,
}: {
    labelName: string
    version: number
    onCreate: () => Promise<void>
}): void {
    Dialog.open({
        title: 'Create label?',
        description: `${labelName} → v${version}. Anything fetching this prompt by this label starts resolving v${version} within seconds.`,
        shouldAwaitSubmit: true,
        primaryButton: {
            children: 'Create',
            type: 'primary',
            onClick: onCreate,
        },
        secondaryButton: {
            children: 'Cancel',
            type: 'secondary',
        },
    })
}

export function openMoveLabelDialog({
    labelName,
    fromVersion,
    toVersion,
    onMove,
}: {
    labelName: string
    fromVersion: number
    toVersion: number
    onMove: () => Promise<void>
}): void {
    Dialog.open({
        title: 'Move label?',
        description: `${labelName}: v${fromVersion} → v${toVersion}. Anything fetching this prompt by this label picks up the change within seconds.`,
        shouldAwaitSubmit: true,
        primaryButton: {
            children: 'Move',
            type: 'primary',
            onClick: onMove,
        },
        secondaryButton: {
            children: 'Cancel',
            type: 'secondary',
        },
    })
}

export function openRemoveLabelDialog({
    labelName,
    version,
    onRemove,
}: {
    labelName: string
    version: number
    onRemove: () => Promise<void>
}): void {
    Dialog.open({
        title: 'Remove label?',
        description: `${labelName} currently points at v${version}. Any code fetching this prompt by this label will stop resolving it.`,
        shouldAwaitSubmit: true,
        primaryButton: {
            children: 'Remove',
            type: 'primary',
            status: 'danger',
            onClick: onRemove,
        },
        secondaryButton: {
            children: 'Cancel',
            type: 'secondary',
        },
    })
}

export function getApiErrorDetail(error: unknown): string | undefined {
    if (error !== null && typeof error === 'object' && 'detail' in error && typeof error.detail === 'string') {
        return error.detail
    }
    return undefined
}

export function openDiscardChangesDialog(onDiscard: () => void): void {
    Dialog.open({
        title: 'Discard changes?',
        description: 'Your unsaved edits will be lost.',
        primaryButton: {
            children: 'Discard',
            type: 'primary',
            status: 'danger',
            onClick: onDiscard,
        },
        secondaryButton: {
            children: 'Keep editing',
            type: 'secondary',
        },
    })
}

export function openArchivePromptDialog(onArchive: () => void): void {
    Dialog.open({
        title: 'Archive prompt?',
        description:
            'This archives every active version of the prompt. Any code fetching it by name will stop resolving it.',
        primaryButton: {
            children: 'Archive',
            type: 'primary',
            status: 'danger',
            onClick: onArchive,
        },
        secondaryButton: {
            children: 'Cancel',
            type: 'secondary',
        },
    })
}

export async function requestPromptDuplicate(sourceName: string, newName: string): Promise<void> {
    try {
        await llmPromptsNameDuplicateCreate(String(ApiConfig.getCurrentTeamId()), sourceName, { new_name: newName })
        toast.success(`Prompt duplicated as "${newName}".`)
        router.actions.push(urls.aiObservabilityPrompt(newName))
    } catch (error) {
        toast.error(getApiErrorDetail(error) || 'Failed to duplicate prompt')
    }
}

export function openDuplicatePromptDialog(sourceName: string, onDuplicate: (newName: string) => Promise<void>): void {
    Dialog.openForm({
        title: 'Duplicate prompt',
        initialValues: {
            newName: `${sourceName}-copy`,
        },
        content: (
            <Field name="newName" label="New prompt name">
                <Input
                    data-attr="llma-prompt-duplicate-name"
                    placeholder="my-prompt-copy"
                    maxLength={PROMPT_NAME_MAX_LENGTH}
                    autoFocus
                />
            </Field>
        ),
        errors: {
            newName: (name: string) => validatePromptName(name),
        },
        shouldAwaitSubmit: true,
        onSubmit: async ({ newName }) => {
            await onDuplicate(newName)
        },
    })
}
