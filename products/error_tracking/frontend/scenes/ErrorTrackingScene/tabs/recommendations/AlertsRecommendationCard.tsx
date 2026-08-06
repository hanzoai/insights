import { BindLogic, useActions, useValues } from 'kea'
import { router } from 'kea-router'
import insights from 'insights-js'

import { Button, Modal } from '@hanzo/elements'

import { AlertWizard } from 'lib/components/Alerting/AlertWizard/AlertWizard'
import {
    AlertCreationView,
    AlertWizardLogicProps,
    alertWizardLogic,
} from 'lib/components/Alerting/AlertWizard/alertWizardLogic'

import { InsightsFunctionSubTemplateIdType } from '~/types'

import {
    ERROR_TRACKING_DESTINATIONS,
    ERROR_TRACKING_SUB_TEMPLATE_IDS,
    ERROR_TRACKING_TRIGGERS,
} from '../../../ErrorTrackingConfigurationScene/alerting/alertWizardConfig'
import { errorTrackingConfigurationSettingUrl } from './configurationSettingUrl'
import { ListRecommendationCard } from './ListRecommendationCard'
import { recommendationsTabLogic } from './recommendationsTabLogic'
import { ALERT_RECOMMENDATION_INFO, AlertsRecommendation } from './types'

export function AlertsRecommendationCard({
    recommendation,
    dismissed,
}: {
    recommendation: AlertsRecommendation
    dismissed?: boolean
}): JSX.Element | null {
    const { refreshRecommendation, setOpenAlertTriggerKey } = useActions(recommendationsTabLogic)
    const { openAlertTriggerKey } = useValues(recommendationsTabLogic)
    const alerts = recommendation.meta.alerts ?? []

    if (alerts.length === 0) {
        if (recommendation.computed_at === null) {
            return (
                <ListRecommendationCard
                    recommendationId={recommendation.id}
                    title="Alert coverage"
                    description="Stay ahead of new and resurfacing issues."
                    dismissed={dismissed}
                    items={[]}
                    progressLabel="configured"
                />
            )
        }
        return null
    }

    const items = alerts
        .map((alert) => {
            const info = ALERT_RECOMMENDATION_INFO[alert.key]
            if (!info) {
                return null
            }
            return {
                key: alert.key,
                enabled: alert.enabled,
                name: info.name,
                reason: info.reason,
                action: (
                    <Button
                        size="xsmall"
                        type="secondary"
                        onClick={() => {
                            insights.capture('error_tracking_alert_creation_started', {
                                source: 'recommendation_modal',
                                trigger_key: alert.key,
                            })
                            setOpenAlertTriggerKey(alert.key)
                        }}
                    >
                        Create alert
                    </Button>
                ),
            }
        })
        .filter((i): i is NonNullable<typeof i> => i !== null)

    return (
        <>
            <ListRecommendationCard
                recommendationId={recommendation.id}
                title="Alert coverage"
                description="Stay ahead of new and resurfacing issues."
                dismissed={dismissed}
                items={items}
                progressLabel="configured"
            />
            {openAlertTriggerKey && (
                <AlertsRecommendationWizardModal
                    triggerKey={openAlertTriggerKey}
                    onClose={() => {
                        setOpenAlertTriggerKey(null)
                        refreshRecommendation(recommendation.id)
                    }}
                />
            )}
        </>
    )
}

function AlertsRecommendationWizardModal({
    triggerKey,
    onClose,
}: {
    triggerKey: InsightsFunctionSubTemplateIdType
    onClose: () => void
}): JSX.Element {
    const wizardProps: AlertWizardLogicProps = {
        logicKey: `error-tracking-recommendation-${triggerKey}`,
        subTemplateIds: ERROR_TRACKING_SUB_TEMPLATE_IDS,
        triggers: ERROR_TRACKING_TRIGGERS,
        destinations: ERROR_TRACKING_DESTINATIONS,
        disableUrlSync: true,
        presetTriggerKey: triggerKey,
        contextId: 'error-tracking',
        onAlertCreated: onClose,
    }

    return (
        <Modal isOpen onClose={onClose} width={560} simple>
            <BindLogic logic={alertWizardLogic} props={wizardProps}>
                <AlertsRecommendationWizardContent onClose={onClose} />
            </BindLogic>
        </Modal>
    )
}

function AlertsRecommendationWizardContent({ onClose }: { onClose: () => void }): JSX.Element {
    const { setAlertCreationView, resetWizard } = useActions(alertWizardLogic)

    return (
        <div className="p-4">
            <AlertWizard
                hideTriggerStep
                hideCloseButton
                onCancel={() => {
                    setAlertCreationView(AlertCreationView.None)
                    resetWizard()
                    onClose()
                }}
                onSwitchToTraditional={() => {
                    insights.capture('error_tracking_alert_creation_switched_to_traditional', {
                        source: 'recommendation_modal',
                    })
                    resetWizard()
                    onClose()
                    router.actions.push(errorTrackingConfigurationSettingUrl('error-tracking-alerting'))
                }}
            />
        </div>
    )
}
