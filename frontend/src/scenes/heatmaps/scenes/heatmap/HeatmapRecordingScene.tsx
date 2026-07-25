import { HeatmapRecording } from 'scenes/heatmaps/components/HeatmapRecording'
import { heatmapRecordingLogic } from 'scenes/heatmaps/scenes/heatmap/heatmapRecordingLogic'
import { SceneExport } from 'scenes/sceneTypes'

export const scene: SceneExport = {
    component: HeatmapRecordingScene,
    logic: heatmapRecordingLogic,
}

export function HeatmapRecordingScene(): JSX.Element {
    return (
        <div>
            <HeatmapRecording />
        </div>
    )
}
