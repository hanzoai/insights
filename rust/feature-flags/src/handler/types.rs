use axum::{extract::State, http::HeaderMap};
use bytes::Bytes;
use chrono_tz::Tz;
use serde::Serialize;
use serde_json::Value;
use std::{
    collections::HashMap,
    fmt,
    net::IpAddr,
    sync::{Arc, OnceLock},
};
use uuid::Uuid;

use crate::{
    api::types::FlagsQueryParams,
    cohorts::{cohort_cache_manager::CohortCacheManager, membership::CohortMembershipProvider},
    flags::{flag_group_type_mapping::GroupTypeCacheManager, flag_models::FeatureFlagList},
    rayon_dispatcher::RayonDispatcher,
    router,
    utils::user_agent::UserAgentInfo,
};

pub struct RequestContext {
    /// Shared state holding services (DB, Redis, GeoIP, etc.)
    pub state: State<router::State>,

    /// Client IP
    pub ip: IpAddr,

    /// HTTP headers
    pub headers: HeaderMap,

    /// Query params (contains compression, library version, etc.)
    pub meta: FlagsQueryParams,

    /// Raw request body
    pub body: Bytes,

    /// Request ID
    pub request_id: Uuid,

    /// Side channel for body logging: when at least one team is opted into
    /// `BodyLogger`, the endpoint installs an `Arc<OnceLock<Bytes>>` here and
    /// keeps a clone. The decode step in `parse_and_authenticate` fills it
    /// with the decoded body (post gzip + post base64). After the handler
    /// completes, the endpoint reads from its clone and hands the bytes to
    /// `BodyLogger::log_response`. This avoids decoding the body twice and
    /// also ensures base64-wrapped bodies are logged as the JSON they
    /// actually parsed as, not as the base64 string.
    pub decoded_body_for_logging: Option<Arc<OnceLock<Bytes>>>,
}

/// Represents the various property overrides that can be passed around
/// (person, group, groups, and optional hash key).
#[derive(Debug, Clone)]
pub struct RequestPropertyOverrides {
    pub person_properties: Option<HashMap<String, Value>>,
    pub group_properties: Option<HashMap<String, HashMap<String, Value>>>,
    pub groups: Option<HashMap<String, Value>>,
    pub hash_key: Option<String>,
}

/// Represents all context required for evaluating a set of feature flags.
pub struct FeatureFlagEvaluationContext {
    pub team_id: i32,
    /// Team timezone, used to interpret naive datetime filter values consistently
    /// with InsightsQL/Datastore cohort evaluation.
    pub team_timezone: Tz,
    pub distinct_id: String,
    pub device_id: Option<String>,
    pub feature_flags: FeatureFlagList,
    pub persons_reader: Arc<dyn common_database::Client + Send + Sync>,
    pub persons_writer: Arc<dyn common_database::Client + Send + Sync>,
    pub non_persons_reader: Arc<dyn common_database::Client + Send + Sync>,
    pub non_persons_writer: Arc<dyn common_database::Client + Send + Sync>,
    pub cohort_cache: Arc<CohortCacheManager>,
    pub group_type_cache: Arc<GroupTypeCacheManager>,
    pub person_property_overrides: Option<HashMap<String, Value>>,
    pub group_property_overrides: Option<HashMap<String, HashMap<String, Value>>>,
    pub groups: Option<HashMap<String, Value>>,
    pub hash_key_override: Option<String>,
    /// Contains explicitly requested flag keys and their dependencies. If empty, all flags will be evaluated.
    pub flag_keys: Option<Vec<String>>,
    /// When true, skip hash key override lookups for flags that don't need them
    /// (e.g., 100% rollout with no multivariate variants).
    pub optimize_experience_continuity_lookups: bool,
    /// Flag count threshold for switching from sequential to parallel evaluation.
    pub parallel_eval_threshold: usize,
    /// Dispatcher for bounded-concurrency Rayon batch evaluation.
    pub rayon_dispatcher: RayonDispatcher,
    /// When true, skip all writes to PostgreSQL and Redis.
    pub skip_writes: bool,
    /// Provider for realtime/behavioral cohort membership lookups.
    pub cohort_membership_provider: Arc<dyn CohortMembershipProvider>,
    /// Whether to enable realtime cohort evaluation.
    pub enable_realtime_cohort_evaluation: bool,
    /// Whether to include detailed condition analysis in flag evaluation results.
    pub detailed_analysis: bool,
    /// Whether to only use person properties from request payload, ignoring database properties.
    pub only_use_override_person_properties: bool,
}

