import { useActions, useValues } from 'kea'
import { useEffect } from 'react'

import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { humanizeInsightsFunctionType } from 'scenes/insights-functions/insights-function-utils'
import { InsightsFunctionTemplateList } from 'scenes/insights-functions/list/InsightsFunctionTemplateList'
import { InsightsFunctionList } from 'scenes/insights-functions/list/InsightsFunctionsList'
import { insightsFunctionsListLogic } from 'scenes/insights-functions/list/insightsFunctionsListLogic'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneDivider } from '~/layout/scenes/components/SceneDivider'
import { SceneSection } from '~/layout/scenes/components/SceneSection'
import { ProductKey } from '~/queries/schema/schema-general'
import { InsightsFunctionTypeType } from '~/types'

import { nonInsightsFunctionTemplatesLogic } from './utils/nonInsightsFunctionTemplatesLogic'
import { nonInsightsFunctionsLogic } from './utils/nonInsightsFunctionsLogic'

export type DataPipelinesInsightsFunctionsProps = {
    kind: InsightsFunctionTypeType
    additionalKinds?: InsightsFunctionTypeType[]
    action?: JSX.Element
}

export const MAPPING: Partial<Record<InsightsFunctionTypeType, { key: ProductKey; description: string }>> = {
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

export function DataPipelinesInsightsFunctions({
    kind,
    additionalKinds,
    action,
}: DataPipelinesInsightsFunctionsProps): JSX.Element {
    const humanizedKind = humanizeInsightsFunctionType(kind)
    const logicKey = `data-pipelines-insights-functions-${kind}`

    const { insightsFunctions, loading } = useValues(
        insightsFunctionsListLogic({ logicKey, type: kind, additionalTypes: additionalKinds })
    )

    const { insightsFunctionPluginsDestinations, insightsFunctionBatchExports, insightsFunctionPluginsSiteApps } =
        useValues(nonInsightsFunctionsLogic)
    const { loadInsightsFunctionPluginsDestinations, loadInsightsFunctionBatchExports, loadInsightsFunctionPluginsSiteApps } =
        useActions(nonInsightsFunctionsLogic)

    const { insightsFunctionTemplatesBatchExports } = useValues(nonInsightsFunctionTemplatesLogic)

    useEffect(() => {
        if (kind === 'destination') {
            loadInsightsFunctionPluginsDestinations()
            loadInsightsFunctionBatchExports()
        }

        if (kind === 'site_app') {
            loadInsightsFunctionPluginsSiteApps()
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
                    docsURL="https://hanzo.ai/docs/cdp"
                    actionElementOverride={action}
                    isEmpty={insightsFunctions.length === 0 && !loading}
                />
            ) : null}
            <SceneSection>
                <InsightsFunctionList
                    logicKey={logicKey}
                    type={kind}
                    additionalTypes={additionalKinds}
                    manualFunctions={
                        kind === 'destination'
                            ? [...(insightsFunctionPluginsDestinations ?? []), ...(insightsFunctionBatchExports ?? [])]
                            : kind === 'site_app'
                              ? [...(insightsFunctionPluginsSiteApps ?? [])]
                              : undefined
                    }
                />
            </SceneSection>
            <SceneDivider />
            <SceneSection title={`Create a new ${humanizedKind}`}>
                <InsightsFunctionTemplateList
                    type={kind}
                    additionalTypes={additionalKinds}
                    manualTemplates={kind === 'destination' ? insightsFunctionTemplatesBatchExports : undefined}
                    hideComingSoonByDefault
                />
            </SceneSection>
        </SceneContent>
    )
}
