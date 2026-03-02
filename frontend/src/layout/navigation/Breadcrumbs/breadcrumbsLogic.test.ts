import { router } from 'kea-router'
import { expectLogic } from 'kea-test-utils'

import { sceneLogic } from 'scenes/sceneLogic'
import { Scene } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { initKeaTests } from '~/test/init'

import { breadcrumbsLogic } from './breadcrumbsLogic'

const blankScene = (): any => ({ scene: { component: () => null, logic: null } })
const scenes: any = { [Scene.SavedInsights]: blankScene, [Scene.Dashboards]: blankScene }

describe('breadcrumbsLogic', () => {
    let logic: ReturnType<typeof breadcrumbsLogic.build>

    beforeEach(async () => {
        initKeaTests()
        sceneLogic({ scenes }).mount()
    })

    it('sets document.title when page is visible', async () => {
        expect(global.document.title).toEqual('')

        logic = breadcrumbsLogic()
        logic.mount()

        // test with .delay because subscriptions happen async
        router.actions.push(urls.savedInsights())
        await expectLogic(logic).delay(1).toMatchValues({ documentTitle: 'Product analytics • Insights' })
        expect(global.document.title).toEqual('Product analytics • Insights')

        router.actions.push(urls.dashboards())
        await expectLogic(logic).delay(1).toMatchValues({ documentTitle: 'Dashboards • Insights' })
        expect(global.document.title).toEqual('Dashboards • Insights')
    })

    it('defers document.title update when page is hidden', async () => {
        logic = breadcrumbsLogic()
        logic.mount()

        router.actions.push(urls.savedInsights())
        await expectLogic(logic).delay(1).toMatchValues({ documentTitle: 'Product analytics • Insights' })
        expect(global.document.title).toEqual('Product analytics • Insights')

        Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true })

        router.actions.push(urls.dashboards())
        await expectLogic(logic).delay(1).toMatchValues({ documentTitle: 'Dashboards • Insights' })
        expect(global.document.title).toEqual('Product analytics • Insights')

        Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true })
        document.dispatchEvent(new Event('visibilitychange'))

        expect(global.document.title).toEqual('Dashboards • Insights')
    })
})
