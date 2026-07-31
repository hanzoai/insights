import { toParams } from 'lib/utils'
import { urls } from 'scenes/urls'

import { ExperimentMetric } from '~/queries/schema/schema-general'

import { ProductManifest } from '../../frontend/src/types'

export const manifest: ProductManifest = {
    name: 'Experiments',
    urls: {
        experiment: (
            id: string | number,
            formMode?: string | null,
            options?: {
                metric?: ExperimentMetric
                name?: string
            }
        ): string => {
            const baseUrl = formMode ? `/experiments/${id}/${formMode}` : `/experiments/${id}`
            return `${baseUrl}${options ? `?${toParams(options)}` : ''}`
        },
        experiments: (): string => '/experiments',
        experimentsSharedMetrics: (): string => '/experiments/shared-metrics',
        experimentsSharedMetric: (id: string | number, action?: string): string =>
            action ? `/experiments/shared-metrics/${id}/${action}` : `/experiments/shared-metrics/${id}`,
    },
    fileSystemTypes: {
        experiment: {
            name: 'Experiment',
            iconType: 'experiment',
            href: (ref: string) => urls.experiment(ref),
            iconColor: ['var(--color-product-experiments-light)'],
            filterKey: 'experiment',
        },
    },
    // No treeItemsProducts / treeItemsNew: Experiments is not served by this deployment.
    //
    // Its REST layer (EnterpriseExperimentsViewSet + the experiments / experiment_holdouts /
    // experiment_saved_metrics router registrations) was deleted with ee/ in 203fdd70b8 and never
    // re-registered, so /api/projects/:id/experiments, .../stats/ and .../eligible_feature_flags/
    // all 404. Navigation must not offer a product that cannot answer, and "New experiment" must
    // not open a create flow whose save is guaranteed to fail.
    //
    // Everything under the HTTP layer -- models, tables, query runners, the stats engine, temporal
    // workflows, dags -- is still intact, so re-listing this is a viewset away. That is a product
    // decision, not a defect fix: see the SUNSET row in CLAUDE.md. The urls and fileSystemTypes
    // above stay so existing links and saved items keep resolving.
}
