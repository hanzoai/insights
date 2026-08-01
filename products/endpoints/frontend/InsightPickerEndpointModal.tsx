import { useActions, useValues } from 'kea'
import { BindLogic } from 'kea'

import { IconEndpoints, IconPlus } from '@hanzo/icons'

import { IconInsightRetention, IconInsightTrends } from 'lib/elements/icons'
import { Button } from 'lib/elements/Button'
import { Modal } from 'lib/elements/Modal'
import { Popover } from 'lib/elements/Popover'
import { addSavedInsightsModalLogic } from 'scenes/saved-insights/addSavedInsightsModalLogic'
import { INSIGHT_TYPES_METADATA } from 'scenes/saved-insights/SavedInsights'
import { SavedInsightsTable } from 'scenes/saved-insights/SavedInsightsTable'
import { urls } from 'scenes/urls'

import { EndpointQueryNode, InsightsQLQuery, NodeKind } from '~/queries/schema/schema-general'
import { isNodeWithSource } from '~/queries/utils'
import { InsightType, QueryBasedInsightModel } from '~/types'

import { EndpointFromInsightModal } from './EndpointFromInsightModal'
import { endpointLogic } from './endpointLogic'
import { insightPickerEndpointModalLogic } from './insightPickerEndpointModalLogic'

const UNSUPPORTED_INSIGHT_TYPES = new Set([
    InsightType.FUNNELS,
    InsightType.PATHS,
    InsightType.STICKINESS,
    InsightType.JSON,
    InsightType.HOG,
])

const UNSUPPORTED_QUERY_KINDS = new Set([NodeKind.FunnelsQuery, NodeKind.PathsQuery, NodeKind.StickinessQuery])

function isInsightSupported(insight: QueryBasedInsightModel): boolean {
    const query = insight.query
    if (!query) {
        return true
    }
    const kind = isNodeWithSource(query) ? (query as { source?: { kind?: string } }).source?.kind : query.kind
    return !kind || !UNSUPPORTED_QUERY_KINDS.has(kind as NodeKind)
}

const QUICK_CREATE_TYPES = [
    { type: InsightType.TRENDS, icon: IconInsightTrends, label: 'Trend' },
    { type: InsightType.RETENTION, icon: IconInsightRetention, label: 'Retention' },
]

export function InsightPickerEndpointModal(): JSX.Element {
    const { isOpen, selectedInsight, showMoreInsightTypes } = useValues(insightPickerEndpointModalLogic)
    const { closeModal, selectInsight, toggleShowMoreInsightTypes } = useActions(insightPickerEndpointModalLogic)
    const { openCreateFromInsightModal } = useActions(endpointLogic)

    // Safe cast: unsupported query types (FunnelsQuery, PathsQuery, StickinessQuery)
    // are filtered out via isInsightSupported on the SavedInsightsTable
    const insightQuery: InsightsQLQuery | EndpointQueryNode | null = selectedInsight?.query
        ? isNodeWithSource(selectedInsight.query)
            ? (selectedInsight.query.source as unknown as InsightsQLQuery | EndpointQueryNode)
            : (selectedInsight.query as unknown as InsightsQLQuery | EndpointQueryNode)
        : null

    const additionalTypes = Object.entries(INSIGHT_TYPES_METADATA).filter(
        ([type, meta]) =>
            meta.inMenu &&
            !UNSUPPORTED_INSIGHT_TYPES.has(type as InsightType) &&
            !QUICK_CREATE_TYPES.some((qt) => qt.type === type)
    )

    return (
        <>
            <BindLogic logic={addSavedInsightsModalLogic} props={{}}>
                <Modal
                    title="New insight-based endpoint"
                    onClose={closeModal}
                    isOpen={isOpen}
                    width="min(80vw, 64rem)"
                >
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3 p-4 bg-surface-secondary rounded-lg">
                            <IconPlus className="text-2xl text-secondary shrink-0" />
                            <div className="flex-1 min-w-[200px]">
                                <div className="font-semibold text-base">Create an endpoint from a new insight</div>
                                <div className="text-sm text-secondary">
                                    <>
                                        Once the insight is saved, open the right side panel and click
                                        <br /> <IconEndpoints /> <code>Create endpoint</code>.
                                    </>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {QUICK_CREATE_TYPES.map(({ type, icon: Icon, label }) => (
                                    <Button
                                        key={type}
                                        type="primary"
                                        icon={<Icon />}
                                        to={urls.insightNew({ type, sceneSource: 'endpoints' })}
                                        tooltip={INSIGHT_TYPES_METADATA[type]?.description}
                                        data-attr={`endpoint-quick-create-${type.toLowerCase()}`}
                                    >
                                        {label}
                                    </Button>
                                ))}
                                <Popover
                                    visible={showMoreInsightTypes}
                                    onClickOutside={() => toggleShowMoreInsightTypes()}
                                    overlay={
                                        <div className="p-2 space-y-1 min-w-48">
                                            {additionalTypes.map(([type, metadata]) => {
                                                const Icon = metadata.icon
                                                return (
                                                    <Button
                                                        key={type}
                                                        type="tertiary"
                                                        fullWidth
                                                        icon={Icon ? <Icon /> : undefined}
                                                        to={urls.insightNew({
                                                            type: type as InsightType,
                                                            sceneSource: 'endpoints',
                                                        })}
                                                        data-attr={`endpoint-create-${type.toLowerCase()}`}
                                                    >
                                                        {metadata.name}
                                                    </Button>
                                                )
                                            })}
                                        </div>
                                    }
                                >
                                    <Button type="secondary" onClick={() => toggleShowMoreInsightTypes()}>
                                        More
                                    </Button>
                                </Popover>
                            </div>
                        </div>

                        <div>
                            <div className="font-semibold text-base mb-2">
                                Create an endpoint from an existing insight
                            </div>
                            <SavedInsightsTable
                                onToggle={(insight: QueryBasedInsightModel) => {
                                    selectInsight(insight)
                                    openCreateFromInsightModal()
                                }}
                                filterFn={isInsightSupported}
                            />
                        </div>
                    </div>
                </Modal>
            </BindLogic>

            {insightQuery && (
                <EndpointFromInsightModal insightQuery={insightQuery} insightShortId={selectedInsight?.short_id} />
            )}
        </>
    )
}
