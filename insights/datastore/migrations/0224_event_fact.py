"""Superseded by the ingestion bridge. Kept for numbering; does nothing.

This migration re-pointed `event_mv`, `user_mv` and `user_alias_mv` at `event.fact`. Events no longer reach
`insights.events` through views over the warehouse: cloud's `/v1/event` bridge
(hanzo-inc/cloud apps/event/bridge.go) files each event to Kafka
`events_plugin_ingestion`, insights-ingestion processes persons and properties,
and the Kafka-engine tables write the rows. A view over `event.fact` beside that
path files every event twice, so no deployment builds one.

The operations are emptied rather than the file deleted because the number is
recorded on existing deployments. The projection code stays in
`insights/models/event/plane.py` for its history.
"""

operations = []
