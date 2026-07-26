import { randomUUID } from 'crypto'

import { DatastoreTimestamp, ProjectId, RawDatastoreEvent, RawKafkaEvent } from '../../src/types'

/**
 * Helper function to create RawDatastoreEvent for tests with sensible defaults.
 *
 * @param overrides - Partial RawDatastoreEvent to override defaults
 * @returns Complete RawDatastoreEvent object
 *
 * @example
 * const event = createTestRawDatastoreEvent({
 *     team_id: 123,
 *     event: '$pageview',
 *     distinct_id: 'user-abc'
 * })
 */
export function createTestRawDatastoreEvent(overrides: Partial<RawDatastoreEvent> = {}): RawDatastoreEvent {
    const now = new Date().toISOString() as DatastoreTimestamp
    return {
        uuid: randomUUID(),
        event: 'test_event',
        team_id: 1,
        project_id: 1 as ProjectId,
        distinct_id: 'test_distinct_id',
        timestamp: now,
        created_at: now,
        properties: '{}',
        elements_chain: '',
        person_created_at: now,
        person_properties: '{}',
        person_mode: 'full',
        historical_migration: false,
        ...overrides,
    }
}

/**
 * Helper function to create RawKafkaEvent for tests with sensible defaults.
 * RawKafkaEvent extends RawDatastoreEvent with a project_id field.
 *
 * @param overrides - Partial RawKafkaEvent to override defaults
 * @returns Complete RawKafkaEvent object
 */
export function createTestRawKafkaEvent(overrides: Partial<RawKafkaEvent> = {}): RawKafkaEvent {
    return {
        ...createTestRawDatastoreEvent(overrides),
        project_id: (overrides.project_id ?? overrides.team_id ?? 1) as ProjectId,
    }
}
