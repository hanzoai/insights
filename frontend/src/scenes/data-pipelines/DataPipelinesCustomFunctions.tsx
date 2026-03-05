import { useActions, useValues } from 'kea'
import { useEffect } from 'react'

import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { humanizeCustomFunctionType } from 'scenes/custom-functions/custom-function-utils'
import { CustomFunctionTemplateList } from 'scenes/custom-functions/list/CustomFunctionTemplateList'
import { CustomFunctionList } from 'scenes/custom-functions/list/CustomFunctionsList'
import { customFunctionsListLogic } from 'scenes/custom-functions/list/customFunctionsListLogic'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneDivider } from '~/layout/scenes/components/SceneDivider'
import { SceneSection } from '~/layout/scenes/components/SceneSection'
import { ProductKey } from '~/queries/schema/schema-general'
import { CustomFunctionTypeType } from '~/types'

import { nonCustomFunctionTemplatesLogic } from './utils/nonCustomFunctionTemplatesLogic'
import { nonCustomFunctionsLogic } from './utils/nonCustomFunctionsLogic'

export type DataPipelinesCustomFunctionsProps = {
    kind: CustomFunctionTypeType
    additionalKinds?: CustomFunctionTypeType[]
    action?: JSX.Element
}

export const MAPPING: Partial<Record<CustomFunctionTypeType, { key: ProductKey; description: string }>> = {
    destination: {
        key: ProductKey.PIPELINE_DESTINATIONS,
        description: 'Destinations allow you to send your data to external systems.',
    },
    transformation: {
        key: ProductKey.PIPELINE_TRANSFORMATIONS,
        description:
            'Transformations let you modify, filter, and enrich event data to improve data quality, privacy, and consistency.',
    },
    site_app: {
        key: ProductKey.SITE_APPS,
        description: 'Site apps allow you to add custom functionality to your website using Insights.',
    },
}

export function DataPipelinesCustomFunctions({
    kind,
    additionalKinds,
    action,
}: DataPipelinesCustomFunctionsProps): JSX.Element {
    const humanizedKind = humanizeCustomFunctionType(kind)
    const logicKey = `data-pipelines-custom-functions-${kind}`

    const { customFunctions, loading } = useValues(
        customFunctionsListLogic({ logicKey, type: kind, additionalTypes: additionalKinds })
    )

    const { customFunctionPluginsDestinations, customFunctionBatchExports, customFunctionPluginsSiteApps } =
        useValues(nonCustomFunctionsLogic)
    const { loadCustomFunctionPluginsDestinations, loadCustomFunctionBatchExports, loadCustomFunctionPluginsSiteApps } =
        useActions(nonCustomFunctionsLogic)

    const { customFunctionTemplatesBatchExports } = useValues(nonCustomFunctionTemplatesLogic)

    useEffect(() => {
        if (kind === 'destination') {
            loadCustomFunctionPluginsDestinations()
            loadCustomFunctionBatchExports()
        }

        if (kind === 'site_app') {
            loadCustomFunctionPluginsSiteApps()
        }
    }, [kind]) // oxlint-disable-line react-hooks/exhaustive-deps

    const productInfoMapping = MAPPING[kind]

    return (
        <SceneContent>
            {productInfoMapping ? (
                <ProductIntroduction
                    productName={`Pipeline ${humanizedKind}s`}
                    thingName={humanizedKind}
                    productKey={productInfoMapping.key}
                    description={productInfoMapping.description}
                    docsURL="https://posthog.com/docs/cdp"
                    actionElementOverride={action}
                    isEmpty={customFunctions.length === 0 && !loading}
                />
            ) : null}
            <SceneSection>
                <CustomFunctionList
                    logicKey={logicKey}
                    type={kind}
                    additionalTypes={additionalKinds}
                    manualFunctions={
                        kind === 'destination'
                            ? [...(customFunctionPluginsDestinations ?? []), ...(customFunctionBatchExports ?? [])]
                            : kind === 'site_app'
                              ? [...(customFunctionPluginsSiteApps ?? [])]
                              : undefined
                    }
                />
            </SceneSection>
            <SceneDivider />
            <SceneSection title={`Create a new ${humanizedKind}`}>
                <CustomFunctionTemplateList
                    type={kind}
                    additionalTypes={additionalKinds}
                    manualTemplates={kind === 'destination' ? customFunctionTemplatesBatchExports : undefined}
                    hideComingSoonByDefault
                />
            </SceneSection>
        </SceneContent>
    )
}
