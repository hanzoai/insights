import { useActions, useValues } from 'kea'
import insights from 'insights-js'

import { Tabs } from 'lib/elements/Tabs'
import { Link } from 'lib/elements/Link'
import { Tooltip } from 'lib/elements/Tooltip'
import { insightNavLogic } from 'scenes/insights/InsightNav/insightNavLogic'
import { INSIGHT_TYPE_URLS } from 'scenes/insights/utils'
import { INSIGHT_TYPES_METADATA } from 'scenes/saved-insights/SavedInsights'

import { AlertDeletionWarning } from 'products/alerts/frontend/components/AlertDeletionWarning'

import { insightLogic } from '../insightLogic'

export function InsightsNav(): JSX.Element {
    const { insightProps, insight } = useValues(insightLogic)
    const { activeView, tabs } = useValues(insightNavLogic(insightProps))
    const { setActiveView } = useActions(insightNavLogic(insightProps))

    return (
        <>
            {insight.short_id && <AlertDeletionWarning />}
            <Tabs
                activeKey={activeView}
                onChange={(newKey) => {
                    insights.capture('insight type tab clicked', { insight_type: newKey, previous_type: activeView })
                    setActiveView(newKey)
                }}
                tabs={tabs.map(({ label, type, dataAttr }) => ({
                    key: type,
                    label: (
                        <Link to={INSIGHT_TYPE_URLS[type]} preventClick data-attr={dataAttr}>
                            <Tooltip
                                placement="top"
                                title={
                                    INSIGHT_TYPES_METADATA[type].tooltipDescription ||
                                    INSIGHT_TYPES_METADATA[type].description
                                }
                                docLink={INSIGHT_TYPES_METADATA[type].tooltipDocLink}
                            >
                                <span>{label}</span>
                            </Tooltip>
                        </Link>
                    ),
                }))}
            />
        </>
    )
}
