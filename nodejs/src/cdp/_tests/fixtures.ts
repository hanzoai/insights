import { randomUUID } from 'crypto'
import { DateTime } from 'luxon'
import { Message } from 'node-rdkafka'

import { insertRow } from '~/tests/helpers/sql'

import { ClickHousePerson, ClickHouseTimestamp, ProjectId, RawClickHouseEvent, Team } from '../../types'
import { PostgresRouter } from '../../utils/db/postgres'
import { UUIDT } from '../../utils/utils'
import { CohortMembershipChange } from '../consumers/cdp-cohort-membership.consumer'
import { CdpInternalEvent } from '../schema'
import { compileFn } from '../templates/compiler'
import {
    CyclotronJobInvocationInsightsFunction,
    CyclotronJobQueueKind,
    DBInsightsFunctionTemplate,
    InsightsFunctionInvocationGlobals,
    InsightsFunctionInvocationGlobalsWithInputs,
    InsightsFunctionTemplateCompiled,
    InsightsFunctionType,
    IntegrationType,
} from '../types'

export const SAMPLE_GLOBALS = {
    event: {
        uuid: 'uuid',
        event: 'test',
        distinct_id: 'distinct_id',
        properties: {
            email: 'test@hanzo.ai',
        },
        elements_chain: '',
        timestamp: '',
        url: '',
    },
    project: {
        id: 1,
        name: 'test',
        url: 'http://localhost:8000/projects/1',
    },
}

export const createInsightsFunction = (insightsFunction: Partial<InsightsFunctionType>) => {
    const item: InsightsFunctionType = {
        id: randomUUID(),
        type: 'destination',
        name: 'Custom Function',
        team_id: 1,
        enabled: true,
        script: '',
        bytecode: [],
        ...insightsFunction,
    } as InsightsFunctionType

    return item
}

export const createIntegration = (integration: Partial<IntegrationType>) => {
    const item: IntegrationType = {
        team_id: 1,
        id: integration.id ?? 1,
        kind: integration.kind ?? 'slack',
        config: {},
        sensitive_config: {},
        ...integration,
    }

    return item
}

export const createIncomingEvent = (teamId: number, data: Partial<RawClickHouseEvent>): RawClickHouseEvent => {
    return {
        team_id: teamId,
        project_id: teamId as ProjectId,
        created_at: new Date().toISOString() as ClickHouseTimestamp,
        elements_chain: '[]',
        person_created_at: new Date().toISOString() as ClickHouseTimestamp,
        person_properties: '{}',
        distinct_id: 'distinct_id_1',
        uuid: randomUUID(),
        event: '$pageview',
        timestamp: new Date().toISOString() as ClickHouseTimestamp,
        properties: '{}',
        person_mode: 'full',
        historical_migration: false,
        ...data,
    }
}

export const createKafkaMessage = (event: any, overrides: Partial<Message> = {}): Message => {
    return {
        partition: 1,
        topic: 'test',
        offset: 0,
        timestamp: overrides.timestamp ?? Date.now(),
        size: 1,
        ...overrides,
        value: Buffer.from(JSON.stringify(event)),
    }
}

export const createInternalEvent = (teamId: number, data: Partial<CdpInternalEvent>): CdpInternalEvent => {
    return {
        team_id: teamId,
        event: {
            timestamp: DateTime.now().toISO(),
            properties: {},
            uuid: randomUUID(),
            event: '$pageview',
            distinct_id: 'distinct_id',
        },
        ...data,
    }
}

export const createClickhousePerson = (teamId: number, data: Partial<ClickHousePerson>): ClickHousePerson => {
    return {
        team_id: teamId,
        id: randomUUID(),
        created_at: new Date().toISOString(),
        properties: JSON.stringify({
            email: 'test@hanzo.ai',
        }),
        is_identified: 1,
        is_deleted: 0,
        timestamp: new Date().toISOString(),
        version: 1,
        last_seen_at: null,
        ...data,
    }
}

export const insertInsightsFunction = async (
    postgres: PostgresRouter,
    team_id: Team['id'],
    insightsFunction: Partial<InsightsFunctionType> = {}
): Promise<InsightsFunctionType> => {
    // This is only used for testing so we need to override some values

    const res = await insertRow(postgres, 'insights_function', {
        ...createInsightsFunction({
            ...insightsFunction,
            team_id: team_id,
        }),
        description: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_id: 1001,
        deleted: false,
    })
    return res
}

export const createInsightsFunctionTemplate = (
    insightsFunctionTemplate: Partial<InsightsFunctionTemplateCompiled>
): InsightsFunctionTemplateCompiled => {
    return {
        id: randomUUID(),
        status: 'stable',
        free: true,
        type: 'destination',
        name: 'Custom Function Template',
        description: 'Custom Function Template',
        code_language: 'fn',
        code: 'Custom Function Template',
        inputs_schema: [],
        category: [],
        bytecode: [],
        ...insightsFunctionTemplate,
    }
}

