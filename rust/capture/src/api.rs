use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::token::InvalidTokenReason;

/// Machine-readable refusal body. Byte-identical in shape to the `/v1/event`
/// door cloud already serves (`zip.HTTPError`), so a client branches on `code`
/// once and both doors answer it the same way.
#[derive(Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct ErrorBody {
    pub status: u16,
    pub code: &'static str,
    pub error: String,
}

#[derive(Debug, PartialEq, Eq, Deserialize, Serialize)]
pub enum CaptureResponseCode {
    Ok = 1,
    NoContent = 2,
}

#[derive(Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct CaptureResponse {
    pub status: CaptureResponseCode,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub quota_limited: Option<Vec<String>>,
}

impl IntoResponse for CaptureResponse {
    fn into_response(self) -> Response {
        match self.status {
            CaptureResponseCode::NoContent => StatusCode::NO_CONTENT.into_response(),
            CaptureResponseCode::Ok => (StatusCode::OK, Json(self)).into_response(),
        }
    }
}

#[derive(Clone, Error, Debug)]
pub enum CaptureError {
    #[error("failed to decode request: {0}")]
    RequestDecodingError(String),
    #[error("failed to parse request: {0}")]
    RequestParsingError(String),
    #[error("failed to hydrate events from request: {0}")]
    RequestHydrationError(String),

    #[error("request holds no event")]
    EmptyBatch,
    #[error("request missing data payload")]
    EmptyPayload,
    #[error("event submitted with an empty event name")]
    MissingEventName,
    #[error("event submitted without a distinct_id")]
    MissingDistinctId,
    #[error("event submitted with invalid cookieless mode")]
    InvalidCookielessMode,
    #[error("event submitted with invalid timestamp")]
    InvalidTimestamp,
    #[error("replay event submitted without snapshot data")]
    MissingSnapshotData,
    #[error("replay event submitted without session id")]
    MissingSessionId,
    #[error("replay event submitted without window id")]
    MissingWindowId,
    #[error("replay event has invalid session id")]
    InvalidSessionId,

    #[error("event submitted without an api_key")]
    NoTokenError,
    #[error("batch submitted with inconsistent api_key values")]
    MultipleTokensError,
    #[error("API key is not valid: {0}")]
    TokenValidationError(#[from] InvalidTokenReason),
    #[error("api_key does not resolve to a known project")]
    UnknownToken,

    #[error("transient error, please retry")]
    RetryableSinkError,
    #[error("maximum event size exceeded: {0}")]
    EventTooBig(String),
    #[error("invalid event could not be processed")]
    NonRetryableSinkError,

    #[error("billing limit reached")]
    BillingLimit,

    #[error("rate limited")]
    RateLimited,

    #[error("rate limit exceeded: events per minute")]
    GlobalRateLimitExceeded(),

    #[error("payload empty after filtering invalid event types")]
    EmptyPayloadFiltered,

    #[error("service unavailable: {0}")]
    ServiceUnavailable(String),

    #[error("client stopped sending data")]
    BodyReadTimeout,

    #[error("internal server error: {0}")]
    InternalError(String),
}

impl From<serde_json::Error> for CaptureError {
    fn from(e: serde_json::Error) -> Self {
        CaptureError::RequestParsingError(e.to_string())
    }
}

impl CaptureError {
    pub fn to_metric_tag(&self) -> &'static str {
        match self {
            CaptureError::RequestDecodingError(_) => "req_decoding",
            CaptureError::RequestParsingError(_) => "req_parsing",
            CaptureError::RequestHydrationError(_) => "req_hydration",
            CaptureError::EmptyBatch => "empty_batch",
            CaptureError::EmptyPayload => "empty_payload",
            CaptureError::MissingEventName => "no_event_name",
            CaptureError::MissingDistinctId => "no_distinct_id",
            CaptureError::InvalidCookielessMode => "invalid_cookieless",
            CaptureError::InvalidTimestamp => "invalid_timestamp",
            CaptureError::MissingSnapshotData => "no_snapshot",
            CaptureError::MissingSessionId => "no_session_id",
            CaptureError::MissingWindowId => "no_window_id",
            CaptureError::InvalidSessionId => "invalid_session",
            CaptureError::NoTokenError => "no_token",
            CaptureError::MultipleTokensError => "multiple_tokens",
            CaptureError::TokenValidationError(_) => "invalid_token",
            CaptureError::UnknownToken => "unknown_token",
            CaptureError::RetryableSinkError => "retryable_sink",
            CaptureError::EventTooBig(_) => "oversize_event",
            CaptureError::NonRetryableSinkError => "non_retry_sink",
            CaptureError::BillingLimit => "billing_limit",
            CaptureError::RateLimited => "rate_limited",
            CaptureError::GlobalRateLimitExceeded() => "global_rate_limit",
            CaptureError::EmptyPayloadFiltered => "empty_filtered_payload",
            CaptureError::ServiceUnavailable(_) => "service_unavailable",
            CaptureError::BodyReadTimeout => "body_read_timeout",
            CaptureError::InternalError(_) => "internal_error",
        }
    }

