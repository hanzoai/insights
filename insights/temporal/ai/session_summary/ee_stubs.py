"""Stubs for classes/functions that were in ee/ (now OSS).
These are minimal stubs to prevent NameError during import.
Features should be reworked to use Hanzo's own infrastructure."""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional

from django.db import models

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class SessionSummaryRunMeta:
    """Metadata about a session summary run."""
    model_used: str = ""
    visual_confirmation: bool = False
    run_id: str = ""
    started_at: Optional[str] = None
    finished_at: Optional[str] = None


@dataclass(frozen=True)
class SessionSummaryPage:
    """A page visited in a session."""
    url: str = ""
    title: str = ""


@dataclass
class SingleSessionSummaryLlmInputs:
    """Inputs for single session summary LLM processing."""
    session_id: str = ""
    user_id: int = 0
    user_distinct_id_to_log: str = ""
    model_to_use: str = ""
    summary_prompt: str = ""
    system_prompt: str = ""
    simplified_events_mapping: dict = field(default_factory=dict)
    event_ids_mapping: dict = field(default_factory=dict)
    simplified_events_columns: list = field(default_factory=list)
    url_mapping_reversed: dict = field(default_factory=dict)
    window_mapping_reversed: dict = field(default_factory=dict)
    session_start_time_str: str = ""
    session_duration: float = 0.0
    distinct_id: str = ""


@dataclass
class SessionSummaryDBData:
    """Raw DB data for a session."""
    session_metadata: dict = field(default_factory=dict)
    session_events_columns: list = field(default_factory=list)
    session_events: list = field(default_factory=list)


@dataclass
class RawSessionGroupSummaryPattern:
    """A raw pattern from session group summary."""
    pattern_name: str = ""
    pattern: str = ""
    count: int = 0
    sessions: list = field(default_factory=list)


@dataclass
class RawSessionGroupSummaryPatternsList:
    """List of raw patterns from session group summary."""
    patterns: list = field(default_factory=list)


class EnrichedSessionGroupSummaryPatternsList:
    """Enriched patterns with additional context."""
    def __init__(self, **kwargs):
        self.patterns = kwargs.get("patterns", [])

    @classmethod
    def model_validate_json(cls, json_str: str) -> "EnrichedSessionGroupSummaryPatternsList":
        import json
        data = json.loads(json_str)
        return cls(**data)

    def model_dump_json(self, exclude_none: bool = False) -> str:
        import json
        return json.dumps({"patterns": self.patterns})


@dataclass
class RawSessionGroupPatternAssignmentsList:
    """Pattern assignments for sessions."""
    assignments: list = field(default_factory=list)


# ---------------------------------------------------------------------------
# Serializer / validator stubs
# ---------------------------------------------------------------------------

class SessionSummarySerializer:
    """Stub serializer for session summaries."""
    def __init__(self, *args, **kwargs):
        self.data = kwargs.get("data", {})
        self.instance = None
        self._errors = {}

    def is_valid(self, raise_exception: bool = False) -> bool:
        return True

    @property
    def errors(self):
        return self._errors

    def save(self, **kwargs):
        return self.instance


class SessionSummaryVideoValidator:
    """Stub validator for session summary videos."""
    def __init__(self, *args, **kwargs):
        pass

    async def validate_session_summary_with_videos(self, *args, **kwargs):
        return None

    def validate(self, *args, **kwargs):
        return True


# ---------------------------------------------------------------------------
# Django model stubs -- just enough so .objects.X calls don't crash at import
# ---------------------------------------------------------------------------

class _StubManager(models.Manager):
    """Manager that raises NotImplementedError on any actual DB call."""

    def _not_implemented(self, *args, **kwargs):
        raise NotImplementedError(
            "SingleSessionSummary/SessionGroupSummary Django models were removed with ee/. "
            "This stub exists only to prevent import-time NameError."
        )

    # Custom manager methods used in the codebase
    summaries_exist = _not_implemented
    get_summary = _not_implemented
    get_bulk_summaries = _not_implemented
    add_summary = _not_implemented


