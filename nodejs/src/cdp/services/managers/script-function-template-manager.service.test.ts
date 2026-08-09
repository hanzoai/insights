import { DBInsightsFunctionTemplate } from '~/cdp/types'
import { closeHub, createHub } from '~/common/utils/db/hub'
import { forSnapshot } from '~/tests/helpers/snapshots'
import { resetTestDatabase } from '~/tests/helpers/sql'
import { Hub } from '~/types'

import { insertInsightsFunctionTemplate } from '../../_tests/fixtures'
import { InsightsFunctionTemplateManagerService } from './script-function-template-manager.service'

describe('InsightsFunctionTemplateManager', () => {
    let hub: Hub
    let manager: InsightsFunctionTemplateManagerService
    let insightsFunctionsTemplates: DBInsightsFunctionTemplate[]

    beforeEach(async () => {
        hub = await createHub()
        await resetTestDatabase()
        manager = new InsightsFunctionTemplateManagerService(hub.postgres)

        insightsFunctionsTemplates = []

        insightsFunctionsTemplates.push(
            await insertInsightsFunctionTemplate(hub.postgres, {
                id: 'template-testing-1',
                name: 'Test Script Function team 1',
                inputs_schema: [
                    {
                        key: 'url',
                        type: 'string',
                        required: true,
                    },
                ],
                code: 'fetch(inputs.url)',
            })
        )
    })

    afterEach(async () => {
        await closeHub(hub)
    })

    it('returns the script functions templates', async () => {
        const items = await manager.getInsightsFunctionTemplate('template-testing-1')

        expect(forSnapshot(items)).toMatchInlineSnapshot(`
            {
              "bytecode": [
                "_H",
                1,
                32,
                "url",
                32,
                "inputs",
                1,
                2,
                2,
                "fetch",
                1,
                35,
              ],
              "free": true,
              "id": "<REPLACED-UUID-0>",
              "inputs_schema": [
                {
                  "key": "url",
                  "required": true,
                  "type": "string",
                },
              ],
              "name": "Test Script Function team 1",
              "sha": "sha",
              "template_id": "template-testing-1",
              "type": "destination",
            }
        `)
    })
})