    /// The client-facing code. The credential arms use the vocabulary the
    /// `/v1/event` door already answers with, so a caller branches once:
    /// `ingest_key_required` (nothing presented), `ingest_key_unknown`
    /// (presented, names no project), `unroutable_events` (body names no one
    /// project to land in). The rest name the payload defect they describe.
    pub fn code(&self) -> &'static str {
        match self {
            CaptureError::NoTokenError => "ingest_key_required",
            CaptureError::TokenValidationError(_) | CaptureError::UnknownToken => {
                "ingest_key_unknown"
            }
            CaptureError::MultipleTokensError => "unroutable_events",

            CaptureError::RequestDecodingError(_) => "request_decoding_error",
            CaptureError::RequestParsingError(_) => "request_parsing_error",
            CaptureError::RequestHydrationError(_) => "request_hydration_error",
            CaptureError::EmptyBatch => "empty_batch",
            CaptureError::EmptyPayload => "empty_payload",
            CaptureError::EmptyPayloadFiltered => "empty_payload_filtered",
            CaptureError::MissingEventName => "missing_event_name",
            CaptureError::MissingDistinctId => "missing_distinct_id",
            CaptureError::InvalidCookielessMode => "invalid_cookieless_mode",
            CaptureError::InvalidTimestamp => "invalid_timestamp",
            CaptureError::MissingSnapshotData => "missing_snapshot_data",
            CaptureError::MissingSessionId => "missing_session_id",
            CaptureError::MissingWindowId => "missing_window_id",
            CaptureError::InvalidSessionId => "invalid_session_id",
            CaptureError::NonRetryableSinkError => "invalid_event",
            CaptureError::EventTooBig(_) => "payload_too_large",
            CaptureError::RetryableSinkError | CaptureError::ServiceUnavailable(_) => {
                "service_unavailable"
            }
            CaptureError::BillingLimit => "billing_limit",
            CaptureError::RateLimited | CaptureError::GlobalRateLimitExceeded(..) => "rate_limited",
            CaptureError::BodyReadTimeout => "body_read_timeout",
            CaptureError::InternalError(_) => "internal_error",
        }
    }

    pub fn status_code(&self) -> StatusCode {
        match self {
            CaptureError::RequestDecodingError(_)
            | CaptureError::RequestParsingError(_)
            | CaptureError::RequestHydrationError(_)
            | CaptureError::EmptyBatch
            | CaptureError::EmptyPayload
            | CaptureError::MissingEventName
            | CaptureError::MissingDistinctId
            | CaptureError::InvalidCookielessMode
            | CaptureError::InvalidTimestamp
            | CaptureError::NonRetryableSinkError
            | CaptureError::MissingSessionId
            | CaptureError::MissingWindowId
            | CaptureError::InvalidSessionId
            | CaptureError::EmptyPayloadFiltered
            | CaptureError::MultipleTokensError
            | CaptureError::MissingSnapshotData => StatusCode::BAD_REQUEST,

            CaptureError::EventTooBig(_) => StatusCode::PAYLOAD_TOO_LARGE,

            // Nothing presented is a 401 (send a key); a key that names no
            // project is a 403 (this key will never work) — the split lets a
            // caller tell "I forgot to send one" from "mine is wrong".
            CaptureError::NoTokenError => StatusCode::UNAUTHORIZED,
            CaptureError::TokenValidationError(_) | CaptureError::UnknownToken => {
                StatusCode::FORBIDDEN
            }

            CaptureError::RetryableSinkError | CaptureError::ServiceUnavailable(_) => {
                StatusCode::SERVICE_UNAVAILABLE
            }

            CaptureError::BillingLimit
            | CaptureError::RateLimited
            | CaptureError::GlobalRateLimitExceeded(..) => StatusCode::TOO_MANY_REQUESTS,

            CaptureError::BodyReadTimeout => StatusCode::REQUEST_TIMEOUT,

            CaptureError::InternalError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

impl IntoResponse for CaptureError {
    fn into_response(self) -> Response {
        let status = self.status_code();
        // Internal detail stays in logs; the wire carries only the class.
        let error = match &self {
            CaptureError::InternalError(_) => "internal server error".to_string(),
            _ => self.to_string(),
        };
        let body = ErrorBody {
            status: status.as_u16(),
            code: self.code(),
            error,
        };
        (status, Json(body)).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;

    #[test]
    fn test_capture_response_into_response_ok() {
        // Test Ok response
        let response = CaptureResponse {
            status: CaptureResponseCode::Ok,
            quota_limited: None,
        };
        let response = response.into_response();
        assert_eq!(response.status(), StatusCode::OK);
    }

    #[test]
    fn credential_refusals_carry_the_shared_vocabulary() {
        // Nothing presented: retry WITH a key.
        let missing = CaptureError::NoTokenError;
        assert_eq!(missing.code(), "ingest_key_required");
        assert_eq!(missing.status_code(), StatusCode::UNAUTHORIZED);

        // Presented but useless: retrying with the same key is pointless.
        for err in [
            CaptureError::UnknownToken,
            CaptureError::TokenValidationError(InvalidTokenReason::Empty),
        ] {
            assert_eq!(err.code(), "ingest_key_unknown", "{err}");
            assert_eq!(err.status_code(), StatusCode::FORBIDDEN, "{err}");
        }

        // A batch naming two projects lands in neither.
        assert_eq!(
            CaptureError::MultipleTokensError.code(),
            "unroutable_events"
        );
        assert_eq!(
            CaptureError::MultipleTokensError.status_code(),
            StatusCode::BAD_REQUEST
        );
    }

    #[test]
    fn test_capture_response_into_response_no_content() {
        // Test NoContent response
        let response = CaptureResponse {
            status: CaptureResponseCode::NoContent,
            quota_limited: None,
        };
        let response = response.into_response();
        assert_eq!(response.status(), StatusCode::NO_CONTENT);
    }

    #[test]
    fn test_internal_error_into_response() {
        let error = CaptureError::InternalError("some detail".to_string());
        let response = error.into_response();
        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);
    }
}
