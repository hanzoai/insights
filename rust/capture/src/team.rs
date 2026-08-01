//! Token → team resolution: the ONE positive allow-list seam for capture ingest.
//!
//! A capture ingest token is a project's PUBLIC API key — it travels in browser
//! JS, so knowing one proves nothing. Shape validation (`token::validate_token`)
//! only checks the token looks like a key; a well-formed but FORGED token used to
//! be accepted and stored under its own partition (and, for AI, keyed an S3 blob
//! by `hash(token)` — a tenant an attacker picks). That is a DENY-list posture.
//!
//! This module flips it to an ALLOW-list: a token is accepted ONLY if it resolves
//! to a real team server-side. The seam is the [`TeamResolver`] trait; the
//! production implementation reads the team the Django app already publishes to
//! the shared KV on every Team save
//! (`insights/models/team/team_caching.py::set_team_in_cache`), so an unknown /
//! forged / revoked token resolves to nothing and is REJECTED. The resolved
//! `team_id` is the SERVER-authoritative tenant the AI blob store is keyed by,
//! replacing the attacker-chosen `hash(public token)`.

use std::sync::Arc;

use async_trait::async_trait;
use common_redis::{Client, CustomRedisError};
use common_types::TeamId;
use serde::Deserialize;

/// Redis key the Django app writes the project's team under, on every Team save
/// (`insights/models/team/team_caching.py`: `cache.set(f"team_token:{token}", …)`).
/// Django's cache namespaces every key as `<KEY_PREFIX>:<VERSION>:<key>`;
/// `insights/settings/data_stores.py` sets `KEY_PREFIX = "insights"` and does not
/// override the default `VERSION = 1`, so the on-wire key is
/// `insights:1:team_token:<token>`. This mirrors the invariant the feature-flags
/// crate depends on (data_stores.py: "If any of these settings change, make sure
/// the feature-flags crate is updated accordingly") — the same must hold here.
const TEAM_TOKEN_KEY_PREFIX: &str = "insights:1:team_token:";

/// Why a token did not resolve to a team. The two arms carry DIFFERENT trust
/// meaning, so each ingest path can pick its own fail posture rather than one
/// global default (the audit's fail-OPEN-on-staleness bug was a single global
/// default applied to PII).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TeamResolveError {
    /// The token is well-formed but maps to NO team — a forged, unknown, or
    /// revoked project key. This is an authorization fact: REJECT it everywhere.
    Unknown,
    /// The seam could not be consulted (KV unreachable/timeout, or a corrupt
    /// cache value). This is an availability fact, NOT proof the token is bad, so
    /// the caller chooses: fail-CLOSED for PII (recordings/AI), fail-open for the
    /// high-volume analytics path (never turn a KV blip into a total ingest
    /// outage, and a forged token is still rejected whenever the KV is healthy).
    Unavailable,
}

/// The token → team seam. One trait, one job: turn a caller-supplied project
/// token into the server-authoritative team id, or say why it could not.
#[async_trait]
pub trait TeamResolver: Send + Sync {
    async fn resolve(&self, token: &str) -> Result<TeamId, TeamResolveError>;
}

/// Only the team id is needed to scope ingest; every other field the Django
/// serializer writes is ignored (serde drops unknown fields by default), so this
/// stays decoupled from the full team shape.
#[derive(Deserialize)]
struct CachedTeam {
    id: TeamId,
}

/// Production resolver over the Django-populated `team_token:` cache. It reuses
/// the exact django_redis decode `common/hypercache` already runs for
/// feature-flags: `get_raw_bytes` transparently zstd-decompresses, the value is
/// `Pickle(JSON)`, and the JSON carries the team.
pub struct KvTeamResolver {
    redis: Arc<dyn Client + Send + Sync>,
}

impl KvTeamResolver {
    pub fn new(redis: Arc<dyn Client + Send + Sync>) -> Self {
        Self { redis }
    }
}

