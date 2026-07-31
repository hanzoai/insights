import { useActions, useValues } from 'kea'
import { useRef } from 'react'

import { IconUpload } from '@hanzo/icons'

import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { Banner } from 'lib/elements/Banner'
import { FileInput } from 'lib/elements/FileInput'
import { SpinnerOverlay } from 'lib/elements/Spinner/Spinner'
import { SceneExport } from 'scenes/sceneTypes'
import { userLogic } from 'scenes/userLogic'

import { AvailableFeature } from '~/types'

import { SessionRecordingPlayer } from '../player/SessionRecordingPlayer'
import { sessionRecordingFilePlaybackSceneLogic } from './sessionRecordingFilePlaybackSceneLogic'

export const scene: SceneExport = {
    component: SessionRecordingFilePlaybackScene,
    logic: sessionRecordingFilePlaybackSceneLogic,
}

export function SessionRecordingFilePlaybackScene(): JSX.Element {
    const { loadFromFile, resetSessionRecording } = useActions(sessionRecordingFilePlaybackSceneLogic)
    const { sessionRecording, sessionRecordingLoading, playerProps } = useValues(sessionRecordingFilePlaybackSceneLogic)
    const { hasAvailableFeature } = useValues(userLogic)
    const filePlaybackEnabled = hasAvailableFeature(AvailableFeature.RECORDINGS_FILE_EXPORT)

    const dropRef = useRef<HTMLDivElement>(null)

    if (!filePlaybackEnabled) {
        return (
            <PayGateMini
                feature={AvailableFeature.RECORDINGS_FILE_EXPORT}
                className="py-8"
                docsLink="https://hanzo.ai/docs/user-guides/session-recordings"
            />
        )
    }

    return (
        <div>
            {sessionRecordingLoading ? (
                <SpinnerOverlay />
            ) : sessionRecording ? (
                <div className="flex flex-col gap-2 h-screen pb-4">
                    <Banner
                        type="info"
                        action={{
                            onClick: () => resetSessionRecording(),
                            children: 'Load a different recording',
                        }}
                    >
                        You are viewing a recording loaded from a file.
                    </Banner>
                    <SessionRecordingPlayer {...playerProps} />
                </div>
            ) : (
                <div
                    ref={dropRef}
                    className="w-full border rounded p-20 text-secondary flex flex-col items-center justify-center"
                >
                    <FileInput
                        accept="application/json"
                        multiple={false}
                        onChange={(files) => loadFromFile(files[0])}
                        alternativeDropTargetRef={dropRef}
                        callToAction={
                            <div className="flex flex-col items-center justify-center deprecated-space-y-2">
                                <span className="flex items-center gap-2 font-semibold">
                                    <IconUpload className="text-2xl" /> Load recording
                                </span>
                                <div>Drag and drop your exported recording here or click to open the file browser.</div>
                            </div>
                        }
                    />
                </div>
            )}
        </div>
    )
}
