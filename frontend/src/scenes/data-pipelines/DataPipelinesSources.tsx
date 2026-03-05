import { useValues } from 'kea'

import { LemonTag } from '@posthog/lemon-ui'

import { FlaggedFeature } from 'lib/components/FlaggedFeature'
import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { DataWarehouseManagedSourcesTable } from 'scenes/data-warehouse/settings/DataWarehouseManagedSourcesTable'
import { DataWarehouseSelfManagedSourcesTable } from 'scenes/data-warehouse/settings/DataWarehouseSelfManagedSourcesTable'
import { dataWarehouseSettingsLogic } from 'scenes/data-warehouse/settings/dataWarehouseSettingsLogic'
import { CustomFunctionList } from 'scenes/custom-functions/list/CustomFunctionsList'

import { SceneDivider } from '~/layout/scenes/components/SceneDivider'
import { SceneSection } from '~/layout/scenes/components/SceneSection'
import { ProductKey } from '~/queries/schema/schema-general'

export function DataPipelinesSources({ action }: { action: JSX.Element }): JSX.Element {
    const { dataWarehouseSources, dataWarehouseSourcesLoading } = useValues(dataWarehouseSettingsLogic)

    return (
        <div className="flex flex-col gap-4">
            {!dataWarehouseSourcesLoading && dataWarehouseSources?.results.length === 0 ? (
                <ProductIntroduction
                    productName="Data Warehouse Source"
                    productKey={ProductKey.DATA_WAREHOUSE}
                    thingName="data source"
                    description="Use data warehouse sources to import data from your external data into Insights."
                    isEmpty={dataWarehouseSources.results.length === 0 && !dataWarehouseSourcesLoading}
                    docsURL="https://posthog.com/docs/data-warehouse"
                    actionElementOverride={action}
                />
            ) : null}

            <FlaggedFeature flag="cdp-script-sources">
                <>
                    <SceneSection
                        title={
                            <span className="flex items-center gap-2">
                                Event sources
                                <LemonTag type="primary" size="small">
                                    Experimental
                                </LemonTag>
                            </span>
                        }
                        description="Insights can expose a webhook that you can configure however you need to receive data from a 3rd party with no in-between service necessary"
                    >
                        <CustomFunctionList logicKey="data-pipelines-custom-functions-source-webhook" type="source_webhook" />
                    </SceneSection>
                    <SceneDivider />
                </>
            </FlaggedFeature>

            <SceneSection
                title="Managed data warehouse sources"
                description="Insights can connect to external sources and automatically import data from them into the Insights data warehouse"
            >
                <DataWarehouseManagedSourcesTable />
            </SceneSection>
            <SceneDivider />
            <SceneSection
                title="Self-managed data warehouse sources"
                description="Connect to your own data sources, making them queryable in Insights"
            >
                <DataWarehouseSelfManagedSourcesTable />
            </SceneSection>
        </div>
    )
}
