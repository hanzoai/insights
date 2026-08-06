import { useActions, useValues } from 'kea'
import { useEffect } from 'react'

import { Button, Switch } from '@hanzo/elements'

import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { SupportTicketTargetArea, supportLogic } from 'lib/components/Support/supportLogic'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { preflightLogic } from 'lib/logic/preflightLogic'
import { sceneLogic } from 'scenes/sceneLogic'
import { sceneConfigurations } from 'scenes/scenes'
import { urls } from 'scenes/urls'

import { featurePreviewsLogic } from '~/layout/FeaturePreviews/featurePreviewsLogic'
import { FeaturePreviewGateConfig } from '~/types'

import { SceneContent } from './SceneContent'
import { SceneTitleSection } from './SceneTitleSection'

export function FeaturePreviewSceneGate({
    config,
    children,
}: {
    config: FeaturePreviewGateConfig
    children: React.ReactNode
}): JSX.Element {
    const { featureFlags } = useValues(featureFlagLogic)
    const isEnabled = featureFlags[config.flag as keyof typeof featureFlags]
    if (isEnabled) {
        return <>{children}</>
    }
    return <FeaturePreviewGateContent config={config} />
}

function FeaturePreviewGateContent({ config }: { config: FeaturePreviewGateConfig }): JSX.Element {
    const { earlyAccessFeatures } = useValues(featurePreviewsLogic)
    const { loadEarlyAccessFeatures, updateEarlyAccessFeatureEnrollment } = useActions(featurePreviewsLogic)
    const { activeSceneId } = useValues(sceneLogic)
    const { preflight } = useValues(preflightLogic)
    const { openSupportForm } = useActions(supportLogic)

    useEffect(() => {
        loadEarlyAccessFeatures()
    }, [loadEarlyAccessFeatures])

    const feature = earlyAccessFeatures.find((f) => f.flagKey === config.flag)
    const sceneConfig = activeSceneId ? sceneConfigurations[activeSceneId] : undefined

    return (
        <SceneContent>
            {sceneConfig?.name && (
                <SceneTitleSection
                    name={sceneConfig.name}
                    description={sceneConfig.description}
                    resourceType={{ type: sceneConfig.iconType || 'default' }}
                />
            )}
            <ProductIntroduction
                productName={config.title}
                thingName="feature"
                titleOverride={config.title}
                description={config.description}
                isEmpty
                actionElementOverride={
                    feature ? (
                        <label className="flex items-center gap-2 cursor-pointer" htmlFor="feature-preview-gate-switch">
                            <Switch
                                checked={feature.enabled}
                                onChange={(checked) =>
                                    updateEarlyAccessFeatureEnrollment(feature.flagKey, checked, feature.stage)
                                }
                                id="feature-preview-gate-switch"
                            />
                            <span className="font-semibold">Enable feature preview</span>
                        </label>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button type="primary" to={urls.featurePreview(config.flag)}>
                                Open feature previews
                            </Button>
                            {config.supportTargetArea && preflight?.cloud && (
                                <Button
                                    type="secondary"
                                    onClick={() =>
                                        openSupportForm({
                                            kind: 'support',
                                            target_area: config.supportTargetArea as SupportTicketTargetArea,
                                            message: `I'd like to request access to ${config.title}.`,
                                        })
                                    }
                                >
                                    Request access
                                </Button>
                            )}
                        </div>
                    )
                }
                docsURL={config.docsURL}
            />
        </SceneContent>
    )
}
