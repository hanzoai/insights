import { useActions, useValues } from 'kea'

import { IconTrash } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'
import { Tag } from 'lib/elements/Tag'

import { experimentsTabLogic } from '~/toolbar/experiments/experimentsTabLogic'

interface WebExperimentVariantHeaderProps {
    variant: string
}

export function WebExperimentVariantHeader({ variant }: WebExperimentVariantHeaderProps): JSX.Element {
    const { experimentForm, removeVariantAvailable, selectedVariant } = useValues(experimentsTabLogic)
    const { removeVariant } = useActions(experimentsTabLogic)
    return (
        <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
                <h2>{variant}</h2>
                {selectedVariant === variant && (
                    <Tag className="px-1 py-0.5 font-semibold" size="small" type="success">
                        Currently applied
                    </Tag>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Tag className="px-1 py-0.5 font-semibold" size="small" type="muted">
                    <span>
                        {`Rollout: ${
                            experimentForm.variants && experimentForm.variants[variant]
                                ? (experimentForm.variants[variant].rollout_percentage ?? 0)
                                : 0
                        } %`}
                    </span>
                </Tag>
                {removeVariantAvailable && variant !== 'control' && (
                    <Button
                        icon={<IconTrash />}
                        size="small"
                        className="shrink"
                        noPadding
                        status="danger"
                        onClick={(e) => {
                            e.stopPropagation()
                            removeVariant(variant)
                        }}
                    />
                )}
            </div>
        </div>
    )
}
