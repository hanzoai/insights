import { DateTime } from 'luxon'

import { PluginServer } from '../../../src/server'
import {
    Hub,
    PluginServerMode,
    PluginsServerConfig,
    PropertyUpdateOperation,
    TimestampFormat,
} from '../../../src/types'
import { PostgresUse } from '../../../src/utils/db/postgres'
import { parseJSON } from '../../../src/utils/json-parse'
import { UUIDT, castTimestampOrNow } from '../../../src/utils/utils'
import { PostgresPersonRepository } from '../../../src/worker/ingestion/persons/repositories/postgres-person-repository'
import {
    createPersonUpdateFields,
    fetchDistinctIdValues,
    fetchDistinctIds,
    fetchPersons,
} from '../../../src/worker/ingestion/persons/repositories/test-helpers'
import { Datastore } from '../../helpers/datastore'
import { resetKafka } from '../../helpers/kafka'
import { createUserTeamAndOrganization, resetTestDatabase } from '../../helpers/sql'

jest.mock('../../../src/utils/logger')
jest.setTimeout(30000)

const extraServerConfig: Partial<PluginsServerConfig> = {
    LOG_LEVEL: 'info',
}

describe('postgres parity', () => {
    jest.retryTimes(5) // Flakey due to reliance on kafka/datastore
    let hub: Hub
    let server: PluginServer
    let personRepository: PostgresPersonRepository
    let datastore: Datastore
    let teamId: number

    beforeAll(() => {
        datastore = Datastore.create()
    })

    beforeEach(async () => {
        jest.spyOn(process, 'exit').mockImplementation()

        // Generate unique teamId to avoid collisions across test files
        teamId = Math.floor((Date.now() % 1000000000) + Math.random() * 1000000)

        // Reset Kafka and Datastore for each test to ensure isolation
        await resetKafka(extraServerConfig)
        await datastore.resetTestDatabase()

        await resetTestDatabase()

        server = new PluginServer({
            PLUGIN_SERVER_MODE: PluginServerMode.ingestion_v2,
        })
        await server.start()
        hub = server.hub!
        await createUserTeamAndOrganization(
            hub.postgres,
            teamId,
            teamId,
            new UUIDT().toString(),
            new UUIDT().toString(),
            new UUIDT().toString()
        )
        personRepository = new PostgresPersonRepository(hub.postgres)
    })

    afterAll(() => {
        datastore.close()
    })

    afterEach(async () => {
        await server.stop()
    })

    test('createPerson', async () => {
        const uuid = new UUIDT().toString()
        const ts = DateTime.now().toString()
        const result = await personRepository.createPerson(
            DateTime.utc(),
            { userPropOnce: 'propOnceValue', userProp: 'propValue' },
            { userProp: ts, userPropOnce: ts },
            { userProp: PropertyUpdateOperation.Set, userPropOnce: PropertyUpdateOperation.SetOnce },
            teamId,
            null,
            true,
            uuid,
            { distinctId: 'distinct1' },
            [{ distinctId: 'distinct2' }]
        )
        if (!result.success) {
            throw new Error('Failed to create person')
        }
        const person = result.person
        const kafkaMessages = result.messages

        await hub.kafkaProducer.queueMessages(kafkaMessages)

        await datastore.delayUntilEventIngested(() => datastore.fetchPersons())
        await datastore.delayUntilEventIngested(() => datastore.fetchDistinctIdValues(person), 2)
        await datastore.delayUntilEventIngested(() => datastore.fetchDistinctIds(person), 2)

        const clickHousePersons = (await datastore.fetchPersons()).map((row) => ({
            ...row,
            properties: parseJSON(row.properties), // avoids depending on key sort order
        }))
        expect(clickHousePersons).toMatchObject([
            {
                id: uuid,
                created_at: expect.any(String), // '2021-02-04 00:18:26.472',
                team_id: teamId,
                properties: { userPropOnce: 'propOnceValue', userProp: 'propValue' },
                is_identified: 1,
                is_deleted: 0,
            },
        ])
        const clickHouseDistinctIds = await datastore.fetchDistinctIdValues(person)
        expect(clickHouseDistinctIds).toEqual(expect.arrayContaining(['distinct1', 'distinct2']))
        expect(clickHouseDistinctIds).toHaveLength(2)

        const postgresPersons = await fetchPersons(hub.postgres)
        expect(postgresPersons).toEqual([
            {
                id: expect.any(String),
                created_at: expect.any(DateTime),
                last_seen_at: expect.any(DateTime),
                properties: {
                    userProp: 'propValue',
                    userPropOnce: 'propOnceValue',
                },
                properties_last_updated_at: {
                    userProp: expect.any(String),
                    userPropOnce: expect.any(String),
                },
                properties_last_operation: {
                    userProp: PropertyUpdateOperation.Set,
                    userPropOnce: PropertyUpdateOperation.SetOnce,
                },
                team_id: teamId,
                is_user_id: null,
                is_identified: true,
                uuid: uuid,
                version: 0,
            },
        ])
        const postgresDistinctIds = await fetchDistinctIdValues(hub.postgres, person)
        expect(postgresDistinctIds).toEqual(expect.arrayContaining(['distinct1', 'distinct2']))
        expect(postgresDistinctIds).toHaveLength(2)

        const newDatastoreDistinctIdValues = await datastore.fetchDistinctIds(person)
        expect(newDatastoreDistinctIdValues).toMatchObject([
            {
                distinct_id: 'distinct1',
                person_id: person.uuid,
                team_id: teamId,
                version: 0,
                is_deleted: 0,
            },
            {
                distinct_id: 'distinct2',
                person_id: person.uuid,
                team_id: teamId,
                version: 0,
                is_deleted: 0,
            },
        ])

        expect(person).toEqual(postgresPersons[0])
    })

    test('updatePerson', async () => {
        const uuid = new UUIDT().toString()
        const result = await personRepository.createPerson(
            DateTime.utc(),
            { userProp: 'propValue' },
            { userProp: PropertyUpdateOperation.Set },
            {},
            teamId,
            null,
            false,
            uuid,
            { distinctId: 'distinct1' },
            [{ distinctId: 'distinct2' }]
        )
        if (!result.success) {
            throw new Error('Failed to create person')
        }
        const person = result.person
        const kafkaMessages = result.messages

        await hub.kafkaProducer.queueMessages(kafkaMessages)

        await datastore.delayUntilEventIngested(() => datastore.fetchPersons())
        await datastore.delayUntilEventIngested(() => datastore.fetchDistinctIdValues(person), 2)

        // update properties and set is_identified to true
        const [_p, kafkaMessagesUpdate] = await personRepository.updatePerson(
            person,
            createPersonUpdateFields(person, {
                properties: { replacedUserProp: 'propValue' },
                is_identified: true,
            })
        )
        await hub.kafkaProducer.queueMessages(kafkaMessagesUpdate)

        await datastore.delayUntilEventIngested(async () =>
            (await datastore.fetchPersons()).filter((p) => p.is_identified)
        )

        const clickHousePersons = await datastore.fetchPersons()
        const postgresPersons = await fetchPersons(hub.postgres)

        expect(clickHousePersons.filter((p) => p.team_id.toString() === teamId.toString()).length).toEqual(1)
        expect(postgresPersons.filter((p) => p.team_id.toString() === teamId.toString()).length).toEqual(1)

        expect(postgresPersons[0].is_identified).toEqual(true)
        expect(postgresPersons[0].version).toEqual(1)
        expect(postgresPersons[0].properties).toEqual({ replacedUserProp: 'propValue' })

        expect(clickHousePersons[0].is_identified).toEqual(1)
        expect(clickHousePersons[0].is_deleted).toEqual(0)
        expect(clickHousePersons[0].properties).toEqual('{"replacedUserProp":"propValue"}')

        // update date and boolean to false

        const randomDate = DateTime.utc().minus(100000).setZone('UTC')
        const [updatedPerson, kafkaMessages2] = await personRepository.updatePerson(
            person,
            createPersonUpdateFields(person, {
                created_at: randomDate,
                is_identified: false,
            })
        )

        await hub.kafkaProducer.queueMessages(kafkaMessages2)

        expect(updatedPerson.version).toEqual(2)

        await datastore.delayUntilEventIngested(async () =>
            (await datastore.fetchPersons()).filter((p) => !p.is_identified)
        )

        const clickHousePersons2 = await datastore.fetchPersons()
        const postgresPersons2 = await fetchPersons(hub.postgres)

        expect(clickHousePersons2.length).toEqual(1)
        expect(postgresPersons2.length).toEqual(1)

        expect(postgresPersons2[0].is_identified).toEqual(false)
        expect(postgresPersons2[0].created_at.toISO()).toEqual(randomDate.toISO())

        expect(clickHousePersons2[0].is_identified).toEqual(0)
        expect(clickHousePersons2[0].created_at).toEqual(
            // TODO: get rid of `+ '.000'` by removing the need for DatastoreSecondPrecision on CH persons
            castTimestampOrNow(randomDate, TimestampFormat.DatastoreSecondPrecision) + '.000'
        )
    })

    test('addDistinctId', async () => {
        const uuid = new UUIDT().toString()
        const uuid2 = new UUIDT().toString()
        const result = await personRepository.createPerson(
            DateTime.utc(),
            { userProp: 'propValue' },
            { userProp: PropertyUpdateOperation.Set },
            {},
            teamId,
            null,
            true,
            uuid,
            { distinctId: 'distinct1' }
        )
        if (!result.success) {
            throw new Error('Failed to create person')
        }
        const person = result.person

        await hub.kafkaProducer.queueMessages(result.messages)
        await hub.kafkaProducer.flush()

        const result2 = await personRepository.createPerson(
            DateTime.utc(),
            { userProp: 'propValue' },
            { userProp: PropertyUpdateOperation.Set },
            {},
            teamId,
            null,
            true,
            uuid2,
            { distinctId: 'another_distinct_id' }
        )
        if (!result2.success) {
            throw new Error('Failed to create person')
        }
        const anotherPerson = result2.person
        const anotherPersonKafkaMessages = result2.messages

        await hub.kafkaProducer.queueMessages(anotherPersonKafkaMessages)
        await hub.kafkaProducer.flush()

        await datastore.delayUntilEventIngested(() => datastore.fetchPersons())
        const [postgresPerson] = await fetchPersons(hub.postgres)

        await datastore.delayUntilEventIngested(() => datastore.fetchDistinctIds(postgresPerson), 1)
        const clickHouseDistinctIdValues = await datastore.fetchDistinctIdValues(postgresPerson)
        const postgresDistinctIdValues = await fetchDistinctIdValues(hub.postgres, postgresPerson)

        // check that all is in the right format

        expect(clickHouseDistinctIdValues).toEqual(['distinct1'])
        expect(postgresDistinctIdValues).toEqual(['distinct1'])

        const postgresDistinctIds = await fetchDistinctIds(hub.postgres, postgresPerson)
        const newDatastoreDistinctIdValues = await datastore.fetchDistinctIds(postgresPerson)

        expect(postgresDistinctIds).toEqual([
            expect.objectContaining({
                distinct_id: 'distinct1',
                person_id: person.id,
                team_id: teamId,
                version: '0',
            }),
        ])
        expect(newDatastoreDistinctIdValues).toMatchObject([
            {
                distinct_id: 'distinct1',
                person_id: person.uuid,
                team_id: teamId,
                version: 0,
                is_deleted: 0,
            },
        ])

        // add 'anotherOne' to person

        const kafkaMessagesAddDistinctId = await personRepository.addDistinctId(postgresPerson, 'anotherOne', 0)
        await hub.kafkaProducer.queueMessages(kafkaMessagesAddDistinctId)

        await datastore.delayUntilEventIngested(() => datastore.fetchDistinctIdValues(postgresPerson), 2)

        const clickHouseDistinctIdValues2 = await datastore.fetchDistinctIdValues(postgresPerson)
        const postgresDistinctIdValues2 = await fetchDistinctIdValues(hub.postgres, postgresPerson)

        expect(clickHouseDistinctIdValues2).toEqual(['distinct1', 'anotherOne'])
        expect(postgresDistinctIdValues2).toEqual(['distinct1', 'anotherOne'])

        // check anotherPerson for their initial distinct id

        const clickHouseDistinctIdValuesOther = await datastore.fetchDistinctIdValues(anotherPerson)
        const postgresDistinctIdValuesOther = await fetchDistinctIdValues(hub.postgres, anotherPerson)

        expect(clickHouseDistinctIdValuesOther).toEqual(['another_distinct_id'])
        expect(postgresDistinctIdValuesOther).toEqual(['another_distinct_id'])
    })

    test('moveDistinctIds & deletePerson', async () => {
        const uuid = new UUIDT().toString()
        const uuid2 = new UUIDT().toString()
        const result = await personRepository.createPerson(
            DateTime.utc(),
            { userProp: 'propValue' },
            { userProp: PropertyUpdateOperation.Set },
            {},
            teamId,
            null,
            false,
            uuid,
            { distinctId: 'distinct1' }
        )
        if (!result.success) {
            throw new Error('Failed to create person')
        }
        const person = result.person
        await hub.kafkaProducer.queueMessages(result.messages)
        await hub.kafkaProducer.flush()

        const result2 = await personRepository.createPerson(
            DateTime.utc(),
            { userProp: 'propValue' },
            { userProp: PropertyUpdateOperation.Set },
            {},
            teamId,
            null,
            true,
            uuid2,
            { distinctId: 'another_distinct_id' }
        )
        if (!result2.success) {
            throw new Error('Failed to create person')
        }
        const anotherPerson = result2.person
        const kafkaMessagesAnotherPerson = result2.messages

        await hub.kafkaProducer.queueMessages(kafkaMessagesAnotherPerson)
        await hub.kafkaProducer.flush()

        await datastore.delayUntilEventIngested(() => datastore.fetchPersons())
        const [postgresPerson] = await fetchPersons(hub.postgres)

        await datastore.delayUntilEventIngested(() => datastore.fetchDistinctIdValues(postgresPerson), 1)

        // move distinct ids from person to to anotherPerson
        const moveDistinctIdsResult = await personRepository.moveDistinctIds(person, anotherPerson, undefined)
        expect(moveDistinctIdsResult.success).toEqual(true)

        if (moveDistinctIdsResult.success) {
            await hub.kafkaProducer!.queueMessages(moveDistinctIdsResult.messages)
        }
        await datastore.delayUntilEventIngested(() => datastore.fetchDistinctIdValues(anotherPerson), 2)

        // it got added

        // :TODO: Update version
        const clickHouseDistinctIdValuesMoved = await datastore.fetchDistinctIdValues(anotherPerson)
        const postgresDistinctIdValuesMoved = await fetchDistinctIdValues(hub.postgres, anotherPerson)
        const newDatastoreDistinctIdValues = await datastore.delayUntilEventIngested(
            () => datastore.fetchDistinctIds(anotherPerson),
            2
        )

        expect(postgresDistinctIdValuesMoved).toEqual(expect.arrayContaining(['distinct1', 'another_distinct_id']))
        expect(clickHouseDistinctIdValuesMoved).toEqual(expect.arrayContaining(['distinct1', 'another_distinct_id']))
        expect(newDatastoreDistinctIdValues).toMatchObject([
            {
                distinct_id: 'another_distinct_id',
                person_id: anotherPerson.uuid,
                team_id: teamId,
                version: 0,
                is_deleted: 0,
            },
            {
                distinct_id: 'distinct1',
                person_id: anotherPerson.uuid,
                team_id: teamId,
                version: 1,
                is_deleted: 0,
            },
        ])

        // it got removed

        const clickHouseDistinctIdValuesRemoved = await datastore.fetchDistinctIdValues(postgresPerson)
        const postgresDistinctIdValuesRemoved = await fetchDistinctIdValues(hub.postgres, postgresPerson)
        const newDatastoreDistinctIdRemoved = await datastore.fetchDistinctIds(postgresPerson)

        expect(clickHouseDistinctIdValuesRemoved).toEqual([])
        expect(postgresDistinctIdValuesRemoved).toEqual([])
        expect(newDatastoreDistinctIdRemoved).toEqual([])

        // delete person
        await hub.postgres.transaction(PostgresUse.PERSONS_WRITE, '', async (client) => {
            const deletePersonMessage = await personRepository.deletePerson(person, client)
            await hub.kafkaProducer!.queueMessages(deletePersonMessage[0])
        })

        await datastore.delayUntilEventIngested(async () =>
            (await datastore.fetchPersons()).length === 1 ? ['deleted!'] : []
        )
        const clickHousePersons = await datastore.fetchPersons()
        const postgresPersons = await fetchPersons(hub.postgres)

        expect(clickHousePersons.length).toEqual(1)
        expect(postgresPersons.length).toEqual(1)
    })
})
