import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { IconGear } from '@hanzo/icons'
import { Button, Collapse, Input, Switch, Tag, Tooltip } from '@hanzo/elements'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { FEATURE_FLAGS } from 'lib/constants'
import { Field } from 'lib/elements/Field'
import { Slider } from 'lib/elements/Slider'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'

import { ProductTourAppearance } from '~/types'

import { AutoShowModal } from '../components/AutoShowModal'
import { BoxShadowSelector, ColorPickerField, FontSelector } from '../components/CustomizationFields'
import { DEFAULT_APPEARANCE } from '../constants'
import { productTourLogic } from '../productTourLogic'
import { isBannerAnnouncement } from '../productToursLogic'
import { TranslationsPanel } from './TranslationsPanel'

const DEFAULT_BANNER_APPEARANCE: ProductTourAppearance = {
    backgroundColor: '#ffffff',
    textColor: '#1d1f27',
    borderColor: '#e5e7eb',
    fontFamily: 'system-ui',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
}

export interface TourSettingsPanelProps {
    tourId: string
}

export function TourSettingsPanel({ tourId }: TourSettingsPanelProps): JSX.Element {
    const { productTour, productTourForm, entityKeyword, selectedLanguage } = useValues(
        productTourLogic({ id: tourId })
    )
    const { setProductTourFormValue } = useActions(productTourLogic({ id: tourId }))
    const { featureFlags } = useValues(featureFlagLogic)

    const translationsEnabled = featureFlags[FEATURE_FLAGS.PRODUCT_TOURS_LOCALIZATION]

    const isBanner = productTour ? isBannerAnnouncement(productTour) : false
    const conditions = productTourForm.content?.conditions || {}
    const appearance = productTourForm.content?.appearance
    const defaultAppearance = isBanner ? DEFAULT_BANNER_APPEARANCE : DEFAULT_APPEARANCE
    const currentAppearance = { ...defaultAppearance, ...appearance }

    const [showAutoShowModal, setShowAutoShowModal] = useState(false)
    const [showManualTrigger, setShowManualTrigger] = useState(!!conditions.selector)

    const updateAppearance = (updates: Partial<ProductTourAppearance>): void => {
        setProductTourFormValue('content', {
            ...productTourForm.content,
            appearance: { ...currentAppearance, ...updates },
        })
    }

    const updateConditions = (newConditions: { selector?: string }): void => {
        setProductTourFormValue('content', {
            ...productTourForm.content,
            conditions: newConditions,
        })
    }

    const displayContent = (
        <div className="space-y-4">
            <div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-show this {entityKeyword}</span>
                    <Switch
                        checked={productTourForm.auto_launch}
                        onChange={(checked) => setProductTourFormValue('auto_launch', checked)}
                    />
                </div>
                {productTourForm.auto_launch && (
                    <>
                        <p className="text-xs text-secondary mt-2 mb-2">
                            Show automatically when some conditions are met
                        </p>
                        <Button
                            type="secondary"
                            icon={<IconGear />}
                            onClick={() => setShowAutoShowModal(true)}
                            fullWidth
                        >
                            Configure targeting
                        </Button>
                    </>
                )}
            </div>

            <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Manual trigger</span>
                    <Switch
                        checked={showManualTrigger}
                        onChange={(checked) => {
                            setShowManualTrigger(checked)
                            if (!checked) {
                                updateConditions({ ...conditions, selector: undefined })
                            }
                        }}
                    />
                </div>
                {showManualTrigger && (
                    <>
                        <p className="text-xs text-secondary mt-2 mb-2">
                            Show when clicking an element matching this selector
                        </p>
                        <Input
                            size="small"
                            className="font-mono"
                            value={conditions.selector || ''}
                            onChange={(value) => updateConditions({ ...conditions, selector: value })}
                            onBlur={() => {
                                if (!conditions.selector) {
                                    setShowManualTrigger(false)
                                }
                            }}
                            placeholder="#help-button"
                        />
                    </>
                )}
            </div>

            <div className="pt-4 border-t">
                <span className="text-sm font-medium">API trigger</span>
                <p className="text-xs text-secondary mt-1 mb-2">Trigger programmatically from your code</p>
                <CodeSnippet language={Language.JavaScript} compact>
                    {`insights.productTours.showProductTour('${tourId}')`}
                </CodeSnippet>
            </div>
        </div>
    )

    const styleContent = (
        <div className="space-y-4">
            <div>
                <div className="grid grid-cols-2 gap-3">
                    <ColorPickerField
                        label="Background"
                        value={currentAppearance.backgroundColor}
                        onChange={(backgroundColor) => updateAppearance({ backgroundColor })}
                    />
                    <ColorPickerField
                        label="Text"
                        value={currentAppearance.textColor}
                        onChange={(textColor) => updateAppearance({ textColor })}
                    />
                    {!isBanner && (
                        <ColorPickerField
                            label="Button"
                            value={currentAppearance.buttonColor}
                            onChange={(buttonColor) => updateAppearance({ buttonColor })}
                        />
                    )}
                    <ColorPickerField
                        label="Border"
                        value={currentAppearance.borderColor}
                        onChange={(borderColor) => updateAppearance({ borderColor })}
                        showNone={true}
                    />
                </div>
            </div>

            {!isBanner && (
                <>
                    <Field.Pure label="Border radius">
                        <div className="flex items-center gap-3">
                            <Slider
                                className="flex-1"
                                value={currentAppearance.borderRadius}
                                onChange={(borderRadius) => updateAppearance({ borderRadius })}
                                min={0}
                                max={24}
                                step={1}
                            />
                            <span className="text-xs text-secondary w-10 text-right">
                                {currentAppearance.borderRadius}px
                            </span>
                        </div>
                    </Field.Pure>

                    <Field.Pure label="Button radius">
                        <div className="flex items-center gap-3">
                            <Slider
                                className="flex-1"
                                value={currentAppearance.buttonBorderRadius}
                                onChange={(buttonBorderRadius) => updateAppearance({ buttonBorderRadius })}
                                min={0}
                                max={24}
                                step={1}
                            />
                            <span className="text-xs text-secondary w-10 text-right">
                                {currentAppearance.buttonBorderRadius}px
                            </span>
                        </div>
                    </Field.Pure>
                </>
            )}

            <FontSelector
                value={currentAppearance.fontFamily}
                onChange={(fontFamily) => updateAppearance({ fontFamily })}
            />

            <BoxShadowSelector
                value={currentAppearance.boxShadow}
                onChange={(boxShadow) => updateAppearance({ boxShadow })}
            />

            {!isBanner && (
                <>
                    <div className="flex items-center justify-between">
                        <span className="text-sm">Dark overlay</span>
                        <Switch
                            checked={currentAppearance.showOverlay ?? true}
                            onChange={(showOverlay) => updateAppearance({ showOverlay })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm">Dismiss on outside clicks</span>
                        <Switch
                            checked={currentAppearance.dismissOnClickOutside ?? true}
                            onChange={(dismissOnClickOutside) => updateAppearance({ dismissOnClickOutside })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Tooltip title="Branding only appears on the first step">
                            <span className="text-sm border-b border-dashed border-current">Remove branding</span>
                        </Tooltip>
                        <Switch
                            checked={!!currentAppearance.whiteLabel}
                            onChange={(whiteLabel) => updateAppearance({ whiteLabel })}
                        />
                    </div>
                </>
            )}
        </div>
    )

    return (
        <>
            <div className="border rounded overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-surface-primary border-b font-semibold">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">Tour settings</span>
                </div>
                <div className="flex-1 overflow-y-auto [&_.Collapse]:border-0 [&_.Collapse]:rounded-none">
                    <Collapse
                        defaultActiveKey="display"
                        panels={[
                            {
                                key: 'display',
                                header: 'Display conditions',
                                content: displayContent,
                            },
                            {
                                key: 'style',
                                header: 'Theme',
                                content: styleContent,
                            },
                            ...(translationsEnabled
                                ? [
                                      {
                                          key: 'translations',
                                          header: (
                                              <div className="flex gap-2 items-center">
                                                  Translations
                                                  {selectedLanguage && <Tag>{selectedLanguage}</Tag>}
                                              </div>
                                          ),
                                          content: <TranslationsPanel tourId={tourId} />,
                                      },
                                  ]
                                : []),
                        ]}
                    />
                </div>
            </div>

            <AutoShowModal tourId={tourId} isOpen={showAutoShowModal} onClose={() => setShowAutoShowModal(false)} />
        </>
    )
}
