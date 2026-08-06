---
name: writing-datastore-queries
description: Guide for writing performant Datastore queries in Insights product code. Use when writing InsightsQL query runners, designing a Datastore table for a new product, adding materialized columns or skip indexes, or choosing a row ID format. For optimizing an existing query that is already too slow, use `/optimizing-datastore-and-insightsql-queries` instead.
---

# Writing Datastore queries for new products

**If you're optimizing an existing query rather than writing a new one**, this is the wrong skill. Use [`/optimizing-datastore-and-insightsql-queries`](../optimizing-datastore-and-insightsql-queries/SKILL.md) instead. That skill covers layer triage, smell scanning (`FROM ... FINAL`, `JSONExtract` over properties, missing skip indexes, self-joins, CTE blow-up), measurement on the Test Cluster, and applying the fix at the right layer.

Read [`docs/published/handbook/engineering/databases/datastore-queries-new-products.md`](../../../docs/published/handbook/engineering/databases/datastore-queries-new-products.md) for the authoritative guide on writing new queries.

Then pull in whichever related docs the task touches:

- [`insightsql-python.md`](../../../docs/published/handbook/engineering/databases/insightsql-python.md) for InsightsQL in Python
- [`materialized-columns.md`](../../../docs/published/handbook/engineering/databases/materialized-columns.md)
- [`query-performance-optimization.md`](../../../docs/published/handbook/engineering/databases/query-performance-optimization.md)

## When to use

- Writing or reviewing a `QueryRunner` subclass in `insights/insightsql_queries/` or `products/*/backend/`
- Adding a new Datastore table or ALTER for a product (`insights/datastore/migrations/`)
- Choosing a row ID format for a new table
- Adding or removing materialized columns, skip indexes, or projections

For investigating an existing slow query, debugging a `system.query_log` row, or reviewing a proposed InsightsQL printer change for performance, use [`/optimizing-datastore-and-insightsql-queries`](../optimizing-datastore-and-insightsql-queries/SKILL.md).

Not the right skill for: customer-facing ad-hoc InsightsQL via Max / `insights:execute-sql`, use `query-examples` for that. For migration mechanics (node roles, engines, replication), use `datastore-migrations`.
