import { FEATURE_FLAGS } from 'lib/constants'
import { urls } from 'scenes/urls'

import { ProductKey } from '~/queries/schema/schema-general'
import { ProductManifest } from '~/types'

export const manifest: ProductManifest = {
    name: 'CDP',
    scenes: {
        Transformations: {
            import: () => import('../../frontend/src/scenes/data-pipelines/TransformationsScene'),
            projectBased: true,
            name: 'Transformations',
            description:
                'Transformations let you modify, filter, and enrich event data to improve data quality, privacy, and consistency.',
            activityScope: 'InsightsFunction',
            defaultDocsPath: '/docs/cdp/transformations',
            iconType: 'data_pipeline',
        },
    },
    routes: {
        '/transformations': ['Transformations', 'transformations'],
    },
    urls: {
        transformations: (): string => '/transformations',
    },
    treeItemsNew: [
        {
            path: `Data/Source`,
            type: 'insights_function/source',
            href: urls.dataPipelinesNew('source'),
            iconColor: ['var(--color-product-data-pipeline-light)'],
            sceneKeys: ['InsightsFunction'],
        },
        {
            path: `Data/Destination`,
            type: 'insights_function/destination',
            href: urls.dataPipelinesNew('destination'),
            iconColor: ['var(--color-product-data-pipeline-light)'],
            sceneKeys: ['InsightsFunction'],
        },
        {
            path: `Data/Transformation`,
            type: 'insights_function/transformation',
            href: urls.dataPipelinesNew('transformation'),
            iconColor: ['var(--color-product-data-pipeline-light)'],
            sceneKeys: ['InsightsFunction'],
        },
        {
            path: `Data/Site app`,
            type: 'insights_function/site_app',
            href: urls.appsNew(),
            iconColor: ['var(--color-product-data-pipeline-light)'],
            sceneKeys: ['InsightsFunction'],
        },
    ],
    treeItemsProducts: [
        {
            path: 'Site Apps',
            intents: [ProductKey.SITE_APPS],
            category: 'Tools',
            type: 'insights_function',
            iconType: 'data_pipeline',
            iconColor: ['var(--color-product-data-pipeline-light)'],
            href: urls.apps(),
            sceneKey: 'Apps',
            sceneKeys: ['Apps'],
        },
        {
            path: `Data pipelines`,
            intents: [
                ProductKey.PIPELINE_BATCH_EXPORTS,
                ProductKey.PIPELINE_DESTINATIONS,
                ProductKey.PIPELINE_TRANSFORMATIONS,
                ProductKey.SITE_APPS,
            ],
            category: 'Tools',
            type: 'insights_function',
            iconType: 'data_pipeline',
            iconColor: ['var(--color-product-data-pipeline-light)'],
            flag: FEATURE_FLAGS.SHOW_DATA_PIPELINES_NAV_ITEM,
        },
    ],
    treeItemsMetadata: [
        {
            path: `Transformations`,
            category: 'Pipeline',
            type: 'insights_function/transformation',
            iconType: 'data_pipeline_metadata',
            href: urls.transformations(),
            sceneKey: 'Transformations',
            sceneKeys: ['Transformations'],
        },
        {
            path: `Destinations`,
            category: 'Pipeline',
            type: 'insights_function/destination',
            iconType: 'data_pipeline_metadata',
            href: urls.destinations(),
            sceneKey: 'Destinations',
            sceneKeys: ['Destinations'],
        },
        {
            path: 'Event ingestion warnings',
            category: 'Pipeline',
            iconType: 'ingestion_warning',
            href: urls.ingestionWarnings(),
            sceneKey: 'IngestionWarnings',
            sceneKeys: ['IngestionWarnings'],
        },
    ],
}
