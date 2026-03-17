import { BuiltLogic, LogicWrapper, useValues } from 'kea'

import { IconPlusSmall } from '@hanzo/icons'
import { LemonButton, Spinner } from '@hanzo/lemon-ui'

import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { SupportHeroMascot } from 'lib/components/mascots'
import { useAttachedLogic } from 'lib/logic/scenes/useAttachedLogic'
import { dataWarehouseSettingsLogic } from 'scenes/data-warehouse/settings/dataWarehouseSettingsLogic'
import { urls } from 'scenes/urls'

import { ProductKey } from '~/queries/schema/schema-general'

interface ZendeskSourceSetupPromptProps {
    children: React.ReactNode
    className?: string
    attachTo?: BuiltLogic | LogicWrapper
}

export function ZendeskSourceSetupPrompt({
    children,
    className,
    attachTo,
}: ZendeskSourceSetupPromptProps): JSX.Element {
    const builtDataWarehouseSettingsLogic = dataWarehouseSettingsLogic()
    const { hasZendeskSource, dataWarehouseSourcesLoading } = useValues(builtDataWarehouseSettingsLogic)
    useAttachedLogic(builtDataWarehouseSettingsLogic, attachTo)

    return dataWarehouseSourcesLoading ? (
        <div className="flex justify-center">
            <Spinner />
        </div>
    ) : !hasZendeskSource ? (
        <SetupPrompt className={className} />
    ) : (
        <>{children}</>
    )
}

function SetupPrompt({ className }: Pick<ZendeskSourceSetupPromptProps, 'className'>): JSX.Element {
    return (
        <ProductIntroduction
            customInsights={SupportHeroMascot}
            productName="Data Warehouse Source"
            titleOverride="Bring your data from Zendesk"
            productKey={ProductKey.DATA_WAREHOUSE}
            thingName="data source"
            className={className}
            description="Use data warehouse sources to import data from Zendesk into Insights."
            isEmpty={true}
            docsURL="https://hanzo.ai/docs/data-warehouse"
            actionElementOverride={
                <LemonButton
                    icon={<IconPlusSmall />}
                    type="primary"
                    to={urls.dataWarehouseSourceNew('Zendesk')}
                    children="Create Zendesk source"
                />
            }
        />
    )
}
