import './SessionRecordingScene.scss'

import { useValues } from 'kea'

import { Banner } from 'lib/elements/Banner'
import { Link } from 'lib/elements/Link'
import { SceneExport } from 'scenes/sceneTypes'
import {
    SessionRecordingDetailLogicProps,
    sessionRecordingDetailLogic,
} from 'scenes/session-recordings/detail/sessionRecordingDetailLogic'
import { RecordingNotFound } from 'scenes/session-recordings/player/RecordingNotFound'
import { SessionRecordingPlayer } from 'scenes/session-recordings/player/SessionRecordingPlayer'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

export const scene: SceneExport<SessionRecordingDetailLogicProps> = {
    logic: sessionRecordingDetailLogic,
    component: SessionRecordingDetail,
    paramsToProps: ({ params: { id } }) => ({
        id,
    }),
}

export function SessionRecordingDetail({ id }: SessionRecordingDetailLogicProps): JSX.Element {
    const { currentTeam } = useValues(teamLogic)

    return (
        <div className="SessionRecordingScene">
            {currentTeam && !currentTeam?.session_recording_opt_in ? (
                <div className="mb-4">
                    <Banner type="info">
                        Session recordings are currently disabled for this project. To use this feature, please go to
                        your <Link to={`${urls.settings('project')}#recordings`}>project settings</Link> and enable it.
                    </Banner>
                </div>
            ) : null}
            <div className="mt-4 flex-1">
                {id ? (
                    <SessionRecordingPlayer sessionRecordingId={id} playerKey={`${id}-detail`} />
                ) : (
                    <RecordingNotFound sessionRecordingId={id} />
                )}
            </div>
        </div>
    )
}