class SingleSessionSummary(models.Model):
    """Stub model -- prevents NameError at import time."""
    objects = _StubManager()

    session_id = models.CharField(max_length=255, default="")
    team_id = models.IntegerField(default=0)
    summary = models.JSONField(default=dict)
    run_metadata = models.JSONField(default=dict, null=True)
    extra_summary_context = models.JSONField(default=dict, null=True)

    class Meta:
        app_label = "insights"
        managed = False  # no migrations generated
        db_table = "insights_singlesessionsummary"


class SessionGroupSummary(models.Model):
    """Stub model -- prevents NameError at import time."""
    objects = _StubManager()

    team_id = models.IntegerField(default=0)
    title = models.CharField(max_length=255, default="")
    session_ids = models.JSONField(default=list)
    summary = models.TextField(default="")
    extra_summary_context = models.JSONField(default=dict, null=True)
    run_metadata = models.JSONField(default=dict, null=True)
    created_by = models.ForeignKey(
        "posthog.User", on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        app_label = "insights"
        managed = False
        db_table = "insights_sessiongroupsummary"


# ---------------------------------------------------------------------------
# Stub helper functions
# ---------------------------------------------------------------------------

def capture_session_summary_timing(*args, **kwargs):
    """No-op timing capture."""
    pass


def get_video_duration_s(video_bytes: bytes) -> float:
    """Return 0 for video duration (stub)."""
    return 0.0


def get_column_index(columns: list, column_name: str) -> int:
    """Get index of a column by name."""
    try:
        return columns.index(column_name)
    except ValueError:
        return -1


def prepare_datetime(dt_value) -> Optional[datetime]:
    """Convert datetime-like value to datetime object."""
    if dt_value is None:
        return None
    if isinstance(dt_value, datetime):
        return dt_value
    if isinstance(dt_value, str):
        from dateutil import parser as dateutil_parser
        return dateutil_parser.isoparse(dt_value)
    return None


def calculate_time_since_start(timestamp, start_time) -> Optional[float]:
    """Calculate milliseconds since start."""
    ts = prepare_datetime(timestamp)
    st = prepare_datetime(start_time) if not isinstance(start_time, datetime) else start_time
    if ts is None or st is None:
        return None
    return (ts - st).total_seconds() * 1000


def unpack_full_event_id(full_event_id: str, session_id: str = "") -> tuple:
    """Unpack a full event ID into (event_id, event_uuid)."""
    parts = full_event_id.split("_", 1)
    if len(parts) == 2:
        return (parts[0], parts[1])
    return (full_event_id, "")


def logging_session_ids(session_ids: list[str]) -> str:
    """Format session IDs for logging (truncate if too many)."""
    if len(session_ids) <= 5:
        return ", ".join(session_ids)
    return f"{', '.join(session_ids[:5])}... ({len(session_ids)} total)"


def serialize_to_sse_event(event_label: str, event_data: str) -> str:
    """Serialize data to SSE event format."""
    import json
    return f"event: {event_label}\ndata: {json.dumps(event_data)}\n\n"


def get_exception_event_ids_from_summary(session_summary) -> list[str]:
    """Extract exception event IDs from a session summary."""
    return []


async def get_session_data_from_db(session_id: str, team_id: int, local_reads_prod: bool = False) -> SessionSummaryDBData:
    """Fetch session data from the database (stub)."""
    raise NotImplementedError("get_session_data_from_db: ee/ removed, needs reimplementation")


async def prepare_data_for_single_session_summary(
    session_id: str,
    user_id: int,
    session_db_data: SessionSummaryDBData,
    extra_summary_context=None,
) -> dict:
    """Prepare data for single session summary (stub)."""
    raise NotImplementedError("prepare_data_for_single_session_summary: ee/ removed, needs reimplementation")


def prepare_single_session_summary_input(
    session_id: str,
    user_id: int,
    user_distinct_id_to_log: str,
    summary_data: dict,
    model_to_use: str,
) -> SingleSessionSummaryLlmInputs:
    """Prepare input for single session summary (stub)."""
    raise NotImplementedError("prepare_single_session_summary_input: ee/ removed, needs reimplementation")


async def get_llm_single_session_summary(*args, **kwargs):
    """Get LLM single session summary (stub)."""
    raise NotImplementedError("get_llm_single_session_summary: ee/ removed, needs reimplementation")


async def stream_llm_single_session_summary(*args, **kwargs):
    """Stream LLM single session summary (stub)."""
    raise NotImplementedError("stream_llm_single_session_summary: ee/ removed, needs reimplementation")


def add_context_and_filter_events(
    session_events_columns: list,
    session_events: list,
    session_id: str,
    session_start_time=None,
    session_end_time=None,
) -> tuple[list, list]:
    """Add context and filter events (stub)."""
    return session_events_columns, session_events


def estimate_tokens_from_strings(strings: list[str], model: str = "") -> int:
    """Estimate token count for a list of strings (stub)."""
    return sum(len(s) // 4 for s in strings)


def remove_excessive_content_from_session_summary_for_llm(summary: dict):
    """Remove excessive content from session summary for LLM (stub)."""

    class _Result:
        def __init__(self, data):
            self.data = data

    return _Result(summary)


def generate_session_group_patterns_extraction_prompt(
    session_summaries_str: list[str], extra_summary_context=None
):
    """Generate prompt for patterns extraction (stub)."""

    class _Prompt:
        def __init__(self):
            self.system_prompt = ""
            self.patterns_prompt = ""

    return _Prompt()


async def get_llm_session_group_patterns_extraction(*args, **kwargs) -> RawSessionGroupSummaryPatternsList:
    """Get patterns extraction from LLM (stub)."""
    raise NotImplementedError("get_llm_session_group_patterns_extraction: ee/ removed, needs reimplementation")


def generate_session_group_patterns_combination_prompt(patterns_chunks=None, extra_summary_context=None):
    """Generate prompt for combining patterns (stub)."""
    return ""


async def get_llm_session_group_patterns_combination(*args, **kwargs) -> RawSessionGroupSummaryPatternsList:
    """Get combined patterns from LLM (stub)."""
    raise NotImplementedError("get_llm_session_group_patterns_combination: ee/ removed, needs reimplementation")


def generate_session_group_patterns_assignment_prompt(patterns=None, session_summaries_str=None, extra_summary_context=None):
    """Generate prompt for pattern assignment (stub)."""
    return ""


async def get_llm_session_group_patterns_assignment(*args, **kwargs) -> RawSessionGroupPatternAssignmentsList:
    """Get pattern assignments from LLM (stub)."""
    raise NotImplementedError("get_llm_session_group_patterns_assignment: ee/ removed, needs reimplementation")


def create_event_ids_mapping_from_ready_summaries(session_id_to_ready_summaries_mapping=None) -> dict:
    """Create event IDs mapping from ready summaries (stub)."""
    return {}


def combine_patterns_assignments_from_single_session_summaries(
    patterns_assignments_list_of_lists=None, event_id_to_session_id_mapping=None
) -> dict:
    """Combine pattern assignments from single session summaries (stub)."""
    return {}


def combine_patterns_ids_with_events_context(
    combined_event_ids_mappings=None,
    combined_patterns_assignments=None,
    session_id_to_ready_summaries_mapping=None,
    session_id_to_person_mapping=None,
) -> dict:
    """Combine pattern IDs with events context (stub)."""
    return {}


def combine_patterns_with_events_context(
    patterns=None,
    pattern_id_to_event_context_mapping=None,
    session_ids=None,
    user_id=None,
) -> EnrichedSessionGroupSummaryPatternsList:
    """Combine patterns with events context (stub)."""
    return EnrichedSessionGroupSummaryPatternsList()


def get_persons_for_sessions_from_distinct_ids(
    session_id_to_ready_summaries_mapping=None, team_id=None
) -> dict:
    """Get persons for sessions from distinct IDs (stub)."""
    return {}
