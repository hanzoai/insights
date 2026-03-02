import { DBCustomFunctionTemplate } from '~/cdp/types'
import { forSnapshot } from '~/tests/helpers/snapshots'
import { resetTestDatabase } from '~/tests/helpers/sql'
import { Hub } from '~/types'
import { closeHub, createHub } from '~/utils/db/hub'

import { insertCustomFunctionTemplate } from '../../_tests/fixtures'
import { CustomFunctionTemplateManagerService } from './custom-function-template-manager.service'

describe('CustomFunctionTemplateManager', () => {
    let hub: Hub
    let manager: CustomFunctionTemplateManagerService
    let customFunctionsTemplates: DBCustomFunctionTemplate[]

    beforeEach(async () => {
        hub = await createHub()
        await resetTestDatabase()
        manager = new CustomFunctionTemplateManagerService(hub.postgres)

        customFunctionsTemplates = []

        customFunctionsTemplates.push(
            await insertCustomFunctionTemplate(hub.postgres, {
                id: 'template-testing-1',
                name: 'Test Custom Function team 1',
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

    it('returns the custom functions templates', async () => {
        const items = await manager.getCustomFunctionTemplate('template-testing-1')

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
              "name": "Test Custom Function team 1",
              "sha": "sha",
              "template_id": "template-testing-1",
              "type": "destination",
            }
        `)
    })
})
