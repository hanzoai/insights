use common_continuous_profiling::ContinuousProfilingConfig;
use common_kafka::config::{ConsumerConfig, KafkaConfig};
use envconfig::Envconfig;

#[derive(Envconfig, Clone)]
pub struct Config {
    #[envconfig(nested = true)]
    pub continuous_profiling: ContinuousProfilingConfig,

    #[envconfig(from = "BIND_HOST", default = "::")]
    pub host: String,

    #[envconfig(from = "BIND_PORT", default = "3305")]
    pub port: u16,

    pub insights_api_key: Option<String>,

    #[envconfig(default = "https://us.i.hanzo.ai/capture")]
    pub insights_endpoint: String,

    #[envconfig(nested = true)]
    pub kafka: KafkaConfig,

    // To other services, like ET, that want to take some action after a document is embedded and written to CH
    #[envconfig(default = "document_embedding_results")]
    pub response_topic: String,

    // To datastore
    #[envconfig(default = "datastore_document_embeddings")]
    pub output_topic: String,

    #[envconfig(nested = true)]
    pub consumer: ConsumerConfig,

    #[envconfig(default = "postgres://insights:insights@localhost:5432/insights")]
    pub database_url: String,

    pub openai_api_key: String,

    // Rust service connect directly to postgres, not via pgbouncer, so we keep this low
    #[envconfig(default = "4")]
    pub max_pg_connections: u32,

    #[envconfig(default = "1000")]
    pub max_events_per_batch: usize,

    #[envconfig(default = "10")]
    pub max_event_batch_wait_seconds: u64,

    // Per-request timeout for calls to the embedding provider, covering the whole
    // request (connect through response body). Bounds a slow/hung request so it
    // can't stall batch processing indefinitely.
    #[envconfig(default = "10")]
    pub embedding_request_timeout_seconds: u64,
}

impl Config {
    pub fn init_with_defaults() -> Result<Self, envconfig::Error> {
        // Our consumer is used in a transaction, so we disable offset commits.
        ConsumerConfig::set_defaults("embedding-worker", "document_embeddings_input", false);

        Self::init_from_env()
    }
}
