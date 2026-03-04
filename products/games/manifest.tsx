import { urls } from 'scenes/urls'

import { ProductManifest } from '../../frontend/src/types'

export const manifest: ProductManifest = {
    name: 'Games',
    scenes: {
        Game368Mascots: {
            name: '368Mascots',
            import: () => import('./368Mascots/368Mascots'),
            projectBased: true,
            activityScope: 'Games',
        },
    },
    routes: {
        '/games/368mascots': ['Game368Mascots', 'game368Mascots'],
    },
    urls: {
        game368mascots: (): string => `/games/368mascots`,
    },
    treeItemsGames: [
        {
            path: '368 Mascots',
            href: urls.game368mascots(),
        },
    ],
}
