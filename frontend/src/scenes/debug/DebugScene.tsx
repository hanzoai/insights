import { useActions, useValues } from 'kea'

import { IconDatabaseBolt } from '@hanzo/icons'

import { FEATURE_FLAGS } from 'lib/constants'
import { Button } from 'lib/elements/Button'
import { Label } from 'lib/elements/Label/Label'
import { Select } from 'lib/elements/Select'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { DebugSceneQuery } from 'scenes/debug/DebugSceneQuery'
import { SceneExport } from 'scenes/sceneTypes'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { stringifiedExamples } from '~/queries/examples'

import { debugSceneLogic } from './debugSceneLogic'

export function DebugScene(): JSX.Element {
    const { query1, query2 } = useValues(debugSceneLogic)
    const { setQuery1, setQuery2 } = useActions(debugSceneLogic)
    const { featureFlags } = useValues(featureFlagLogic)

    return (
        <SceneContent className="QueryScene">
            <SceneTitleSection
                name="Debug"
                resourceType={{ type: 'debug', forceIcon: <IconDatabaseBolt /> }}
                actions={
                    <>
                        <Button
                            size="small"
                            active={!!query2}
                            onClick={() => (query2 ? setQuery2('') : setQuery2(query1))}
                        >
                            Split
                        </Button>
                        <Button
                            size="small"
                            active={query1 === stringifiedExamples.InsightsQLRaw}
                            onClick={() => setQuery1(stringifiedExamples.InsightsQLRaw)}
                        >
                            SQL Debug
                        </Button>
                        {featureFlags[FEATURE_FLAGS.HOG] ? (
                            <Button
                                size="small"
                                active={query1 === stringifiedExamples.Hoggonacci}
                                onClick={() => setQuery1(stringifiedExamples.Hoggonacci)}
                            >
                                Script
                            </Button>
                        ) : null}
                        <Button
                            size="small"
                            active={query1 === stringifiedExamples.InsightsQLTable}
                            onClick={() => setQuery1(stringifiedExamples.InsightsQLTable)}
                        >
                            SQL Table
                        </Button>
                        <Button
                            size="small"
                            active={query1 === stringifiedExamples.Events}
                            onClick={() => setQuery1(stringifiedExamples.Events)}
                        >
                            Any Query
                        </Button>
                        <Label>
                            <Select
                                size="small"
                                placeholder="More sample queries"
                                options={Object.entries(stringifiedExamples)
                                    .filter(([k]) => k !== 'InsightsQLTable' && k !== 'InsightsQLRaw')
                                    .map(([k, v]) => {
                                        return { label: k, value: v }
                                    })}
                                onChange={(v) => {
                                    if (v) {
                                        setQuery1(v)
                                    }
                                }}
                            />
                        </Label>
                    </>
                }
            />

            <div className="flex gap-2">
                <div className="flex-1 w-1/2">
                    <DebugSceneQuery query={query1} setQuery={setQuery1} queryKey="new-insightsql-debug-1" />
                </div>
                {query2 ? (
                    <div className="flex-1 w-1/2">
                        <DebugSceneQuery query={query2} setQuery={setQuery2} queryKey="new-insightsql-debug-2" />
                    </div>
                ) : null}
            </div>
        </SceneContent>
    )
}

export const scene: SceneExport = {
    component: DebugScene,
    logic: debugSceneLogic,
}
