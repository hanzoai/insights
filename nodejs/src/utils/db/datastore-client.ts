// The ONE place the datastore driver's published name appears.
//
// This module exists so every other file can say `DatastoreNativeClient` and
// `createDatastoreNativeClient` — our vocabulary — while exactly one import names
// the package npm actually serves. All source files MUST import from here, never
// from the driver directly.
//
// The Hanzo-vocabulary rename edited this line too, to `@datastore/client`, and
// no such package exists: tsc could not resolve it and exited 2, taking
// `bin/turbo --filter=@hanzo/nodejs build` with it — half of why the
// insights-plugin image could not be produced at all. The other half was the same
// substitution applied to the cargo dependency in rust/Cargo.toml.
//
// nodejs/package.json had it right the whole time (`@clickhouse/client`, and
// installed), so the manifest and this import had simply stopped describing the
// same package. The name below is a third party's identifier for their artifact,
// not a word we use about our warehouse — which is exactly why it is confined to
// this file.
import { ClickHouseClient, createClient } from '@clickhouse/client'

export type DatastoreNativeClient = ClickHouseClient
export const createDatastoreNativeClient = createClient
