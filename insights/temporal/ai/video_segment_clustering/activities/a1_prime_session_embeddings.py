"""
Activity 1 of the video segment clustering workflow:
Identify sessions that need summarization (embedding priming).
"""

import structlog
from temporalio import activity

from insights.schema import PropertyOperator, RecordingPropertyFilter, RecordingsQuery

from insights.clickhouse.query_tagging import Product, tags_context
from insights.models.team import Team
from insights.session_recordings.queries.session_recording_list_from_query import SessionRecordingListFromQuery
from insights.sync import database_sync_to_async
from insights.temporal.ai.video_segment_clustering.models import (
    GetSessionsToPrimeResult,
    PrimeSessionEmbeddingsActivityInputs,
)


logger = structlog.get_logger(__name__)


MAX_SESSIONS_TO_PRIME_EMBEDDINGS = 200


@activity.defn
async def get_sessions_to_prime_activity(
    inputs: PrimeSessionEmbeddingsActivityInputs,
) -> GetSessionsToPrimeResult:
    """Identify sessions that need summarization for embedding priming.

    Fetches recent sessions (completed within within the lookback period), filters out already-summarized ones,
    and returns the list of session IDs that need summarization along with user info
    needed to start child summarization workflows.
    """
    team = await Team.objects.aget(id=inputs.team_id)

    session_ids = await database_sync_to_async(_fetch_recent_session_ids)(
        team=team,
        lookback_hours=inputs.lookback_hours,
    )

    if not session_ids:
        return GetSessionsToPrimeResult(
            session_ids_to_summarize=[],
            user_id=None,
            user_distinct_id=None,
        )

    # Get first user with access to the team for running summarization (as summarization requires _some_ user)
    # TODO: We should instead pass no user, in which case summarization should understand this was system-initiated
    system_user = await database_sync_to_async(lambda: team.all_users_with_access().first())()

    if not system_user:
        logger.warning("No user found to run summarization", team_id=inputs.team_id)
        return GetSessionsToPrimeResult(
            session_ids_to_summarize=[],
            user_id=None,
            user_distinct_id=None,
        )

    # Check which sessions already have summaries
    existing_summaries = await database_sync_to_async(SingleSessionSummary.objects.summaries_exist)(
        team_id=inputs.team_id,
        session_ids=session_ids,
        extra_summary_context=None,
    )

    sessions_to_summarize = [session_id for session_id in session_ids if not existing_summaries.get(session_id)]

    return GetSessionsToPrimeResult(
        session_ids_to_summarize=sessions_to_summarize,
        user_id=system_user.id,
        user_distinct_id=system_user.distinct_id,
    )


def _fetch_recent_session_ids(team: Team, lookback_hours: int) -> list[str]:
    """Fetch session IDs of recordings that ended within the lookback period.

    Args:
        team: Team object to query for
        lookback_hours: How far back to look for ended recordings

    Returns:
        List of session IDs of finished recordings in the timeframe
    """
    # RecordingsQuery for consistency with the session recordings API
    query = RecordingsQuery(
        filter_test_accounts=True,
        date_from=f"-{lookback_hours}h",
        limit=MAX_SESSIONS_TO_PRIME_EMBEDDINGS,
        having_predicates=[
            RecordingPropertyFilter(
                key="active_seconds",  # Ignore sessions that are too short
                operator=PropertyOperator.GTE,
                value=MIN_ACTIVE_SECONDS_FOR_VIDEO_SUMMARY_S,
            ),
            RecordingPropertyFilter(
                key="ongoing",  # Only include finished sessions
                operator=PropertyOperator.EXACT,
                value=0,  # The bool is represented as 0/1 in ClickiHouse
            ),
        ],
    )

    with tags_context(product=Product.SESSION_SUMMARY):
        result = SessionRecordingListFromQuery(team=team, query=query).run()

    return [recording["session_id"] for recording in result.results]
