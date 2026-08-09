//! Operator-visible record of refused ingest traffic.
//!
//! A refusal nobody can observe just moves the blindness: the caller learns it
//! failed, the operator does not learn anyone is failing. Every refusal counts
//! events on [`crate::prometheus::report_dropped_events`]; this module adds the
//! attributed half — which credential, how often, from which door — as a
//! throttled warning.
//!
//! Warnings stay on the OPERATOR plane (metrics + logs) and are deliberately not
//! written into a project's own warehouse partition. The token that would name
//! that project is the one we just refused to trust, so filing on it would let
//! anyone spam any project's feed by guessing keys.

use std::num::NonZeroU32;
use std::time::Duration;

use governor::{clock, state::keyed::DefaultKeyedStateStore, Quota, RateLimiter};
use metrics::counter;
use rand::Rng;
use sha2::{Digest, Sha256};
use tracing::warn;

use crate::api::CaptureError;

pub const CAPTURE_INGESTION_WARNINGS_TOTAL: &str = "capture_ingestion_warnings_total";

/// One warning per `(credential, type)` per hour, per pod.
const THROTTLE_PERIOD: Duration = Duration::from_secs(3600);

/// Bound on tracked `(credential, type)` keys. A refused credential is by
/// definition unverified, so a flood of invented ones would grow the map without
/// limit; past the cap we stop emitting rather than grow.
const MAX_TRACKED_KEYS: usize = 100_000;

/// Stands in for the credential in the throttle key when none was presented.
const NO_CREDENTIAL: &str = "-";

/// Why traffic was refused at the door. One variant per condition an operator
/// would act on differently.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum WarningType {
    /// Nothing was presented — a caller is beaconing without a key at all.
    IngestKeyRequired,
    /// A key was presented that names no project: forged, revoked, or a
    /// project's key sent to the wrong deployment.
    IngestKeyUnknown,
}

impl WarningType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::IngestKeyRequired => "ingest_key_required",
            Self::IngestKeyUnknown => "ingest_key_unknown",
        }
    }

    /// The allow-list: only credential refusals raise a warning. Payload defects
    /// are the caller's to fix and are already counted, so alarming an operator
    /// on them would bury the signal that someone cannot get in at all.
    pub fn for_error(err: &CaptureError) -> Option<Self> {
        match err {
            CaptureError::NoTokenError => Some(Self::IngestKeyRequired),
            CaptureError::TokenValidationError(_) | CaptureError::UnknownToken => {
                Some(Self::IngestKeyUnknown)
            }
            _ => None,
        }
    }
}

/// Throttled warning emitter. Cloning shares one throttle.
pub struct Warnings {
    limiter: RateLimiter<Key, DefaultKeyedStateStore<Key>, clock::DefaultClock>,
    max_tracked_keys: usize,
}

type Key = (String, WarningType);

impl Default for Warnings {
    fn default() -> Self {
        Self::new(THROTTLE_PERIOD, MAX_TRACKED_KEYS)
    }
}

impl Warnings {
    /// `period` and `max_tracked_keys` are parameters so tests need not wait an
    /// hour or allocate 100k keys.
    pub fn new(period: Duration, max_tracked_keys: usize) -> Self {
        let quota = Quota::with_period(period)
            .expect("throttle period must be non-zero")
            .allow_burst(NonZeroU32::MIN);
        Self {
            limiter: RateLimiter::dashmap(quota),
            max_tracked_keys,
        }
    }

    /// Record a refusal. `token` is the credential as presented — it is never
    /// logged, only fingerprinted, because a caller can present a secret by
    /// mistake and a refusal must not copy it into the log. `events` is `None`
    /// when the body was refused before it could be counted.
    ///
    /// Always counts; logs at most once per `(credential, type)` per period.
    pub fn refused(
        &self,
        warning: WarningType,
        token: Option<&str>,
        source: &'static str,
        events: Option<u64>,
    ) {
        let fingerprint = token
            .map(fingerprint)
            .unwrap_or_else(|| NO_CREDENTIAL.into());
        let outcome = self.check(&fingerprint, warning);

        counter!(
            CAPTURE_INGESTION_WARNINGS_TOTAL,
            "type" => warning.as_str(),
            "source" => source,
            "outcome" => outcome,
        )
        .increment(1);

        if outcome == "emitted" {
            warn!(
                warning = warning.as_str(),
                source = source,
                credential = %fingerprint,
                events = ?events,
                "ingest refused: {}",
                warning.as_str()
            );
        }
    }

