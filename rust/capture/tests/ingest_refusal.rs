//! The door's refusal contract: a caller can tell success from oblivion, and an
//! operator can see who is being turned away.

use std::sync::Arc;
use std::time::Duration;

use async_trait::async_trait;
use axum_test_helper::TestClient;
use capture::{
    config::CaptureMode,
    prometheus::setup_metrics_recorder,
    quota_limiters::CaptureQuotaLimiter,
    router::router,
    sinks::print::PrintSink,
    team::{StaticTeamResolver, TeamResolveError, TeamResolver},
    time::SystemTime,
    warnings::Warnings,
};
use common_redis::MockRedisClient;
use common_types::TeamId;
use health::HealthRegistry;
use limiters::token_dropper::TokenDropper;
use metrics_exporter_prometheus::PrometheusHandle;
use once_cell::sync::Lazy;
use serde_json::Value;

#[path = "./common/utils.rs"]
mod test_utils;
use test_utils::DEFAULT_CONFIG;

/// One recorder per test binary; `render()` is a cumulative scrape.
static METRICS: Lazy<PrometheusHandle> =
    Lazy::new(|| setup_metrics_recorder(String::from("test"), "events"));

/// Resolves nothing: every key is forged, unknown, or revoked.
struct NoTeamResolver;

#[async_trait]
impl TeamResolver for NoTeamResolver {
    async fn resolve(&self, _token: &str) -> Result<TeamId, TeamResolveError> {
        Err(TeamResolveError::Unknown)
    }
}

fn client(mode: CaptureMode, team_resolver: Option<Arc<dyn TeamResolver>>) -> TestClient {
    let redis = Arc::new(MockRedisClient::new());
    let mut cfg = DEFAULT_CONFIG.clone();
    cfg.capture_mode = mode;
    let quota_limiter = CaptureQuotaLimiter::new(&cfg, redis.clone(), Duration::from_secs(60));

    TestClient::new(router(
        SystemTime {},
        HealthRegistry::new("refusal"),
        PrintSink {},
        redis,
        None,
        quota_limiter,
        TokenDropper::default(),
        None,
        false, // metrics: the recorder is installed once by METRICS
        mode,
        String::from("capture"),
        None,
        25 * 1024 * 1024,
        false,
        1_i64,
        false,
        0.0_f32,
        26_214_400,
        None,
        Some(10),
        None,
        256,
        team_resolver,
        Arc::new(Warnings::default()),
    ))
}

async fn post(client: &TestClient, path: &str, body: &str) -> (u16, Option<String>, String) {
    let res = client
        .post(path)
        .body(body.to_owned())
        .header("Content-Type", "application/json")
        .header("X-Forwarded-For", "127.0.0.1")
        .send()
        .await;
    let status = res.status().as_u16();
    let content_type = res
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);
    (status, content_type, res.text().await)
}

const KEYLESS: &str = r#"{"event":"$pageview","distinct_id":"d1"}"#;
const KEYED: &str = r#"{"event":"$pageview","distinct_id":"d1","api_key":"phc_real"}"#;

#[tokio::test]
async fn keyless_analytics_is_refused_by_name() {
    Lazy::force(&METRICS);
    let c = client(
        CaptureMode::Events,
        Some(Arc::new(StaticTeamResolver::new(1))),
    );

    let (status, content_type, body) = post(&c, "/v1/e", KEYLESS).await;

    // Not a 200 with a silent drop: a named refusal a client can branch on.
    assert_eq!(status, 401);
    assert_eq!(content_type.as_deref(), Some("application/json"));

    let body: Value = serde_json::from_str(&body).expect("refusal must be JSON");
    assert_eq!(body["code"], "ingest_key_required");
    assert_eq!(body["status"], 401);
    assert!(body["error"].is_string());
}

#[tokio::test]
async fn keyless_recordings_is_refused_by_the_same_name() {
    Lazy::force(&METRICS);
    let c = client(
        CaptureMode::Recordings,
        Some(Arc::new(StaticTeamResolver::new(1))),
    );

    let (status, _, body) = post(&c, "/v1/s", KEYLESS).await;

    assert_eq!(status, 401);
    let body: Value = serde_json::from_str(&body).unwrap();
    assert_eq!(body["code"], "ingest_key_required");
}

#[tokio::test]
async fn a_key_that_names_no_project_is_refused_apart_from_a_missing_one() {
    Lazy::force(&METRICS);
    let c = client(CaptureMode::Events, Some(Arc::new(NoTeamResolver)));

    let (status, _, body) = post(&c, "/v1/e", KEYED).await;

    // 403, not 401: this key will never work, so retrying with it is pointless.
    assert_eq!(status, 403);
    let body: Value = serde_json::from_str(&body).unwrap();
    assert_eq!(body["code"], "ingest_key_unknown");
}

#[tokio::test]
async fn a_key_that_resolves_still_passes() {
    Lazy::force(&METRICS);
    let c = client(
        CaptureMode::Events,
        Some(Arc::new(StaticTeamResolver::new(42))),
    );

    let (status, _, body) = post(&c, "/v1/e", KEYED).await;

    assert_eq!(status, 200, "a resolvable key must not be refused: {body}");
    assert!(
        !body.contains("ingest_key"),
        "success carries no refusal code"
    );
}

#[tokio::test]
async fn disabling_the_allowlist_admits_an_unresolvable_key_but_still_refuses_a_keyless_one() {
    Lazy::force(&METRICS);
    // `None` is what config `enforce_token_allowlist=false` wires in server.rs.
    let c = client(CaptureMode::Events, None);

    let (status, _, _) = post(&c, "/v1/e", KEYED).await;
    assert_eq!(status, 200, "allow-list off admits a shape-valid key");

    let (status, _, body) = post(&c, "/v1/e", KEYLESS).await;
    assert_eq!(status, 401, "the switch never re-opens the keyless lane");
    let body: Value = serde_json::from_str(&body).unwrap();
    assert_eq!(body["code"], "ingest_key_required");
}

#[tokio::test]
async fn refusals_are_visible_to_an_operator() {
    Lazy::force(&METRICS);

    let keyless = client(
        CaptureMode::Events,
        Some(Arc::new(StaticTeamResolver::new(1))),
    );
    post(&keyless, "/v1/e", KEYLESS).await;

    let unknown = client(CaptureMode::Events, Some(Arc::new(NoTeamResolver)));
    post(&unknown, "/v1/e", KEYED).await;

    let scrape = METRICS.render();

    // Both refusal kinds are counted, attributed to the door that refused.
    assert!(
        scrape.contains(r#"capture_ingestion_warnings_total{"#)
            && scrape.contains(r#"type="ingest_key_required""#),
        "a keyless refusal must be countable:\n{scrape}"
    );
    assert!(
        scrape.contains(r#"type="ingest_key_unknown""#),
        "an unknown-key refusal must be countable:\n{scrape}"
    );
    assert!(
        scrape.contains(r#"source="analytics""#),
        "the refusing door must be attributed:\n{scrape}"
    );
    assert!(
        scrape.contains(r#"outcome="emitted""#),
        "the first refusal of a key must not be throttled away:\n{scrape}"
    );

    // Volume is counted separately from the throttled per-key warning, so a
    // throttled log never hides how much traffic is being turned away.
    assert!(
        scrape.contains("capture_events_dropped_total"),
        "refused events must still be counted:\n{scrape}"
    );

    // The credential itself is never scraped.
    assert!(
        !scrape.contains("phc_real"),
        "a refused credential must not reach the metrics plane:\n{scrape}"
    );
}