/// SDK type classification based on user-agent parsing.
/// Used for billing breakdown and usage analytics.
///
/// This enum leverages [`UserAgentInfo`] for SDK detection to avoid code
/// duplication, adding sec-fetch header detection for browser identification.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum Library {
    /// insights-js (web browsers)
    InsightsJs,
    /// insights-node SDK (server-side Node.js)
    InsightsNode,
    /// insights-python SDK
    InsightsPython,
    /// insights-php SDK
    InsightsPhp,
    /// insights-ruby SDK
    InsightsRuby,
    /// insights-go SDK
    InsightsGo,
    /// insights-java SDK
    InsightsJava,
    /// insights-dotnet SDK
    InsightsDotnet,
    /// insights-elixir SDK
    InsightsElixir,
    /// insights-rs SDK
    InsightsRs,
    /// insights-android SDK
    InsightsAndroid,
    /// insights-ios SDK
    InsightsIos,
    /// insights-react-native SDK
    InsightsReactNative,
    /// insights-flutter SDK
    InsightsFlutter,
    /// insights-server SDK (deprecated: users are migrating to insights-java)
    InsightsServer,
    /// Unknown or unrecognized SDK
    Other,
}

impl Library {
    /// Returns the canonical string representation of this library.
    ///
    /// This is the single source of truth for SDK name strings, used by both
    /// `Display` and `from_sdk_name()` to ensure consistency.
    pub const fn as_str(&self) -> &'static str {
        match self {
            Library::InsightsJs => "insights-js",
            Library::InsightsNode => "insights-node",
            Library::InsightsPython => "insights-python",
            Library::InsightsPhp => "insights-php",
            Library::InsightsRuby => "insights-ruby",
            Library::InsightsGo => "insights-go",
            Library::InsightsJava => "insights-java",
            Library::InsightsDotnet => "insights-dotnet",
            Library::InsightsElixir => "insights-elixir",
            Library::InsightsRs => "insights-rs",
            Library::InsightsAndroid => "insights-android",
            Library::InsightsIos => "insights-ios",
            Library::InsightsReactNative => "insights-react-native",
            Library::InsightsFlutter => "insights-flutter",
            Library::InsightsServer => "insights-server",
            Library::Other => "other",
        }
    }

    /// All known library variants (excluding Other).
    ///
    /// Used by tests to verify that all SDK names from UserAgentInfo are recognized.
    pub const ALL_KNOWN: &'static [Library] = &[
        Library::InsightsJs,
        Library::InsightsNode,
        Library::InsightsPython,
        Library::InsightsPhp,
        Library::InsightsRuby,
        Library::InsightsGo,
        Library::InsightsJava,
        Library::InsightsDotnet,
        Library::InsightsElixir,
        Library::InsightsRs,
        Library::InsightsAndroid,
        Library::InsightsIos,
        Library::InsightsReactNative,
        Library::InsightsFlutter,
        Library::InsightsServer,
    ];
}

impl fmt::Display for Library {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl Library {
    /// Detect SDK type from HTTP headers, primarily the User-Agent.
    ///
    /// This function uses [`UserAgentInfo`] for SDK detection, with additional
    /// browser detection via sec-fetch headers (which cannot be spoofed by
    /// server-side code).
    ///
    /// # Examples
    ///
    /// ```
    /// use axum::http::HeaderMap;
    /// use feature_flags::handler::types::Library;
    ///
    /// let mut headers = HeaderMap::new();
    /// headers.insert("user-agent", "insights-node/3.1.0".parse().unwrap());
    /// assert_eq!(Library::from_headers(&headers), Library::InsightsNode);
    /// ```
    pub fn from_headers(headers: &HeaderMap) -> Self {
        let user_agent = headers.get("user-agent").and_then(|v| v.to_str().ok());

        // Use UserAgentInfo for SDK detection (avoids duplicating parsing logic)
        let ua_info = UserAgentInfo::parse(user_agent);

        // Map SDK name to Library enum variant
        if let Some(sdk_name) = ua_info.sdk_name {
            return Self::from_sdk_name(sdk_name);
        }

        // UserAgentInfo detected a browser via user-agent patterns
        if ua_info.is_browser {
            return Library::InsightsJs;
        }

        // Check for unrecognized insights-* SDKs (must come before sec-fetch check)
        // This prevents custom SDKs like "insights-custom/1.0" from being
        // misclassified as browsers
        if user_agent.is_some_and(|ua| ua.starts_with("insights-")) {
            return Library::Other;
        }

        // Additional browser detection via sec-fetch headers
        // These headers are browser-only and cannot be spoofed by server-side code
        if headers.get("sec-fetch-mode").is_some() || headers.get("sec-fetch-site").is_some() {
            return Library::InsightsJs;
        }

        Library::Other
    }

