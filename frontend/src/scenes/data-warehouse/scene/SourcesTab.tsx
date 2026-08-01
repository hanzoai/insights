import { SceneDivider } from '~/layout/scenes/components/SceneDivider'
import { SceneSection } from '~/layout/scenes/components/SceneSection'

import { DirectConnectSourcesTable } from 'products/data_warehouse/frontend/shared/components/DirectConnectSourcesTable'
import { ManagedSourcesTable } from 'products/data_warehouse/frontend/shared/components/ManagedSourcesTable'
import { SelfManagedSourcesTable } from 'products/data_warehouse/frontend/shared/components/SelfManagedSourcesTable'

export function SourcesTab(): JSX.Element {
    return (
        <div className="flex flex-col gap-4">
            <SceneSection
                title="Managed data warehouse sources"
                description="Insights can connect to external sources and automatically import data from them into the Insights data warehouse"
            >
                <ManagedSourcesTable />
            </SceneSection>
            <SceneDivider />
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
