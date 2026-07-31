import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { IconPlus } from '@hanzo/icons'
import { Label } from '@hanzo/elements'

import { Button } from 'lib/elements/Button'
import { Collapse } from 'lib/elements/Collapse'
import { Input } from 'lib/elements/Input/Input'

import { WebExperimentTransformField } from '~/toolbar/experiments/WebExperimentTransformField'
import { WebExperimentTransformHeader } from '~/toolbar/experiments/WebExperimentTransformHeader'
import { experimentsTabLogic } from '~/toolbar/experiments/experimentsTabLogic'

interface WebExperimentVariantProps {
    variant: string
}

export function WebExperimentVariant({ variant }: WebExperimentVariantProps): JSX.Element {
    const { experimentForm, selectedExperimentId } = useValues(experimentsTabLogic)
    const [localTentativeValue, setLocalTentativeValue] = useState(variant)
    const { addNewTransformation, setExperimentFormValue } = useActions(experimentsTabLogic)
    return (
        <div className="deprecated-space-y-4">
            {selectedExperimentId === 'new' && experimentForm.variants && experimentForm.variants[variant].is_new && (
                <div>
                    <Label>Variant key</Label>
                    <Input
                        key="variant-name-small"
                        className="mb-2"
                        value={localTentativeValue}
                        onChange={(newName) => {
                            setLocalTentativeValue(newName)
                        }}
                        onBlur={(e) => {
                            e.stopPropagation()
                            if (experimentForm.variants && localTentativeValue !== variant) {
                                const webVariant = experimentForm.variants[variant]
                                if (webVariant) {
                                    experimentForm.variants[localTentativeValue] = webVariant
                                    delete experimentForm.variants[variant]
                                    setExperimentFormValue('variants', experimentForm.variants)
                                }
                            }
                        }}
                        placeholder={`Example: "test-1"`}
                    />
                </div>
            )}
            <div className="flex items-center justify-between mb-2">
                <Label>Transformations</Label>
                <Button
                    type="secondary"
                    size="xsmall"
                    icon={<IconPlus />}
                    onClick={(e) => {
                        e.stopPropagation()
                        addNewTransformation(variant)
                    }}
                >
                    Add transformation
                </Button>
            </div>
            {experimentForm?.variants &&
            experimentForm?.variants[variant] &&
            experimentForm?.variants[variant].transforms &&
            experimentForm?.variants[variant].transforms?.length > 0 ? (
                <Collapse
                    size="small"
                    activeKey={experimentForm?.variants[variant].transforms.length === 1 ? 0 : undefined}
                    panels={experimentForm?.variants[variant].transforms.map((transform, transformIndex) => {
                        return {
                            key: transformIndex,
                            header: (
                                <WebExperimentTransformHeader
                                    variant={variant}
                                    transformIndex={transformIndex}
                                    transform={transform}
                                />
                            ),
                            content: (
                                <WebExperimentTransformField
                                    transformIndex={transformIndex}
                                    variant={variant}
                                    transform={transform}
                                />
                            ),
                        }
                    })}
                />
            ) : (
                <span className="my-2"> This experiment variant doesn't modify any elements. </span>
            )}
        </div>
    )
}
