import { Banner, Button } from '@hanzo/elements'

import { sceneConfigurations } from 'scenes/scenes'
import { Scene, SceneExport } from 'scenes/sceneTypes'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'

import { errorTrackingSceneLogic } from './errorTrackingSceneLogic'

export const scene: SceneExport = {
    component: ErrorTrackingScene,
    logic: errorTrackingSceneLogic,
}

// Errors have one home: Sentinel, at sentry.hanzo.ai. Every type:'error' event sent
// to api.hanzo.ai/v1/event is grouped into an issue there, and a new issue is
// announced, so this scene points at it rather than keeping a second list.
export const SENTINEL_ISSUES = 'https://sentry.hanzo.ai/issues'

export function ErrorTrackingScene(): JSX.Element {
    return (
        <SceneContent>
            <SceneTitleSection
                name={sceneConfigurations[Scene.ErrorTracking].name}
                description={null}
                resourceType={{
                    type: sceneConfigurations[Scene.ErrorTracking].iconType || 'default_icon_type',
                }}
                actions={
                    <Button size="small" type="primary" to={SENTINEL_ISSUES} targetBlank>
                        Open Sentinel
                    </Button>
                }
            />
            <Banner type="info">
                <p>
                    Errors live in Sentinel. Every error sent to <code>api.hanzo.ai/v1/event</code> is grouped into an
                    issue there, and each new issue is announced.
                </p>
            </Banner>
        </SceneContent>
    )
}
