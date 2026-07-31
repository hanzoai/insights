import React from 'react'

import { IconAI, IconWarning } from '@hanzo/icons'

import ViewRecordingButton, { RecordingPlayerType } from 'lib/components/ViewRecordingButton/ViewRecordingButton'
import { Button } from 'lib/elements/Button'
import { IconLink } from 'lib/elements/icons'
import { copyToClipboard } from 'lib/utils/copyToClipboard'
import { getCurrentTeamId } from 'lib/utils/getAppContext'
import { createActionFromEvent } from 'scenes/activity/explore/createActionFromEvent'
import { insightUrlForEvent } from 'scenes/insights/utils'
import { ArchiveSurveyButton } from 'scenes/surveys/components/ArchiveSurveyButton'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

import { EventType, SurveyEventName } from '~/types'

export function eventRowActionsContent(event: EventType): JSX.Element {
    const insightUrl = insightUrlForEvent(event)

    return (
        <>
            {getCurrentTeamId() && (
                <Button
                    onClick={() =>
                        void createActionFromEvent(
                            getCurrentTeamId(),
                            event,
                            0,
                            teamLogic.findMounted()?.values.currentTeam?.data_attributes || [],
                            'Unfiled/Actions'
                        )
                    }
                    fullWidth
                    data-attr="events-table-create-action"
                >
                    Create action from event
                </Button>
            )}
            {event.event === SurveyEventName.SENT && event.uuid && event.properties.$survey_id ? (
                <ArchiveSurveyButton surveyId={event.properties.$survey_id} responseUuid={event.uuid} />
            ) : null}
            {event.uuid && event.timestamp && <EventCopyLinkButton event={event} />}
            <ViewRecordingButton
                fullWidth
                openPlayerIn={RecordingPlayerType.NewTab}
                sessionId={event.properties.$session_id}
                recordingStatus={event.properties.$recording_status}
                timestamp={event.timestamp}
                hasRecording={event.properties.$has_recording as boolean | undefined}
                data-attr="events-table-view-recordings"
            />
            {event.event === '$exception' && '$exception_issue_id' in event.properties ? (
                <Button
                    fullWidth
                    sideIcon={<IconWarning />}
                    data-attr="events-table-issue-link"
                    to={urls.errorTrackingIssue(
                        event.properties.$exception_issue_id,
                        event.properties.$exception_fingerprint
                    )}
                >
                    Visit issue
                </Button>
            ) : null}
            {(event.event === '$ai_trace' || event.event === SurveyEventName.SENT) &&
            '$ai_trace_id' in event.properties ? (
                <Button
                    fullWidth
                    sideIcon={<IconAI />}
                    data-attr="events-table-trace-link"
                    to={urls.llmAnalyticsTrace(
                        event.properties.$ai_trace_id,
                        event.event === '$ai_trace' ? { event: event.id, exception_ts: event.timestamp } : {}
                    )}
                >
                    View LLM Trace
                </Button>
            ) : null}
            {insightUrl && (
                <Button to={insightUrl} fullWidth data-attr="events-table-usage" targetBlank>
                    Try out in Insights
                </Button>
            )}
        </>
    )
}

export const EventCopyLinkButton = React.forwardRef<
    HTMLButtonElement,
    { event: Pick<EventType, 'uuid' | 'timestamp'> }
>(function EventCopyLinkButton({ event }, ref) {
    return (
        <Button
            ref={ref}
            fullWidth
            sideIcon={<IconLink />}
            data-attr="events-table-event-link"
            onClick={() =>
                void copyToClipboard(
                    urls.absolute(urls.currentProject(urls.event(String(event.uuid), event.timestamp))),
                    'link to event'
                )
            }
        >
            Copy link to event
        </Button>
    )
})