export const insertInsightsFunctionTemplate = async (
    postgres: PostgresRouter,
    insightsFunctionTemplate: Partial<InsightsFunctionTemplateCompiled> = {}
): Promise<DBInsightsFunctionTemplate> => {
    // This is only used for testing so we need to override some values

    const template = createInsightsFunctionTemplate({
        ...insightsFunctionTemplate,
    })
    if (template.code_language === 'fn') {
        template.bytecode = await compileFn(template.code)
    }

    const res = await insertRow(postgres, 'insights_function_template', {
        id: randomUUID(),
        template_id: template.id,
        sha: 'sha',
        name: template.name,
        description: template.description,
        code: template.code,
        code_language: template.code_language,
        status: template.status,
        free: template.free,
        category: template.category,
        icon_url: template.icon_url,
        filters: template.filters,
        masking: template.masking,
        mappings: template.mappings,
        bytecode: template.bytecode,
        inputs_schema: template.inputs_schema,
        type: template.type,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    })
    return res
}

export const insertIntegration = async (
    postgres: PostgresRouter,
    team_id: Team['id'],
    integration: Partial<IntegrationType> = {}
): Promise<IntegrationType> => {
    const res = await insertRow(postgres, 'posthog_integration', {
        ...createIntegration({
            ...integration,
            team_id: team_id,
        }),
        errors: '',
        created_at: new Date().toISOString(),
        created_by_id: 1001,
    })
    return res
}

export const createScriptExecutionGlobals = (
    data: Partial<InsightsFunctionInvocationGlobals> = {}
): InsightsFunctionInvocationGlobals => {
    return {
        groups: {},
        ...data,
        person: {
            id: 'uuid',
            name: 'test',
            url: 'http://localhost:8000/persons/1',
            properties: {
                email: 'test@hanzo.ai',
                first_name: 'Pumpkin',
            },
            ...data.person,
        },
        project: {
            id: 1,
            name: 'test',
            url: 'http://localhost:8000/projects/1',
            ...data.project,
        },
        event: {
            uuid: 'uuid',
            event: 'test',
            elements_chain: '',
            distinct_id: 'distinct_id',
            url: 'http://localhost:8000/events/1',
            properties: {
                $lib_version: '1.2.3',
            },
            timestamp: new Date().toISOString(),
            ...data.event,
        },
    }
}

export const createExampleInvocation = (
    _insightsFunction: Partial<InsightsFunctionType> = {},
    _globals: Partial<InsightsFunctionInvocationGlobalsWithInputs> = {},
    queue: CyclotronJobQueueKind = 'fn'
): CyclotronJobInvocationInsightsFunction => {
    const insightsFunction = createInsightsFunction(_insightsFunction)
    // Add the source of the trigger to the globals

    const globals = createScriptExecutionGlobals(_globals)
    globals.source = {
        name: insightsFunction.name ?? `Custom function: ${insightsFunction.id}`,
        url: `${globals.project.url}/pipeline/destinations/insights-function-${insightsFunction.id}/configuration/`,
    }

    return {
        id: new UUIDT().toString(),
        state: {
            globals: globals as InsightsFunctionInvocationGlobalsWithInputs,
            timings: [],
            attempts: 0,
        },
        teamId: insightsFunction.team_id,
        functionId: insightsFunction.id,
        insightsFunction,
        queue,
        queuePriority: 0,
    }
}

// Cohort Membership Test Helpers
export const createCohortMembershipEvent = (
    overrides: Partial<CohortMembershipChange> = {}
): CohortMembershipChange => {
    return {
        person_id: new UUIDT().toString(),
        cohort_id: 1,
        team_id: 1,
        status: 'entered',
        ...overrides,
    }
}

export const createCohortMembershipEvents = (events: Partial<CohortMembershipChange>[]): CohortMembershipChange[] => {
    return events.map((event) => createCohortMembershipEvent(event))
}

export interface CohortMembershipRecord {
    team_id: number
    cohort_id: number
    person_id: string
    in_cohort: boolean
    last_updated?: Date
}

export const insertCohortMembership = async (
    db: PostgresRouter,
    membership: Partial<CohortMembershipRecord>
): Promise<CohortMembershipRecord> => {
    const record: CohortMembershipRecord = {
        team_id: 1,
        cohort_id: 1,
        person_id: new UUIDT().toString(),
        in_cohort: true,
        ...membership,
    }

    // insertRow now automatically determines the correct database based on table name
    return await insertRow(db, 'cohort_membership', record)
}

export const insertCohortMemberships = async (
    db: PostgresRouter,
    memberships: Partial<CohortMembershipRecord>[]
): Promise<CohortMembershipRecord[]> => {
    const results = []
    for (const membership of memberships) {
        results.push(await insertCohortMembership(db, membership))
    }
    return results
}
