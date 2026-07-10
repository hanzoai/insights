//! Hanzo IAM personal-API-key validation via RFC 7662 token introspection.
//!
//! Hanzo-stack replacement for the upstream Postgres `personalapikey` lookup used by
//! `/api/feature_flag/local_evaluation`. ONLY the *personal* key path is swapped here —
//! project (secret `phs_*`) tokens stay Redis-cached team lookups (see `api::auth`).
//!
//! Enabled by `PERSONAL_API_KEY_BACKEND=iam` + `HANZO_IAM_URL`. Default stays `postgres`.
//!
//! Endpoint: `POST {hanzo_iam_url}/v1/iam/oauth/introspect` (Hanzo IAM
//! `controllers.IntrospectToken`, RFC 7662). We map the introspection response onto
//! the same [`TokenAuthData::Personal`] the Postgres loader produces, so the downstream
//! scope/org checks in [`crate::api::auth::validate_personal_api_key_with_scopes_for_team`]
//! are identical for both backends.

use crate::api::auth::TokenAuthData;
use crate::api::errors::FlagError;
use once_cell::sync::Lazy;
use serde::Deserialize;
use std::time::Duration;

/// Shared, pooled HTTP client for IAM introspection. Short timeout — this is on the
/// local_evaluation auth path and must fail fast rather than hang the request.
static IAM_HTTP_CLIENT: Lazy<reqwest::Client> = Lazy::new(|| {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(3))
        .build()
        .expect("failed to build Hanzo IAM HTTP client")
});

/// Subset of the RFC 7662 introspection response that Hanzo IAM returns
/// (`object.IntrospectionResponse`). Unknown fields are ignored.
#[derive(Debug, Clone, Deserialize)]
pub struct IamIntrospection {
    pub active: bool,
    #[serde(default)]
    pub scope: String,
    #[serde(default)]
    pub sub: String,
    #[serde(default)]
    pub jti: String,
    /// Audience — Hanzo IAM carries the token's org identifier(s) here.
    #[serde(default)]
    pub aud: Vec<String>,
}

/// Map a Hanzo IAM introspection response onto [`TokenAuthData::Personal`].
///
/// Pure + unit-tested. Returns `None` for an inactive token (caller surfaces
/// `PersonalApiKeyInvalid` → 401). Scope enforcement (`feature_flag:read/write` or `*`)
/// is applied downstream by `validate_personal_key_metadata`, so we always surface the
/// parsed scope list rather than pre-filtering here.
pub fn introspection_to_personal_auth(resp: &IamIntrospection) -> Option<TokenAuthData> {
    if !resp.active {
        return None;
    }
    let scopes: Vec<String> = resp.scope.split_whitespace().map(str::to_string).collect();
    let key_id = if resp.jti.is_empty() {
        resp.sub.clone()
    } else {
        resp.jti.clone()
    };
    Some(TokenAuthData::Personal {
        user_id: stable_user_id(&resp.sub),
        key_id: Some(key_id),
        org_ids: resp.aud.clone(),
        // HAZARD (why the iam backend is startup-gated behind IAM_AUD_ORG_RECONCILED):
        // RFC 7662 introspection does not carry PostHog-style per-key `scoped_teams` /
        // `scoped_orgs`. Emitting `None` here means "not further restricted", which would
        // WIDEN a team-scoped IAM key to every team in its org(s) — a privilege
        // escalation. Until per-key scoping is carried through introspection, the backend
        // must not run in production (main.rs refuses to start without the reconciled flag).
        scoped_teams: None,
        scoped_orgs: None,
        scopes: Some(scopes),
        current_team_id: None,
    })
}

/// Deterministic non-negative `i32` derived from the IAM subject string.
///
/// PLACEHOLDER: Insights user rows are int-keyed; IAM subjects are opaque strings.
/// This value is used ONLY for PAK last-used debouncing + log correlation, never for
/// authorization (authorization is scope + org based). A real subject→Insights-user
/// mapping is follow-on work (see LLM.md).
fn stable_user_id(sub: &str) -> i32 {
    use sha2::{Digest, Sha256};
    let d = Sha256::digest(sub.as_bytes());
    i32::from_be_bytes([d[0], d[1], d[2], d[3]]) & i32::MAX
}

/// Validate a personal API key against Hanzo IAM via token introspection.
/// `iam_url` is the IAM base URL (e.g. `https://iam.hanzo.ai`).
pub async fn validate_via_iam(iam_url: &str, key: &str) -> Result<Option<TokenAuthData>, FlagError> {
    if iam_url.is_empty() {
        return Err(FlagError::Internal(
            "HANZO_IAM_URL not configured but PERSONAL_API_KEY_BACKEND=iam".to_string(),
        ));
    }
    let endpoint = format!("{}/v1/iam/oauth/introspect", iam_url.trim_end_matches('/'));
    let resp = IAM_HTTP_CLIENT
        .post(&endpoint)
        .form(&[("token", key), ("token_type_hint", "access_token")])
        .send()
        .await
        .map_err(|e| {
            FlagError::Internal(format!("Hanzo IAM introspection request failed: {e}"))
        })?;

    if !resp.status().is_success() {
        return Err(FlagError::Internal(format!(
            "Hanzo IAM introspection returned status {}",
            resp.status()
        )));
    }

    let introspection: IamIntrospection = resp.json().await.map_err(|e| {
        FlagError::Internal(format!("Hanzo IAM introspection decode failed: {e}"))
    })?;

    Ok(introspection_to_personal_auth(&introspection))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn resp(active: bool, scope: &str) -> IamIntrospection {
        IamIntrospection {
            active,
            scope: scope.to_string(),
            sub: "user-abc".to_string(),
            jti: "key-123".to_string(),
            aud: vec!["org-42".to_string()],
        }
    }

    #[test]
    fn inactive_token_maps_to_none() {
        assert!(introspection_to_personal_auth(&resp(false, "feature_flag:read")).is_none());
    }

    #[test]
    fn active_token_maps_scopes_and_identity() {
        let data =
            introspection_to_personal_auth(&resp(true, "feature_flag:read openid")).unwrap();
        match data {
            TokenAuthData::Personal {
                key_id,
                org_ids,
                scopes,
                scoped_teams,
                scoped_orgs,
                ..
            } => {
                assert_eq!(key_id.as_deref(), Some("key-123"));
                assert_eq!(org_ids, vec!["org-42".to_string()]);
                assert_eq!(
                    scopes,
                    Some(vec![
                        "feature_flag:read".to_string(),
                        "openid".to_string()
                    ])
                );
                assert!(scoped_teams.is_none());
                assert!(scoped_orgs.is_none());
            }
            _ => panic!("expected Personal token auth data"),
        }
    }

    #[test]
    fn key_id_falls_back_to_sub_when_jti_empty() {
        let mut r = resp(true, "*");
        r.jti = String::new();
        let data = introspection_to_personal_auth(&r).unwrap();
        match data {
            TokenAuthData::Personal { key_id, .. } => {
                assert_eq!(key_id.as_deref(), Some("user-abc"))
            }
            _ => panic!("expected Personal"),
        }
    }

    #[test]
    fn stable_user_id_is_deterministic_and_non_negative() {
        let a = stable_user_id("user-abc");
        let b = stable_user_id("user-abc");
        assert_eq!(a, b);
        assert!(a >= 0);
        assert_ne!(stable_user_id("user-abc"), stable_user_id("user-xyz"));
    }
}
