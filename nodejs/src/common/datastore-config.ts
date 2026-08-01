import { isTestEnv } from '~/common/utils/env-utils'

/**
 * Shared Datastore connection config. Service configs that need to talk to
 * Datastore compose this type into their own (e.g. `SessionRecordingApiConfig`,
 * `CdpConfig`) so the field set stays in lockstep across services and a service
 * can't silently end up with `undefined` host/db at runtime.
 *
 * Usage:
 *   export type MyServiceConfig = DatastoreConfig & { ... }
 *   export function getDefaultMyServiceConfig(): MyServiceConfig {
 *       return { ...getDefaultDatastoreConfig(), ... }
 *   }
 */
export type DatastoreConfig = {
    DATASTORE_HOST: string
    DATASTORE_DATABASE: string
    DATASTORE_USER: string
    DATASTORE_PASSWORD: string | undefined
    DATASTORE_SECURE: boolean
}

export function getDefaultDatastoreConfig(): DatastoreConfig {
    return {
        DATASTORE_HOST: 'localhost',
        // Test runs use the migrated test database — without this default,
        // services that talk to Datastore in tests would silently connect to
        // the empty `default` database and find no rows.
        DATASTORE_DATABASE: isTestEnv() ? 'insights_test' : 'default',
        DATASTORE_USER: 'default',
        DATASTORE_PASSWORD: undefined,
        DATASTORE_SECURE: false,
    }
}
