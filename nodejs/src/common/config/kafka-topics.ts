// Keep this in sync with insights/kafka_client/topics.py
import { isTestEnv } from '../utils/env-utils'

export const suffix = isTestEnv() ? '_test' : ''
export const prefix = process.env.KAFKA_PREFIX || ''

export const KAFKA_EVENTS_JSON = `${prefix}datastore_events_json${suffix}`
export const KAFKA_EVENTS_RECENT_JSON = `${prefix}kafka_events_recent_json${suffix}`
export const KAFKA_PERSON = `${prefix}datastore_person${suffix}`
export const KAFKA_PERSON_OVERRIDES = `${prefix}datastore_person_overrides${suffix}`
export const KAFKA_PERSON_UNIQUE_ID = `${prefix}datastore_person_unique_id${suffix}`
export const KAFKA_PERSON_DISTINCT_ID = `${prefix}datastore_person_distinct_id${suffix}`
export const KAFKA_PERSON_DISTINCT_ID_OVERRIDES = `${prefix}datastore_person_distinct_id_overrides${suffix}`
export const KAFKA_PERSON_DISTINCT_ID2 = `${prefix}datastore_person_distinct_id2${suffix}`

export const KAFKA_EVENTS_PLUGIN_INGESTION = `${prefix}events_plugin_ingestion${suffix}`
export const KAFKA_EVENTS_PLUGIN_INGESTION_DLQ = `${prefix}events_plugin_ingestion_dlq${suffix}`
export const KAFKA_EVENTS_PLUGIN_INGESTION_OVERFLOW = `${prefix}events_plugin_ingestion_overflow${suffix}`
export const KAFKA_EVENTS_PLUGIN_INGESTION_ASYNC = `${prefix}events_plugin_ingestion_async${suffix}`
export const KAFKA_EVENTS_PLUGIN_INGESTION_HISTORICAL = `${prefix}events_plugin_ingestion_historical${suffix}`
export const KAFKA_PLUGIN_LOG_ENTRIES = `${prefix}plugin_log_entries${suffix}`
export const KAFKA_EVENTS_DEAD_LETTER_QUEUE = `${prefix}events_dead_letter_queue${suffix}`
export const KAFKA_GROUPS = `${prefix}datastore_groups${suffix}`
export const KAFKA_BUFFER = `${prefix}conversion_events_buffer${suffix}`
export const KAFKA_INGESTION_WARNINGS = `${prefix}datastore_ingestion_warnings${suffix}`
export const KAFKA_APP_METRICS_2 = `${prefix}datastore_app_metrics2${suffix}`
export const KAFKA_METRICS_TIME_TO_SEE_DATA = `${prefix}datastore_metrics_time_to_see_data${suffix}`

// read session recording snapshot items
export const KAFKA_SESSION_RECORDING_SNAPSHOT_ITEM_EVENTS = `${prefix}session_recording_snapshot_item_events${suffix}`
export const KAFKA_SESSION_RECORDING_SNAPSHOT_ITEM_OVERFLOW = `${prefix}session_recording_snapshot_item_overflow${suffix}`
export const KAFKA_SESSION_RECORDING_SNAPSHOT_ITEM_DLQ = `${prefix}session_recording_snapshot_item_dlq${suffix}`

// write session recording and replay events to Datastore
export const KAFKA_DATASTORE_SESSION_RECORDING_EVENTS = `${prefix}datastore_session_recording_events${suffix}`
export const KAFKA_DATASTORE_SESSION_REPLAY_EVENTS = `${prefix}datastore_session_replay_events${suffix}`
export const KAFKA_DATASTORE_SESSION_REPLAY_FEATURES = `${prefix}datastore_session_replay_features${suffix}`

// anonymized block metadata mirrored to the ML account (consumed by the Parquet sink, not Datastore)
export const KAFKA_SESSION_REPLAY_ML_BLOCK_METADATA = `${prefix}session_replay_ml_block_metadata${suffix}`

// raw inlined replay images: ml-mirror producer -> image-scrub worker
export const KAFKA_SESSION_REPLAY_IMAGE_SCRUB = `${prefix}session_replay_image_scrub${suffix}`

// images the scrub sidecar cannot process, parked so they stop holding the head of their partition.
// The original bytes are kept: unscrubbed content must never reach the ML bucket, but it must not be
// thrown away either, so it waits here for the sidecar bug behind it to be fixed and replayed.
export const KAFKA_SESSION_REPLAY_IMAGE_SCRUB_DLQ = `${prefix}session_replay_image_scrub_dlq${suffix}`

