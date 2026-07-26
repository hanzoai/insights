import { Hub } from '../../../src/types'
import { closeHub, createHub } from '../../../src/utils/db/hub'
import { captureIngestionWarning } from '../../../src/worker/ingestion/utils'
import { Datastore } from '../../helpers/datastore'

jest.setTimeout(60000) // 60 sec timeout

describe('captureIngestionWarning()', () => {
    let hub: Hub
    let datastore: Datastore

    beforeEach(async () => {
        hub = await createHub({ LOG_LEVEL: 'info' })
        datastore = Datastore.create()
        await datastore.resetTestDatabase()
    })

    afterEach(async () => {
        datastore.close()
        await closeHub(hub)
    })

    it('can read own writes', async () => {
        await captureIngestionWarning(hub.kafkaProducer, 2, 'some_type', { foo: 'bar' })

        const warnings = await datastore.delayUntilEventIngested(
            async () => await datastore.query('SELECT * FROM ingestion_warnings')
        )

        expect(warnings).toEqual([
            expect.objectContaining({
                team_id: 2,
                source: 'plugin-server',
                type: 'some_type',
                details: '{"foo":"bar"}',
                timestamp: expect.any(String),
                _timestamp: expect.any(String),
            }),
        ])
    })
})