    /// Convert SDK name string to Library enum variant.
    ///
    /// Uses `as_str()` as the source of truth to ensure consistency between
    /// parsing and serialization.
    pub(crate) fn from_sdk_name(sdk_name: &str) -> Self {
        // insights-js reports its library as "web" in request body properties.
        if sdk_name == "web" {
            return Library::InsightsJs;
        }

        // Check all known variants using as_str() as the source of truth
        for lib in Self::ALL_KNOWN {
            if lib.as_str() == sdk_name {
                return *lib;
            }
        }
        Library::Other
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderMap;
    use rstest::rstest;

    fn make_headers_with_user_agent(ua: &str) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert("user-agent", ua.parse().unwrap());
        headers
    }

    #[rstest]
    // Server-side SDKs
    #[case("insights-node/3.1.0", Library::InsightsNode)]
    #[case("insights-python/2.5.0", Library::InsightsPython)]
    #[case("insights-php/3.0.0", Library::InsightsPhp)]
    #[case("insights-ruby/2.3.0", Library::InsightsRuby)]
    #[case("insights-ruby2.3.0", Library::InsightsRuby)]
    #[case("insights-go/1.0.0", Library::InsightsGo)]
    #[case("insights-java/1.2.0", Library::InsightsJava)]
    #[case("insights-dotnet/1.0.0", Library::InsightsDotnet)]
    #[case("insights-elixir/0.2.0", Library::InsightsElixir)]
    #[case("insights-rs/0.10.0", Library::InsightsRs)]
    #[case("insights-server/1.0.0", Library::InsightsServer)]
    #[case("insights-server/3.2.1 (Android SDK)", Library::InsightsServer)]
    // Client-side SDKs
    #[case("insights-js/1.88.0", Library::InsightsJs)]
    #[case("insights-android/3.0.0", Library::InsightsAndroid)]
    #[case("insights-ios/3.1.0", Library::InsightsIos)]
    #[case("insights-react-native/2.0.0", Library::InsightsReactNative)]
    #[case("insights-flutter/2.0.0", Library::InsightsFlutter)]
    // Browser user-agents (detected as insights-js)
    #[case("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", Library::InsightsJs)]
    #[case(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
        Library::InsightsJs
    )]
    #[case("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15", Library::InsightsJs)]
    // Unrecognized insights SDKs → Other (not misclassified as browsers)
    #[case("insights-custom/1.0 Chrome/91.0 Safari/537.36", Library::Other)]
    // Unknown clients → Other
    #[case("some-random-client/1.0", Library::Other)]
    #[case("curl/7.68.0", Library::Other)]
    #[case("python-requests/2.28.0", Library::Other)]
    fn test_library_from_user_agent(#[case] user_agent: &str, #[case] expected: Library) {
        let headers = make_headers_with_user_agent(user_agent);
        assert_eq!(Library::from_headers(&headers), expected);
    }

    #[test]
    fn test_library_other_with_origin_header_only() {
        // origin/referer headers alone don't indicate browser (can be set by servers)
        let mut headers = HeaderMap::new();
        headers.insert("user-agent", "some-custom-client".parse().unwrap());
        headers.insert("origin", "https://example.com".parse().unwrap());
        assert_eq!(Library::from_headers(&headers), Library::Other);
    }

    #[test]
    fn test_library_other_with_referer_header_only() {
        // origin/referer headers alone don't indicate browser (can be set by servers)
        let mut headers = HeaderMap::new();
        headers.insert("user-agent", "some-custom-client".parse().unwrap());
        headers.insert("referer", "https://example.com/page".parse().unwrap());
        assert_eq!(Library::from_headers(&headers), Library::Other);
    }

    #[test]
    fn test_library_browser_with_sec_fetch_mode_header() {
        // sec-fetch-mode header indicates browser
        let mut headers = HeaderMap::new();
        headers.insert("user-agent", "some-custom-client".parse().unwrap());
        headers.insert("sec-fetch-mode", "navigate".parse().unwrap());
        assert_eq!(Library::from_headers(&headers), Library::InsightsJs);
    }

    #[test]
    fn test_library_browser_with_sec_fetch_site_header() {
        // sec-fetch-site header also indicates browser
        let mut headers = HeaderMap::new();
        headers.insert("user-agent", "some-custom-client".parse().unwrap());
        headers.insert("sec-fetch-site", "same-origin".parse().unwrap());
        assert_eq!(Library::from_headers(&headers), Library::InsightsJs);
    }

    #[test]
    fn test_library_other_missing_user_agent() {
        let headers = HeaderMap::new();
        assert_eq!(Library::from_headers(&headers), Library::Other);
    }

    #[test]
    fn test_library_other_empty_user_agent() {
        let headers = make_headers_with_user_agent("");
        assert_eq!(Library::from_headers(&headers), Library::Other);
    }

    #[rstest]
    #[case(Library::InsightsJs, "insights-js")]
    #[case(Library::InsightsNode, "insights-node")]
    #[case(Library::InsightsPython, "insights-python")]
    #[case(Library::InsightsPhp, "insights-php")]
    #[case(Library::InsightsRuby, "insights-ruby")]
    #[case(Library::InsightsGo, "insights-go")]
    #[case(Library::InsightsJava, "insights-java")]
    #[case(Library::InsightsDotnet, "insights-dotnet")]
    #[case(Library::InsightsElixir, "insights-elixir")]
    #[case(Library::InsightsRs, "insights-rs")]
    #[case(Library::InsightsAndroid, "insights-android")]
    #[case(Library::InsightsIos, "insights-ios")]
    #[case(Library::InsightsReactNative, "insights-react-native")]
    #[case(Library::InsightsFlutter, "insights-flutter")]
    #[case(Library::InsightsServer, "insights-server")]
    #[case(Library::Other, "other")]
    fn test_library_display(#[case] library: Library, #[case] expected: &str) {
        assert_eq!(library.to_string(), expected);
    }

    #[rstest]
    #[case(Library::InsightsJs, "\"insights-js\"")]
    #[case(Library::InsightsNode, "\"insights-node\"")]
    #[case(Library::InsightsPython, "\"insights-python\"")]
    #[case(Library::InsightsPhp, "\"insights-php\"")]
    #[case(Library::InsightsRuby, "\"insights-ruby\"")]
    #[case(Library::InsightsGo, "\"insights-go\"")]
    #[case(Library::InsightsJava, "\"insights-java\"")]
    #[case(Library::InsightsDotnet, "\"insights-dotnet\"")]
    #[case(Library::InsightsElixir, "\"insights-elixir\"")]
    #[case(Library::InsightsRs, "\"insights-rs\"")]
    #[case(Library::InsightsAndroid, "\"insights-android\"")]
    #[case(Library::InsightsIos, "\"insights-ios\"")]
    #[case(Library::InsightsReactNative, "\"insights-react-native\"")]
    #[case(Library::InsightsFlutter, "\"insights-flutter\"")]
    #[case(Library::InsightsServer, "\"insights-server\"")]
    #[case(Library::Other, "\"other\"")]
    fn test_library_serialization(#[case] library: Library, #[case] expected_json: &str) {
        assert_eq!(serde_json::to_string(&library).unwrap(), expected_json);
    }

    #[test]
    fn test_from_sdk_name_roundtrip() {
        // Verify that from_sdk_name correctly recognizes all SDK names from as_str()
        for lib in Library::ALL_KNOWN {
            let sdk_name = lib.as_str();
            let parsed = Library::from_sdk_name(sdk_name);
            assert_eq!(
                parsed, *lib,
                "from_sdk_name({sdk_name}) should return {lib:?}"
            );
        }
    }

    #[test]
    fn test_from_sdk_name_maps_web_to_insights_js() {
        assert_eq!(Library::from_sdk_name("web"), Library::InsightsJs);
    }

    #[test]
    fn test_from_sdk_name_unknown_returns_other() {
        assert_eq!(Library::from_sdk_name("unknown-sdk"), Library::Other);
        assert_eq!(Library::from_sdk_name("insights-custom"), Library::Other);
        assert_eq!(Library::from_sdk_name(""), Library::Other);
    }
}
