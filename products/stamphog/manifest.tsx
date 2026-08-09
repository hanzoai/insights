/**
 * Product manifest for stamp.
 *
 * Defines scenes, routes, URLs, and navigation for this product.
 */
import { ProductManifest } from '../../frontend/src/types'

export const manifest: ProductManifest = {
    name: 'Stamp',
    scenes: {
        Stamp: {
            // Single scene handles both the landing/list view and the post-install
            // GitHub App callback — the scene logic inspects search params to decide.
            import: () => import('./frontend/scenes/StampScene/StampScene'),
            projectBased: true,
            name: 'Stamp',
            iconType: 'stamp',
        },
    },
    routes: {
        '/stamp': ['Stamp', 'stamp'],
        // GitHub App Setup URL — GitHub redirects here after install with an installation_id search
        // param. Lives under the product's own /stamp namespace, not /integrations/*, so the generic
        // /integrations/:kind/callback scene route can't shadow it (product routes register after core).
        '/stamp/install/callback': ['Stamp', 'stampCallback'],
    },
    redirects: {},
    urls: {
        stamp: (): string => '/stamp',
        stampCallback: (): string => '/stamp/install/callback',
    },
    fileSystemTypes: {},
    treeItemsNew: [],
    treeItemsProducts: [],
}
