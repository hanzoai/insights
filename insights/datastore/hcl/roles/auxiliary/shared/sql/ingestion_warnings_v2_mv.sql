SELECT
  team_id,
  source,
  type,
  details,
  timestamp,
  _timestamp,
  _offset,
  _partition
FROM insights.kafka_ingestion_warnings_v2
