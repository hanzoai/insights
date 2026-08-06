import { useActions, useValues } from 'kea'

import { IconCursorClick } from '@hanzo/icons'
import { Label, Select } from '@hanzo/elements'

import { Button } from 'lib/elements/Button'
import { TextArea } from 'lib/elements/TextArea/TextArea'

import {
    ElementSelectorButtonTypes,
    ElementSelectorType,
    experimentsTabLogic,
} from '~/toolbar/experiments/experimentsTabLogic'
import {
    htmlSanitizationWouldStrip,
    setSanitizedHTML,
    setSanitizedStyle,
    styleSanitizationWouldStrip,
} from '~/toolbar/experiments/sanitize'
import { WebExperimentTransform } from '~/toolbar/types'

interface WebExperimentTransformFieldProps {
    variant: string
    transformIndex: number
    transform: WebExperimentTransform
}

export function WebExperimentTransformField({
    variant,
    transformIndex,
    transform,
}: WebExperimentTransformFieldProps): JSX.Element {
    const { experimentForm, inspectingElement, selectedVariant, selectedElementType } = useValues(experimentsTabLogic)
    const { setExperimentFormValue, selectVariant, selectElementType, inspectForElementWithIndex } =
        useActions(experimentsTabLogic)

    return (
        <>
            <div className="inline-flex deprecated-space-x-2">
                <Button
                    icon={<IconCursorClick />}
                    size="small"
                    type={inspectingElement === transformIndex && selectedVariant === variant ? 'primary' : 'secondary'}
                    onClick={() => {
                        selectVariant(variant)
                        inspectForElementWithIndex(
                            variant,
                            selectedElementType as ElementSelectorType,
                            inspectingElement === transformIndex ? null : transformIndex
                        )
                    }}
                >
                    {inspectingElement === transformIndex && selectedVariant === variant
                        ? 'Selecting…'
                        : 'Select element'}
                </Button>
                <Select
                    placeholder="Select element type"
                    value={selectedElementType}
                    options={Object.entries(ElementSelectorButtonTypes).map(([key, value]) => ({
                        label: value,
                        value: key,
                    }))}
                    onChange={(value) => {
                        selectElementType(value as ElementSelectorType)
                    }}
                />
            </div>
            {transform.selector && (
                <div>
                    <div className="mt-4">
                        <Label>Inner HTML</Label>
                        <TextArea
                            onChange={(value) => {
                                // Update state
                                const updatedVariants = {
                                    ...experimentForm.variants,
                                    [variant]: {
                                        ...experimentForm.variants[variant],
                                        transforms: experimentForm.variants[variant].transforms.map((t, i) =>
                                            i === transformIndex ? { ...t, html: value } : t
                                        ),
                                    },
                                }
                                setExperimentFormValue('variants', updatedVariants)

                                // Update DOM
                                const element = transform.selector
                                    ? (document.querySelector(transform.selector) as HTMLElement)
                                    : null
                                if (element) {
                                    setSanitizedHTML(element, value)
                                }
                            }}
                            value={transform.html}
                            maxRows={8}
                        />
                        {htmlSanitizationWouldStrip(transform.html) && (
                            <div className="text-xs text-secondary mt-1">
                                Some markup will be removed when applied (scripts, event handlers, inline styles).
                            </div>
                        )}
                    </div>
                    <div className="mt-4">
                        <Label>CSS</Label>
                        <TextArea
                            onChange={(value) => {
                                if (experimentForm.variants) {
                                    // Create new variants object with updated CSS
                                    const updatedVariants = {
                                        ...experimentForm.variants,
                                        [variant]: {
                                            ...experimentForm.variants[variant],
                                            transforms: experimentForm.variants[variant].transforms.map((t, i) =>
                                                i === transformIndex ? { ...t, css: value } : t
                                            ),
                                        },
                                    }
                                    setExperimentFormValue('variants', updatedVariants)

                                    // Update DOM
                                    const element = transform.selector
                                        ? (document.querySelector(transform.selector) as HTMLElement)
                                        : null
                                    if (element) {
                                        setSanitizedStyle(element, value)
                                    }
                                }
                            }}
                            value={transform.css || ''}
                            maxRows={8}
                        />
                        {styleSanitizationWouldStrip(transform.css) && (
                            <div className="text-xs text-secondary mt-1">
                                Some declarations will be removed when applied (url(), image-set, paint).
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
