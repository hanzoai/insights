import { useActions, useValues } from 'kea'

import { IconBolt, IconPlus, IconPlusSmall, IconX } from '@hanzo/icons'

import { FEATURE_FLAGS } from 'lib/constants'
import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input'
import { Switch } from 'lib/elements/Switch'
import { Tag } from 'lib/elements/Tag'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'

import { defaultEvaluationContextsLogic } from './defaultEvaluationContextsLogic'

export function DefaultEvaluationContexts(): JSX.Element | null {
    const { featureFlags } = useValues(featureFlagLogic)
    const { tags, isEnabled, canAddMoreTags, newTagInput, defaultEvaluationContextsLoading, isAdding } =
        useValues(defaultEvaluationContextsLogic)
    const { addTag, removeTag, toggleEnabled, setNewTagInput, setIsAdding } = useActions(defaultEvaluationContextsLogic)

    // Check if feature flag is enabled
    if (!featureFlags[FEATURE_FLAGS.DEFAULT_EVALUATION_ENVIRONMENTS]) {
        return null
    }

    const handleAddTag = (): void => {
        const trimmedTag = newTagInput.trim().toLowerCase()
        if (trimmedTag && !tags.some((t: { name: string }) => t.name === trimmedTag)) {
            addTag(trimmedTag)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter') {
            handleAddTag()
        } else if (e.key === 'Escape') {
            setIsAdding(false)
            setNewTagInput('')
        }
    }

    return (
        <div className="space-y-4">
            <Switch
                data-attr="default-evaluation-contexts-switch"
                onChange={toggleEnabled}
                label="Apply default evaluation contexts to new flags"
                bordered
                checked={isEnabled}
                disabled={defaultEvaluationContextsLoading}
            />

            {isEnabled && (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 items-center">
                        {tags.map((tag: { id: number; name: string }) => (
                            <Tag
                                key={tag.id}
                                type="success"
                                icon={<IconBolt />}
                                closable
                                onClose={() => removeTag(tag.name)}
                            >
                                {tag.name}
                            </Tag>
                        ))}

                        {isAdding ? (
                            <div className="inline-flex items-center gap-1">
                                <Input
                                    size="small"
                                    value={newTagInput}
                                    onChange={setNewTagInput}
                                    onKeyDown={handleKeyDown}
                                    placeholder="e.g., production"
                                    autoFocus
                                    className="w-32"
                                />
                                <Button
                                    size="small"
                                    type="primary"
                                    onClick={handleAddTag}
                                    disabled={!newTagInput.trim()}
                                    icon={<IconPlusSmall />}
                                />
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setIsAdding(false)
                                        setNewTagInput('')
                                    }}
                                    icon={<IconX />}
                                />
                            </div>
                        ) : (
                            canAddMoreTags && (
                                <Button
                                    size="small"
                                    type="secondary"
                                    onClick={() => setIsAdding(true)}
                                    icon={<IconPlus />}
                                >
                                    Add tag
                                </Button>
                            )
                        )}
                    </div>

                    {tags.length === 0 && !isAdding && (
                        <div className="text-sm text-muted italic">
                            No default evaluation tags configured. Add tags to automatically apply them to new flags.
                        </div>
                    )}

                    {tags.length >= 10 && (
                        <div className="text-xs text-warning">Maximum of 10 default evaluation tags allowed.</div>
                    )}
                </div>
            )}
        </div>
    )
}
