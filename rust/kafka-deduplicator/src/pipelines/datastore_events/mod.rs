//! Datastore events pipeline implementation.
//!
//! This module contains the deduplication logic for events from the
//! `datastore_events_json` Kafka topic (output of the ingestion pipeline).
//!
//! # Event Type
//!
//! - `DatastoreEvent` - Events that have been processed by the ingestion
//!   pipeline and are ready to be written to Datastore
//!
//! # Deduplication Strategy
//!
//! This pipeline uses timestamp-based deduplication:
//! - Events are keyed by (timestamp, event_name, distinct_id, team_id)
//! - Duplicates are detected by matching these fields

mod keys;
mod metadata;
mod parser;
mod processor;
mod similarity;

use common_types::DatastoreEvent;

pub use metadata::DatastoreEventMetadata;
pub use parser::DatastoreEventParser;
pub use processor::{DatastoreEventsBatchProcessor, DatastoreEventsConfig};

use crate::pipelines::timestamp_deduplicator::DeduplicatableEvent;

impl DeduplicatableEvent for DatastoreEvent {
    type Metadata = DatastoreEventMetadata;

    fn has_same_uuid(&self, metadata: &Self::Metadata) -> bool {
        metadata.is_same_uuid(self)
    }
}
