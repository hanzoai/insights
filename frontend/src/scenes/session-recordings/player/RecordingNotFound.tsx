import { useValues } from 'kea'

import { NotFound } from 'lib/components/NotFound'
import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { Link } from 'lib/elements/Link'
import { ReplayCaptureDiagnosticsPanel } from 'scenes/session-recordings/components/ReplayCaptureDiagnosticsPanel'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

export function RecordingNotFound({ sessionRecordingId }: { sessionRecordingId?: string }): JSX.Element {
    const { currentTeam } = useValues(teamLogic)

    return (
        <div className="flex flex-col items-center w-full overflow-y-auto">
            <NotFound
                object="Recording"
                caption={
                    <>
                        The requested recording could not be found. See the diagnosis below for likely reasons, or refer
                        to the{' '}
                        <Link to="https://hanzo.ai/docs/session-replay/troubleshooting#recording-not-found">
                            troubleshooting guide
                        </Link>
                        .
                        {currentTeam?.session_recording_opt_in ? (
                            <Banner type="success" className="mt-4 max-w-xl mx-auto">
                                <div className="flex justify-between items-center">
                                    <div>Session replay is enabled for this project</div>
                                    <Button
                                        data-attr="recording-404-edit-settings"
                                        type="secondary"
                                        size="small"
                                        to={urls.settings('project-replay')}
                                    >
                                        Edit settings
                                    </Button>
                                </div>
                            </Banner>
                        ) : (
                            <Banner type="warning" className="mt-4 max-w-xl mx-auto">
                                <div className="flex justify-between items-center">
                                    <div>Session replay is disabled for this project</div>
                                    <Button
                                        data-attr="recording-404-edit-settings"
                                        type="secondary"
                                        size="small"
                                        to={urls.settings('project-replay')}
                                    >
                                        Edit settings
                                    </Button>
                                </div>
                            </Banner>
                        )}
                    </>
                }
            />
            {sessionRecordingId && (
                <div className="-mt-16 mb-12 w-full max-w-xl px-4">
                    <ReplayCaptureDiagnosticsPanel sessionId={sessionRecordingId} />
                </div>
            )}
        </div>
    )
}
