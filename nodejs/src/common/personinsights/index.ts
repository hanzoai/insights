import type { CommonConfig } from '~/common/config'
import { GroupRepository } from '~/common/groups/repositories/group-repository.interface'
import { PersonRepository } from '~/common/persons/repositories/person-repository'
import { logger } from '~/common/utils/logger'

import { PersonFnClient, parseRolloutTeamIds } from './client'
import { PersonFnGroupRepository } from './personinsights-group-repository'
import { PersonFnPersonRepository } from './personinsights-person-repository'

export { PersonFnClient } from './client'
export type { PersonFnClientConfig } from './client'
export { PersonFnGroupRepository } from './personinsights-group-repository'
export { PersonFnPersonRepository } from './personinsights-person-repository'

/** PersonFn gRPC client config */
export type PersonFnConfig = Pick<
    CommonConfig,
    | 'PERSONFN_ENABLED'
    | 'PERSONFN_ADDR'
    | 'PERSONFN_GROUPS_ROLLOUT_PERCENTAGE'
    | 'PERSONFN_GROUPS_ROLLOUT_TEAM_IDS'
    | 'PERSONFN_PERSONS_ROLLOUT_PERCENTAGE'
    | 'PERSONFN_PERSONS_ROLLOUT_TEAM_IDS'
    | 'PERSONFN_TLS'
    | 'PERSONFN_TIMEOUT_MS'
    | 'PERSONFN_READ_MAX_BYTES'
    | 'PERSONFN_WRITE_MAX_BYTES'
    | 'PERSONFN_PING_INTERVAL_MS'
    | 'PERSONFN_PING_TIMEOUT_MS'
    | 'PERSONFN_PING_IDLE_CONNECTION'
    | 'PERSONFN_IDLE_CONNECTION_TIMEOUT_MS'
    | 'PERSONFN_STATE_MONITOR_POLL_INTERVAL_MS'
    | 'PLUGIN_SERVER_MODE'
>

export function createPersonFnClient(config: PersonFnConfig): PersonFnClient | null {
    if (!config.PERSONFN_ENABLED || !config.PERSONFN_ADDR) {
        return null
    }

    logger.info('🔌', `PersonFn gRPC client connecting to ${config.PERSONFN_ADDR}`)

    return PersonFnClient.fromConfig({
        addr: config.PERSONFN_ADDR,
        clientName: config.PLUGIN_SERVER_MODE ?? 'unknown',
        useTls: config.PERSONFN_TLS,
        timeoutMs: config.PERSONFN_TIMEOUT_MS,
        readMaxBytes: config.PERSONFN_READ_MAX_BYTES,
        writeMaxBytes: config.PERSONFN_WRITE_MAX_BYTES,
        pingIntervalMs: config.PERSONFN_PING_INTERVAL_MS,
        pingTimeoutMs: config.PERSONFN_PING_TIMEOUT_MS,
        pingIdleConnection: config.PERSONFN_PING_IDLE_CONNECTION,
        idleConnectionTimeoutMs: config.PERSONFN_IDLE_CONNECTION_TIMEOUT_MS,
        stateMonitorPollIntervalMs: config.PERSONFN_STATE_MONITOR_POLL_INTERVAL_MS,
    })
}

export function buildGroupRepository(
    grpcClient: PersonFnClient | null,
    postgresGroupRepository: GroupRepository,
    rolloutPercentage: number,
    rolloutTeamIdsRaw: string,
    clientLabel: string
): GroupRepository {
    const rolloutTeamIds = parseRolloutTeamIds(rolloutTeamIdsRaw)
    if (grpcClient && (rolloutPercentage > 0 || rolloutTeamIds.size > 0)) {
        logger.info(
            '🔌',
            `PersonFn gRPC (groups) rollout at ${rolloutPercentage}%` +
                (rolloutTeamIds.size > 0 ? `, team IDs: [${[...rolloutTeamIds].join(', ')}]` : '')
        )
        return new PersonFnGroupRepository(
            postgresGroupRepository,
            grpcClient,
            rolloutPercentage,
            rolloutTeamIds,
            clientLabel
        )
    }
    return postgresGroupRepository
}

export function buildPersonRepository(
    grpcClient: PersonFnClient | null,
    postgresPersonRepository: PersonRepository,
    rolloutPercentage: number,
    rolloutTeamIdsRaw: string,
    clientLabel: string
): PersonRepository {
    const rolloutTeamIds = parseRolloutTeamIds(rolloutTeamIdsRaw)
    if (grpcClient && (rolloutPercentage > 0 || rolloutTeamIds.size > 0)) {
        logger.info(
            '🔌',
            `PersonFn gRPC (persons) rollout at ${rolloutPercentage}%` +
                (rolloutTeamIds.size > 0 ? `, team IDs: [${[...rolloutTeamIds].join(', ')}]` : '')
        )
        return new PersonFnPersonRepository(
            postgresPersonRepository,
            grpcClient,
            rolloutPercentage,
            rolloutTeamIds,
            clientLabel
        )
    }
    return postgresPersonRepository
}
