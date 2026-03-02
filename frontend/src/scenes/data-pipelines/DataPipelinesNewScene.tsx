import { kea, path, props, selectors, useValues } from 'kea'

import { NotFound } from 'lib/components/NotFound'
import { capitalizeFirstLetter } from 'lib/utils'
import { availableSourcesDataLogic } from 'scenes/data-warehouse/new/availableSourcesDataLogic'
import { humanizeCustomFunctionType } from 'scenes/custom-functions/custom-function-utils'
import { CustomFunctionTemplateList } from 'scenes/custom-functions/list/CustomFunctionTemplateList'
import { Scene, SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { Breadcrumb } from '~/types'

import type { dataPipelinesNewSceneLogicType } from './DataPipelinesNewSceneType'
import { nonCustomFunctionTemplatesLogic } from './utils/nonCustomFunctionTemplatesLogic'

export type DataPipelinesNewSceneKind = 'transformation' | 'destination' | 'source' | 'site_app'

export type DataPipelinesNewSceneProps = {
    kind: DataPipelinesNewSceneKind
}

export const dataPipelinesNewSceneLogic = kea<dataPipelinesNewSceneLogicType>([
    props({} as DataPipelinesNewSceneProps),
    path(() => ['scenes', 'data-pipelines', 'dataPipelinesNewSceneLogic']),
    selectors({
        logicProps: [() => [(_, props) => props], (props) => props],
        breadcrumbs: [
            () => [(_, props) => props],
            ({ kind }: DataPipelinesNewSceneProps): Breadcrumb[] => {
                const sceneMapping: Record<DataPipelinesNewSceneKind, { scene: Scene; url: () => string }> = {
                    source: { scene: Scene.Sources, url: urls.sources },
                    transformation: { scene: Scene.Transformations, url: urls.transformations },
                    destination: { scene: Scene.Destinations, url: urls.destinations },
                    site_app: { scene: Scene.Apps, url: urls.apps },
                }

                const mapping = sceneMapping[kind]

                return [
                    {
                        key: mapping.scene,
                        name: capitalizeFirstLetter(humanizeCustomFunctionType(kind, true)),
                        path: mapping.url(),
                        iconType: 'data_pipeline',
                    },
                    {
                        key: Scene.DataPipelinesNew,
                        name: 'New ' + humanizeCustomFunctionType(kind),
                        iconType: 'data_pipeline',
                    },
                ]
            },
        ],
    }),
])

export const scene: SceneExport = {
    component: DataPipelinesNewScene,
    logic: dataPipelinesNewSceneLogic,
    paramsToProps: ({ params: { kind } }): (typeof dataPipelinesNewSceneLogic)['props'] => ({
        kind: kind || 'site_app', // Default to 'site_app' for /apps/new route
    }),
}

export function DataPipelinesNewScene(): JSX.Element {
    const { logicProps } = useValues(dataPipelinesNewSceneLogic)
    const { kind } = logicProps

    const { availableSources, availableSourcesLoading } = useValues(availableSourcesDataLogic)
    const { customFunctionTemplatesDataWarehouseSources, customFunctionTemplatesBatchExports } = useValues(
        nonCustomFunctionTemplatesLogic({
            availableSources: availableSources ?? {},
        })
    )

    const humanizedKind = humanizeCustomFunctionType(kind)

    return (
        <SceneContent>
            <SceneTitleSection
                name={`New ${humanizedKind}`}
                resourceType={{
                    type: 'data_pipeline',
                }}
            />

            {kind === 'transformation' ? (
                <CustomFunctionTemplateList type="transformation" />
            ) : kind === 'destination' ? (
                <CustomFunctionTemplateList type="destination" manualTemplates={customFunctionTemplatesBatchExports} />
            ) : kind === 'site_app' ? (
                <CustomFunctionTemplateList type="site_app" />
            ) : kind === 'source' ? (
                <CustomFunctionTemplateList
                    type="source_webhook"
                    manualTemplates={customFunctionTemplatesDataWarehouseSources}
                    manualTemplatesLoading={availableSourcesLoading}
                />
            ) : (
                <NotFound object="Data pipeline new options" />
            )}
        </SceneContent>
    )
}
