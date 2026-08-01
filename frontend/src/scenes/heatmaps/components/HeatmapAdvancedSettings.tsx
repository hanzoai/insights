import { useActions, useValues } from 'kea'

import { Collapse, Input, Label, Switch } from '@hanzo/elements'

import { heatmapLogic } from 'scenes/heatmaps/scenes/heatmap/heatmapLogic'

export interface HeatmapAdvancedSettingsProps {
    dataUrlPlaceholderFallback: string
    dataUrlHelp: React.ReactNode
    consentHelp: React.ReactNode
    showDataUrl?: boolean
    showConsent?: boolean
    header?: string
}

export function HeatmapAdvancedSettings({
    dataUrlPlaceholderFallback,
    dataUrlHelp,
    consentHelp,
    showDataUrl = true,
    showConsent = true,
    header = 'Advanced settings',
}: HeatmapAdvancedSettingsProps): JSX.Element {
    const { dataUrl, displayUrl, type, blockConsentModals } = useValues(heatmapLogic)
    const { setDataUrl, setDataUrlUserTouched, setBlockConsentModals } = useActions(heatmapLogic)

    return (
        <Collapse
            panels={[
                {
                    key: 'advanced',
                    header,
                    content: (
                        <div className="flex flex-col gap-4">
                            {showDataUrl ? (
                                <div>
                                    <Label>Heatmap data URL</Label>
                                    <Input
                                        size="small"
                                        placeholder={
                                            displayUrl ? `Same as page URL: ${displayUrl}` : dataUrlPlaceholderFallback
                                        }
                                        value={dataUrl ?? ''}
                                        onChange={(value) => {
                                            setDataUrlUserTouched(true)
                                            setDataUrl(value || null)
                                        }}
                                        fullWidth={true}
                                    />
                                    <div className="text-xs text-muted mt-1">{dataUrlHelp}</div>
                                </div>
                            ) : null}
                            {showConsent ? (
                                <div>
                                    <Switch
                                        checked={blockConsentModals}
                                        onChange={setBlockConsentModals}
                                        label="Dismiss cookie & consent banners"
                                        bordered
                                        disabledReason={
                                            type !== 'screenshot' ? 'Only available for screenshot heatmaps' : undefined
                                        }
                                    />
                                    <div className="text-xs text-muted mt-1">{consentHelp}</div>
                                </div>
                            ) : null}
                        </div>
                    ),
                },
            ]}
        />
    )
}
