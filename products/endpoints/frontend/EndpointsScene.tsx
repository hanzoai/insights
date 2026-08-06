import { BindLogic, useValues } from 'kea'
import { router } from 'kea-router'

import { IconPlusSmall } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { BigLeaguesHog } from 'lib/components/mascots'
import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { Shortcut } from 'lib/components/Shortcuts/Shortcut'
import { keyBinds } from 'lib/components/Shortcuts/shortcuts'
import { Tab, Tabs } from 'lib/elements/Tabs'
import { sceneConfigurations } from 'scenes/scenes'
import { Scene, SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { ProductKey } from '~/queries/schema/schema-general'
import { AccessControlLevel, AccessControlResourceType } from '~/types'

import { Endpoints } from './Endpoints'
import { endpointsLogic } from './endpointsLogic'
import { EndpointsUsage } from './EndpointsUsage'
import { endpointsUsageLogic } from './endpointsUsageLogic'
import { InsightPickerEndpointModal } from './InsightPickerEndpointModal'
import { OverlayForNewEndpointMenu } from './newEndpointMenu'

const ENDPOINTS_PRODUCT_DESCRIPTION =
    'Create reusable SQL queries and expose them as API endpoints. Query your data programmatically from any application.'
const ENDPOINTS_USAGE_PRODUCT_DESCRIPTION =
    'Monitor endpoint execution metrics including bytes read, CPU usage, and query duration. Compare materialized vs inline executions.'

export const scene: SceneExport = {
    component: EndpointsScene,
    logic: endpointsLogic,
    productKey: ProductKey.ENDPOINTS,
}

export function EndpointsScene(): JSX.Element {
    const { activeTab } = useValues(endpointsLogic)

    const tabs: Tab<string>[] = [
        {
            key: 'endpoints',
            label: 'Endpoints',
            content: <Endpoints />,
            link: urls.endpoints(),
        },
        {
            key: 'usage',
            label: 'Usage',
            content: <EndpointsUsage />,
            link: urls.endpointsUsage(),
        },
    ]
    return (
        <BindLogic logic={endpointsLogic} props={{}}>
            <BindLogic logic={endpointsUsageLogic} props={{}}>
                <SceneContent>
                    <SceneTitleSection
                        name={sceneConfigurations[Scene.EndpointsScene].name}
                        description={sceneConfigurations[Scene.EndpointsScene].description}
                        resourceType={{
                            type: sceneConfigurations[Scene.EndpointsScene].iconType || 'default_icon_type',
                        }}
                        actions={
                            <Shortcut
                                name="EndpointsNew"
                                keybind={[keyBinds.new]}
                                intent="New endpoint"
                                interaction="click"
                                scope={Scene.EndpointsScene}
                            >
                                <AccessControlAction
                                    resourceType={AccessControlResourceType.Endpoint}
                                    minAccessLevel={AccessControlLevel.Editor}
                                >
                                    <Button
                                        type="primary"
                                        to={urls.sqlEditor({ source: 'endpoint' })}
                                        sideAction={{
                                            dropdown: {
                                                placement: 'bottom-end',
                                                className: 'new-endpoint-overlay',
                                                actionable: true,
                                                overlay: <OverlayForNewEndpointMenu />,
                                            },
                                            'data-attr': 'new-endpoint-dropdown',
                                        }}
                                        data-attr="new-endpoint-button"
                                        size="small"
                                        icon={<IconPlusSmall />}
                                    >
                                        New
                                    </Button>
                                </AccessControlAction>
                            </Shortcut>
                        }
                    />
                    <ProductIntroduction
                        productName="endpoints"
                        productKey={ProductKey.ENDPOINTS}
                        thingName="endpoint"
                        description={
                            activeTab === 'usage' ? ENDPOINTS_USAGE_PRODUCT_DESCRIPTION : ENDPOINTS_PRODUCT_DESCRIPTION
                        }
                        docsURL="https://hanzo.ai/docs/endpoints"
                        customHog={BigLeaguesHog}
                        isEmpty={false}
                        action={() => router.actions.push(urls.sqlEditor({ source: 'endpoint' }))}
                    />
                    <Tabs activeKey={activeTab} data-attr="endpoints-tabs" tabs={tabs} sceneInset />
                    <InsightPickerEndpointModal />
                </SceneContent>
            </BindLogic>
        </BindLogic>
    )
}
