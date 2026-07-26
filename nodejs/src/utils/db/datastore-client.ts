// Re-export @datastore/client types under Datastore names.
// All source files MUST import from this module, never from @datastore/client directly.
import { DatastoreClient, createClient } from '@datastore/client'

export type DatastoreNativeClient = DatastoreClient
export const createDatastoreNativeClient = createClient
