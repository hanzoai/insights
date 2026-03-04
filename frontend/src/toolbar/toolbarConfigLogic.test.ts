import { expectLogic } from 'kea-test-utils'

import { initKeaTests } from '~/test/init'
import { toolbarConfigLogic } from '~/toolbar/toolbarConfigLogic'

global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
    } as any as Response)
)

describe('toolbar toolbarLogic', () => {
    let logic: ReturnType<typeof toolbarConfigLogic.build>

    beforeEach(() => {
        initKeaTests()
        logic = toolbarConfigLogic.build({ apiURL: 'http://localhost' })
        logic.mount()
    })

    it('is not authenticated', () => {
        expectLogic(logic).toMatchValues({ isAuthenticated: false })
    })

    it('normalizes uiHost to not end with a slash', () => {
        const logicWithUiHost = toolbarConfigLogic.build({
            insights: { config: { ui_host: 'https://insights.hanzo.ai/' } } as any,
        } as any)
        logicWithUiHost.mount()
        expect(logicWithUiHost.values.uiHost.endsWith('/')).toBe(false)
        expect(logicWithUiHost.values.uiHost).toBe('https://insights.hanzo.ai')
    })
})