    fn check(&self, fingerprint: &str, warning: WarningType) -> &'static str {
        // Governor's keyed limiter inserts on lookup, so the cap must gate every
        // check — including keys already tracked — to stay O(1).
        if self.limiter.len() >= self.max_tracked_keys {
            return "cardinality_capped";
        }
        match self.limiter.check_key(&(fingerprint.to_owned(), warning)) {
            Ok(()) => "emitted",
            Err(_) => "throttled",
        }
    }

    /// Drop fully-refilled keys, bounding memory. Without this the map only
    /// grows, and once it reaches the cap warnings stop for good.
    pub fn sweep(&self) {
        self.limiter.retain_recent();
        self.limiter.shrink_to_fit();
    }

    /// Sweep forever. Spawned once by the server, mirroring
    /// `OverflowLimiter::clean_state`.
    pub async fn clean_state(&self) {
        // Jitter so replicas do not all sweep on the same tick.
        let interval_secs = rand::thread_rng().gen_range(60..70);
        let mut interval = tokio::time::interval(Duration::from_secs(interval_secs));
        loop {
            interval.tick().await;
            self.sweep();
        }
    }

    pub fn tracked_keys(&self) -> usize {
        self.limiter.len()
    }
}

/// Stable, non-reversible handle for a credential: enough to count distinct
/// offenders and correlate across log lines, not enough to replay.
fn fingerprint(token: &str) -> String {
    let digest = Sha256::digest(token.as_bytes());
    hex_prefix(&digest, 12)
}

fn hex_prefix(bytes: &[u8], chars: usize) -> String {
    bytes
        .iter()
        .flat_map(|b| [b >> 4, b & 0x0f])
        .take(chars)
        .map(|nibble| char::from_digit(nibble as u32, 16).unwrap())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::token::InvalidTokenReason;

    fn warnings() -> Warnings {
        Warnings::new(Duration::from_secs(3600), MAX_TRACKED_KEYS)
    }

    #[test]
    fn only_credential_refusals_warn() {
        assert_eq!(
            WarningType::for_error(&CaptureError::NoTokenError),
            Some(WarningType::IngestKeyRequired)
        );
        assert_eq!(
            WarningType::for_error(&CaptureError::UnknownToken),
            Some(WarningType::IngestKeyUnknown)
        );
        assert_eq!(
            WarningType::for_error(&CaptureError::TokenValidationError(
                InvalidTokenReason::PersonalApiKey
            )),
            Some(WarningType::IngestKeyUnknown)
        );

        // Payload defects are the caller's to fix, and stay off the operator plane.
        for err in [
            CaptureError::EmptyBatch,
            CaptureError::MissingEventName,
            CaptureError::MissingDistinctId,
            CaptureError::BillingLimit,
            CaptureError::RateLimited,
        ] {
            assert_eq!(WarningType::for_error(&err), None, "{err} must not warn");
        }
    }

    #[test]
    fn first_refusal_emits_then_throttles_per_key() {
        let w = warnings();
        let fp = fingerprint("pk-a");

        assert_eq!(w.check(&fp, WarningType::IngestKeyUnknown), "emitted");
        assert_eq!(w.check(&fp, WarningType::IngestKeyUnknown), "throttled");

        // A different type and a different credential are independent budgets,
        // so one noisy caller cannot mask another.
        assert_eq!(w.check(&fp, WarningType::IngestKeyRequired), "emitted");
        assert_eq!(
            w.check(&fingerprint("pk-b"), WarningType::IngestKeyUnknown),
            "emitted"
        );
    }

    #[test]
    fn cardinality_cap_stops_growth() {
        let w = Warnings::new(Duration::from_secs(3600), 2);
        assert_eq!(w.check("k1", WarningType::IngestKeyUnknown), "emitted");
        assert_eq!(w.check("k2", WarningType::IngestKeyUnknown), "emitted");
        assert_eq!(
            w.check("k3", WarningType::IngestKeyUnknown),
            "cardinality_capped"
        );
        assert_eq!(w.tracked_keys(), 2);
    }

    #[test]
    fn fingerprint_hides_the_credential() {
        let secret = "sk-personal_key_that_must_not_be_logged";
        let fp = fingerprint(secret);

        assert_eq!(fp.len(), 12);
        assert!(!secret.contains(&fp), "fingerprint must not be a substring");
        assert!(fp.chars().all(|c| c.is_ascii_hexdigit()));
        assert_eq!(fp, fingerprint(secret), "must be stable for correlation");
        assert_ne!(fp, fingerprint("pk-other"));
    }

    #[test]
    fn missing_credential_has_its_own_key() {
        let w = warnings();
        assert_eq!(
            w.check(NO_CREDENTIAL, WarningType::IngestKeyRequired),
            "emitted"
        );
        assert_eq!(
            w.check(NO_CREDENTIAL, WarningType::IngestKeyRequired),
            "throttled"
        );
    }
}
