// Re-export @clickhouse/client types under Datastore names.
// All source files MUST import from this module, never from @clickhouse/client directly.
import { ClickHouseClient, createClient } from '@clickhouse/client'

export type DatastoreNativeClient = ClickHouseClient
export const createDatastoreNativeClient = createClient
