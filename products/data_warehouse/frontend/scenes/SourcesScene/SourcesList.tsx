import { useValues } from 'kea'

import { IconPlusSmall } from '@hanzo/icons'
import { Button, Tag } from '@hanzo/elements'

import { FlaggedFeature } from 'lib/components/FlaggedFeature'
import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { InsightsFunctionList } from 'scenes/insights-functions/list/InsightsFunctionsList'
import { urls } from 'scenes/urls'

import { SceneDivider } from '~/layout/scenes/components/SceneDivider'
import { SceneSection } from '~/layout/scenes/components/SceneSection'
import { ProductKey } from '~/queries/schema/schema-general'

import { DirectConnectSourcesTable } from 'products/data_warehouse/frontend/shared/components/DirectConnectSourcesTable'
import { ManagedSourcesTable } from 'products/data_warehouse/frontend/shared/components/ManagedSourcesTable'
import { SelfManagedSourcesTable } from 'products/data_warehouse/frontend/shared/components/SelfManagedSourcesTable'
import { sourceManagementLogic } from 'products/data_warehouse/frontend/shared/logics/sourceManagementLogic'

export function SourcesList({ action }: { action: JSX.Element }): JSX.Element {
    const { dataWarehouseSources, dataWarehouseSourcesLoading } = useValues(sourceManagementLogic)

    return (
        <div className="flex flex-col gap-4">
            {!dataWarehouseSourcesLoading && dataWarehouseSources?.results.length === 0 ? (
                <ProductIntroduction
                    productName="Data Warehouse Source"
                    productKey={ProductKey.DATA_WAREHOUSE}
                    thingName="data source"
                    description="Use data warehouse sources to import data from your external data into Insights."
                    isEmpty={dataWarehouseSources.results.length === 0 && !dataWarehouseSourcesLoading}
                    docsURL="https://hanzo.ai/docs/data-warehouse"
                    actionElementOverride={action}
                />
            ) : null}

            <SceneSection
                title="Managed data warehouse sources"
                description="Insights can connect to external sources and automatically import data from them into the Insights data warehouse"
            >
                <ManagedSourcesTable />
            </SceneSection>
            <SceneDivider />

            <FlaggedFeature flag="cdp-script-sources">
                <>
                    <SceneSection
                        title={
                            <span className="flex items-center gap-2">
                                Event sources
                                <Tag type="primary" size="small">
                                    Experimental
                                </Tag>
                            </span>
                        }
                        description="Insights can expose a webhook that you can configure however you need to receive data from a 3rd party with no in-between service necessary"
                        actions={
                            <Button
                                type="primary"
                                size="small"
                                icon={<IconPlusSmall />}
                                to={urls.insightsFunctionNew('template-source-webhook')}
                                data-attr="new-event-source"
                            >
                                New event source
                            </Button>
                        }
                    >
                        <InsightsFunctionList logicKey="data-pipelines-insights-functions-source-webhook" type="source_webhook" />
                    </SceneSection>
                    <SceneDivider />
                </>
            </FlaggedFeature>

            <SceneSection
                title="Direct connect sources"
                description="Query these sources live from Insights. Your data stays where it is, nothing gets imported"
            >
                <DirectConnectSourcesTable />
            </SceneSection>
            <SceneDivider />

            <SceneSection
                title="Self-managed data warehouse sources"
                description="Connect to your own data sources, making them queryable in Insights"
            >
                <SelfManagedSourcesTable />
            </SceneSection>
        </div>
    )
}
