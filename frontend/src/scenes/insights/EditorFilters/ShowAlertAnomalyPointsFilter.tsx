import { useActions, useValues } from 'kea'

import { Checkbox } from '@hanzo/elements'

import { insightLogic } from 'scenes/insights/insightLogic'

import { insightAlertsLogic } from 'products/alerts/frontend/logic/insightAlertsLogic'

export function ShowAlertAnomalyPointsFilter(): JSX.Element | null {
    const { insightProps, insight } = useValues(insightLogic)
    const logic = insightAlertsLogic({ insightId: insight.id!, insightLogicProps: insightProps })
    const { showAlertAnomalyPointsFlag, hasDetectorAlerts } = useValues(logic)
    const { setShowAlertAnomalyPoints } = useActions(logic)

    if (!hasDetectorAlerts) {
        return null
    }

    return (
        <Checkbox
            className="p-1 px-2"
            onChange={() => setShowAlertAnomalyPoints(!showAlertAnomalyPointsFlag)}
            checked={showAlertAnomalyPointsFlag}
            label={<span className="font-normal">Show alert anomaly points</span>}
            size="small"
        />
    )
}
