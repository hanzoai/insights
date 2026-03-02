import { urls } from 'scenes/urls'

import { ProductKey } from '~/queries/schema/schema-general'

import { ProductManifest } from '../../frontend/src/types'

export const manifest: ProductManifest = {
    name: 'Site Inspector',
    scenes: {
        Toolbar: {
            name: 'Site Inspector',
            projectBased: true,
            description: 'Site Inspector launches Insights right in your app or website.',
            iconType: 'toolbar',
        },
    },
    urls: {
        toolbarLaunch: (): string => '/toolbar',
    },
    treeItemsProducts: [
        {
            path: 'Site Inspector',
            intents: [ProductKey.TOOLBAR],
            href: urls.toolbarLaunch(),
            type: 'toolbar',
            category: 'Tools',
            iconType: 'toolbar',
            sceneKey: 'Toolbar',
        },
    ],
}
