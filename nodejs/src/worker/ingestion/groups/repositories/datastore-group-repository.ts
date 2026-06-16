import { DateTime } from 'luxon'

import { Properties } from '@hanzo/plugin-scaffold'

import { STREAM_GROUPS } from '../../../../config/stream-topics'
import { StreamProducerWrapper } from '../../../../stream/producer'
import { GroupTypeIndex, TeamId, TimestampFormat } from '../../../../types'
import { castTimestampOrNow } from '../../../../utils/utils'

export class DatastoreGroupRepository {
    constructor(private streamProducer: StreamProducerWrapper) {}

    public async upsertGroup(
        teamId: TeamId,
        groupTypeIndex: GroupTypeIndex,
        groupKey: string,
        properties: Properties,
        createdAt: DateTime,
        version: number
    ): Promise<void> {
        await this.streamProducer.queueMessages({
            topic: STREAM_GROUPS,
            messages: [
                {
                    value: JSON.stringify({
                        group_type_index: groupTypeIndex,
                        group_key: groupKey,
                        team_id: teamId,
                        group_properties: JSON.stringify(properties),
                        created_at: castTimestampOrNow(createdAt, TimestampFormat.DatastoreSecondPrecision),
                        version,
                    }),
                },
            ],
        })
    }
}
