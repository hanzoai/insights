import { useActions, useValues } from 'kea'

import { IconGear } from '@hanzo/icons'
import { Banner, Button } from '@hanzo/elements'

import { Scene, SceneExport } from 'scenes/sceneTypes'
import { sceneConfigurations } from 'scenes/scenes'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { ProductKey } from '~/queries/schema/schema-general'

import { LogsViewer } from 'products/logs/frontend/components/LogsViewer'
import { LogsSetupPrompt } from 'products/logs/frontend/components/SetupPrompt/SetupPrompt'
import { logsIngestionLogic } from 'products/logs/frontend/components/SetupPrompt/logsIngestionLogic'

import { useOpenLogsSettingsPanel } from './hooks/useOpenLogsSettingsPanel'
import { logsSceneLogic } from './logsSceneLogic'

export const scene: SceneExport = {
    component: LogsScene,
    logic: logsSceneLogic,
    productKey: ProductKey.LOGS,
}

export function LogsScene(): JSX.Element {
    return (
        <SceneContent>
            <LogsSceneContent />
        </SceneContent>
    )
}

const LogsSceneContent = (): JSX.Element => {
    const { tabId } = useValues(logsSceneLogic)
    const { hasLogs, teamHasLogsCheckFailed } = useValues(logsIngestionLogic)
    const { loadTeamHasLogs } = useActions(logsIngestionLogic)
    const openLogsSettings = useOpenLogsSettingsPanel()

    return (
        <>
            <SceneTitleSection
                name={sceneConfigurations[Scene.Logs].name}
                description={sceneConfigurations[Scene.Logs].description}
                resourceType={{
                    type: sceneConfigurations[Scene.Logs].iconType || 'default_icon_type',
                }}
                actions={
                    <>
                        {hasLogs && (
                            <Button size="small" type="secondary" id="logs-feedback-button">
                                Send feedback
                            </Button>
                        )}
                        <Button size="small" type="secondary" icon={<IconGear />} onClick={openLogsSettings}>
                            Settings
                        </Button>
                    </>
                }
            />
            {/*
             * A failed check is a server fault, not a verdict about the user's setup, so it must not
             * be dressed up as onboarding advice. The "you may not have configured logging" reading
             * belongs exclusively to the case where the check SUCCEEDS and reports no logs — which
             * LogsSetupPrompt already renders. Error and unconfigured are different facts.
             * Not dismissible: a dismissed error banner would hide a live outage forever.
             */}
            {teamHasLogsCheckFailed && (
                <Banner
                    type="error"
                    action={{
                        children: 'Retry',
                        onClick: () => loadTeamHasLogs(),
                    }}
                >
                    Couldn't load logs — the logs query failed on the server. This says nothing about whether logging is
                    configured for this project; we couldn't reach the logs backend to find out.
                </Banner>
            )}
            <LogsSetupPrompt>
                <div className="flex flex-col gap-2 py-2 h-[calc(100vh_-_var(--breadcrumbs-height-compact,_0px)_-_var(--scene-title-section-height,_0px)_-_5px_+_10rem)]">
                    <LogsViewer id={tabId} />
                </div>
            </LogsSetupPrompt>
        </>
    )
}