#[async_trait]
impl TeamResolver for KvTeamResolver {
    async fn resolve(&self, token: &str) -> Result<TeamId, TeamResolveError> {
        let key = format!("{TEAM_TOKEN_KEY_PREFIX}{token}");
        match self.redis.get_raw_bytes(key).await {
            Ok(bytes) => {
                // Pickle(JSON): the redis client already handled zstd. A decode
                // failure is a CORRUPT cache entry, not a forged token, so it is
                // Unavailable — a poisoned cache must never silently REJECT a real
                // team's live traffic as though the token were forged.
                let json = serde_pickle::from_slice::<String>(&bytes, Default::default())
                    .map_err(|_| TeamResolveError::Unavailable)?;
                let team: CachedTeam =
                    serde_json::from_str(&json).map_err(|_| TeamResolveError::Unavailable)?;
                Ok(team.id)
            }
            // Empty / missing key ⇒ this token belongs to no team ⇒ forged/unknown.
            Err(CustomRedisError::NotFound) => Err(TeamResolveError::Unknown),
            // KV down / timeout ⇒ availability, not authorization.
            Err(_) => Err(TeamResolveError::Unavailable),
        }
    }
}

/// A resolver that maps EVERY token to one fixed team. It is the ingest analogue
/// of [`crate::ai_s3::MockBlobStorage`]: a deterministic, dependency-free double
/// for tests (and single-tenant/dev deployments where the KV team cache is not
/// populated). Because it treats every token as "known", it makes the positive
/// allow-list a no-op and MUST NEVER be wired into a multi-tenant production path.
pub struct StaticTeamResolver {
    team_id: TeamId,
}

impl StaticTeamResolver {
    pub fn new(team_id: TeamId) -> Self {
        Self { team_id }
    }
}

#[async_trait]
impl TeamResolver for StaticTeamResolver {
    async fn resolve(&self, _token: &str) -> Result<TeamId, TeamResolveError> {
        Ok(self.team_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use common_redis::MockRedisClient;

    // Mirror what django_redis writes: the value is Pickle(json_string). The mock
    // returns raw bytes unchanged (the real client's zstd step is a no-op on
    // uncompressed pickle, so both paths decode identically).
    fn cached(json: &str) -> Vec<u8> {
        serde_pickle::to_vec(&json.to_string(), Default::default()).unwrap()
    }

    fn resolver(key: &str, ret: Result<Vec<u8>, CustomRedisError>) -> KvTeamResolver {
        let mock = MockRedisClient::new().get_raw_bytes_ret(key, ret);
        KvTeamResolver::new(Arc::new(mock))
    }

    #[tokio::test]
    async fn known_token_resolves_to_team_id() {
        let r = resolver(
            "insights:1:team_token:phc_valid",
            Ok(cached(r#"{"id":42,"project_id":42,"api_token":"phc_valid","name":"Acme"}"#)),
        );
        assert_eq!(r.resolve("phc_valid").await, Ok(42));
    }

    #[tokio::test]
    async fn unknown_token_is_rejected() {
        // Cache miss (NotFound) is the forged / unknown / revoked token signal.
        let r = resolver(
            "insights:1:team_token:phc_forged",
            Err(CustomRedisError::NotFound),
        );
        assert_eq!(r.resolve("phc_forged").await, Err(TeamResolveError::Unknown));
    }

    #[tokio::test]
    async fn kv_timeout_is_unavailable_not_unknown() {
        // A KV outage must NOT masquerade as a forged token (that would let a
        // blip fail-closed the whole analytics path); the caller decides posture.
        let r = resolver(
            "insights:1:team_token:phc_x",
            Err(CustomRedisError::Timeout),
        );
        assert_eq!(r.resolve("phc_x").await, Err(TeamResolveError::Unavailable));
    }

    #[tokio::test]
    async fn corrupt_cache_value_is_unavailable_not_unknown() {
        let r = resolver(
            "insights:1:team_token:phc_c",
            Ok(b"not-valid-pickle".to_vec()),
        );
        assert_eq!(r.resolve("phc_c").await, Err(TeamResolveError::Unavailable));
    }

    #[tokio::test]
    async fn wrong_prefix_is_a_miss() {
        // Proves the exact Django key is used: seeding the un-prefixed key resolves
        // to nothing (NotFound), so only the real `insights:1:team_token:` key hits.
        let mock = MockRedisClient::new()
            .get_raw_bytes_ret("team_token:phc_valid", Ok(cached(r#"{"id":7}"#)));
        let r = KvTeamResolver::new(Arc::new(mock));
        assert_eq!(r.resolve("phc_valid").await, Err(TeamResolveError::Unknown));
    }
}