// write performance events to Datastore
export const KAFKA_PERFORMANCE_EVENTS = `${prefix}datastore_performance_events${suffix}`
// write heatmap events to Datastore
export const KAFKA_DATASTORE_HEATMAP_EVENTS = `${prefix}datastore_heatmap_events${suffix}`
// write AI events to Datastore
export const KAFKA_DATASTORE_AI_EVENTS_JSON = `${prefix}datastore_ai_events_json${suffix}`

// log entries for ingestion into Datastore
export const KAFKA_LOG_ENTRIES = `${prefix}log_entries${suffix}`

// per-invocation result rows for script functions and script flows
export const KAFKA_FN_INVOCATION_RESULTS = `${prefix}datastore_hog_invocation_results${suffix}`

// metadata rows for sent message assets (rendered emails stored in object storage)
export const KAFKA_MESSAGE_ASSETS = `${prefix}datastore_message_assets${suffix}`

// CDP topics
export const KAFKA_CDP_FUNCTION_OVERFLOW = `${prefix}cdp_function_overflow${suffix}`
export const KAFKA_CDP_INTERNAL_EVENTS = `${prefix}cdp_internal_events${suffix}`
export const KAFKA_CDP_DATASTORE_BEHAVIORAL_COHORTS_MATCHES = `${prefix}datastore_behavioral_cohorts_matches${suffix}`
export const KAFKA_CDP_DATASTORE_PREFILTERED_EVENTS = `${prefix}datastore_prefiltered_events${suffix}`
export const KAFKA_CDP_DATASTORE_PRECALCULATED_PERSON_PROPERTIES = `${prefix}datastore_precalculated_person_properties${suffix}`
export const KAFKA_COHORT_MEMBERSHIP_CHANGED = `${prefix}cohort_membership_changed${suffix}`
// Cross-partition merge protocol trigger consumed by the cohort-stream-processor (Rust).
export const KAFKA_PERSON_MERGE_EVENTS = `${prefix}person_merge_events${suffix}`

// Error tracking topics
export const KAFKA_ERROR_TRACKING_INGESTION = `${prefix}ingestion-errortracking-main${suffix}` // Partition count varies by env
export const KAFKA_ERROR_TRACKING_INGESTION_DLQ = `${prefix}ingestion-errortracking-main-dlq${suffix}`
export const KAFKA_ERROR_TRACKING_INGESTION_OVERFLOW = `${prefix}ingestion-errortracking-overflow${suffix}` // Partition count varies by env
export const KAFKA_ERROR_TRACKING_ISSUE_FINGERPRINT = `${prefix}datastore_error_tracking_issue_fingerprint${suffix}`
export const KAFKA_ERROR_TRACKING_ISSUE_FINGERPRINT_OVERRIDES = `${prefix}datastore_error_tracking_issue_fingerprint_overrides${suffix}`

// Warehouse source webhook ingestion
export const KAFKA_WAREHOUSE_SOURCE_WEBHOOKS = `${prefix}data_warehouse_source_webhooks${suffix}`

// Logs ingestion topics
export const KAFKA_LOGS_INGESTION = `${prefix}logs_ingestion${suffix}`
export const KAFKA_LOGS_INGESTION_DLQ = `${prefix}logs_ingestion_dlq${suffix}`
export const KAFKA_LOGS_INGESTION_OVERFLOW = `${prefix}logs_ingestion_overflow${suffix}`
export const KAFKA_LOGS_DATASTORE = `${prefix}datastore_logs${suffix}`

// Traces ingestion topics
export const KAFKA_TRACES_INGESTION = `${prefix}ingestion-traces${suffix}`
export const KAFKA_TRACES_INGESTION_DLQ = `${prefix}ingestion-traces-dlq${suffix}`
export const KAFKA_TRACES_INGESTION_OVERFLOW = `${prefix}ingestion-traces-overflow${suffix}`
export const KAFKA_TRACES_DATASTORE = `${prefix}datastore_traces${suffix}`
// Metrics ingestion topics
export const KAFKA_METRICS_INGESTION = `${prefix}metrics_ingestion${suffix}`
export const KAFKA_METRICS_INGESTION_DLQ = `${prefix}metrics_ingestion_dlq${suffix}`
export const KAFKA_METRICS_INGESTION_OVERFLOW = `${prefix}metrics_ingestion_overflow${suffix}`
export const KAFKA_METRICS_DATASTORE = `${prefix}datastore_metrics${suffix}`

// TopHog metrics
export const KAFKA_DATASTORE_TOPHOG = `${prefix}datastore_tophog${suffix}`
