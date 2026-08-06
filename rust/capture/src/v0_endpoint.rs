use axum::body::Body;
use axum::extract::{MatchedPath, Query, State};
use axum::http::{HeaderMap, Method};
use axum::{debug_handler, Json};
use axum_client_ip::InsecureClientIp;
use tracing::{instrument, Span};

use crate::{
    api::{CaptureError, CaptureResponse, CaptureResponseCode},
    events::{analytics::process_events, recordings::process_replay_events},
    payload::{handle_event_payload, handle_recording_payload, EventQuery},
    prometheus::{report_dropped_events, report_internal_error_metrics},
    router,
    warnings::WarningType,
};

#[instrument(skip(state, body, meta), fields(params_compression))]
#[debug_handler]
pub async fn event(
    state: State<router::State>,
    ip: InsecureClientIp,
    meta: Query<EventQuery>,
    headers: HeaderMap,
    method: Method,
    path: MatchedPath,
    body: Body,
) -> Result<CaptureResponse, CaptureError> {
    let mut params: EventQuery = meta.0;

    // TODO(eli): temporary peek at compression
    if params.compression.is_some() {
        Span::current().record(
            "params_compression",
            format!("{}", params.compression.unwrap()),
        );
    }

    match handle_event_payload(&state, &ip, &mut params, &headers, &method, &path, body).await {
        Err(CaptureError::BillingLimit) => {
            // Short term: return OK here to avoid clients retrying over and over
            // Long term: v1 endpoints will return richer errors, sync w/SDK behavior
            Ok(CaptureResponse {
                status: CaptureResponseCode::Ok,
                quota_limited: None,
            })
        }

        Err(CaptureError::EmptyPayloadFiltered) => {
            // as per legacy behavior, for now we'll silently accept these submissions
            // when invalid event type filtering has resulted in an empty event payload
            Ok(CaptureResponse {
                status: CaptureResponseCode::Ok,
                quota_limited: None,
            })
        }

        Err(err) => {
            report_internal_error_metrics(err.to_metric_tag(), "parsing");
            if let Some(warning) = WarningType::for_error(&err) {
                state.warnings.refused(warning, None, "analytics", None);
            }
            Err(err)
        }

        Ok((context, events)) => {
            let event_count = events.len() as u64;

            // Positive token→team allow-list. A token that resolves to no team is
            // forged/unknown ⇒ REJECT. A KV outage (Unavailable) fails OPEN on this
            // high-volume analytics path: a forged token is still rejected whenever
            // the KV is healthy, but an infra blip must never halt ingest.
            if let Some(resolver) = &state.team_resolver {
                match resolver.resolve(&context.token).await {
                    Ok(_) => {}
                    Err(crate::team::TeamResolveError::Unknown) => {
                        report_dropped_events("unknown_token", event_count);
                        state.warnings.refused(
                            WarningType::IngestKeyUnknown,
                            Some(&context.token),
                            "analytics",
                            Some(event_count),
                        );
                        return Err(CaptureError::UnknownToken);
                    }
                    Err(crate::team::TeamResolveError::Unavailable) => {}
                }
            }

            if let Err(err) = process_events(
                state.sink.clone(),
                state.token_dropper.clone(),
                state.event_restriction_service.clone(),
                state.historical_cfg,
                state.global_rate_limiter_token_distinctid.clone(),
                state.overflow_limiter.clone(),
                state.ai_events_overflow_limiter.clone(),
                state.ingestion_warning_emitter.clone(),
                &state.ai_routing,
                events,
                &context,
            )
            .await
            {
                report_dropped_events(err.to_metric_tag(), event_count);
                report_internal_error_metrics(err.to_metric_tag(), "processing");
                return Err(err);
            }

            Ok(CaptureResponse {
                status: if params.beacon {
                    CaptureResponseCode::NoContent
                } else {
                    CaptureResponseCode::Ok
                },
                quota_limited: None,
            })
        }
    }
}

#[instrument(
    skip_all,
    fields(
        path,
        token,
        batch_size,
        user_agent,
        content_encoding,
        content_type,
        version,
        compression,
        historical_migration
    )
)]
#[debug_handler]
pub async fn recording(
    state: State<router::State>,
    ip: InsecureClientIp,
    meta: Query<EventQuery>,
    headers: HeaderMap,
    method: Method,
    path: MatchedPath,
    body: Body,
) -> Result<CaptureResponse, CaptureError> {
    let mut params: EventQuery = meta.0;

    match handle_recording_payload(&state, &ip, &mut params, &headers, &method, &path, body).await {
        Err(CaptureError::BillingLimit) => Ok(CaptureResponse {
            status: CaptureResponseCode::Ok,
            quota_limited: Some(vec!["recordings".to_string()]),
        }),
        Err(err) => {
            report_internal_error_metrics(err.to_metric_tag(), "parsing");
            if let Some(warning) = WarningType::for_error(&err) {
                state.warnings.refused(warning, None, "recordings", None);
            }
            Err(err)
        }
        Ok((context, events)) => {
            let count = events.len() as u64;

            // Positive token→team allow-list for the PII recordings path. Unknown
            // ⇒ REJECT. Unavailable ⇒ fail CLOSED: drop the recording (accepted,
            // not stored) rather than persist session PII we cannot bind to a real
            // team while the KV is unreachable.
            if let Some(resolver) = &state.team_resolver {
                match resolver.resolve(&context.token).await {
                    Ok(_) => {}
                    Err(crate::team::TeamResolveError::Unknown) => {
                        report_dropped_events("unknown_token", count);
                        state.warnings.refused(
                            WarningType::IngestKeyUnknown,
                            Some(&context.token),
                            "recordings",
                            Some(count),
                        );
                        return Err(CaptureError::UnknownToken);
                    }
                    Err(crate::team::TeamResolveError::Unavailable) => {
                        report_dropped_events("team_unavailable_fail_closed", count);
                        return Ok(CaptureResponse {
                            status: CaptureResponseCode::Ok,
                            quota_limited: None,
                        });
                    }
                }
            }

            if let Err(err) = process_replay_events(
                state.sink.clone(),
                state.event_restriction_service.clone(),
                state.replay_overflow_limiter.clone(),
                events,
                &context,
            )
            .await
            {
                report_dropped_events(err.to_metric_tag(), count);
                report_internal_error_metrics(err.to_metric_tag(), "processing");
                return Err(err);
            }
            Ok(CaptureResponse {
                status: if params.beacon {
                    CaptureResponseCode::NoContent
                } else {
                    CaptureResponseCode::Ok
                },
                quota_limited: None,
            })
        }
    }
}

pub async fn options() -> Result<Json<CaptureResponse>, CaptureError> {
    Ok(Json(CaptureResponse {
        status: CaptureResponseCode::Ok,
        quota_limited: None,
    }))
}
