import { BindLogic, useActions, useValues } from 'kea'
import insights from 'insights-js'

import { Button } from '@hanzo/elements'

import { AlertWizard } from 'lib/components/Alerting/AlertWizard/AlertWizard'
import {
    AlertCreationView,
    AlertWizardLogicProps,
    alertWizardLogic,
} from 'lib/components/Alerting/AlertWizard/alertWizardLogic'
import { InsightsFunctionList } from 'scenes/insights-functions/list/InsightsFunctionsList'
import { InsightsFunctionTemplateList } from 'scenes/insights-functions/list/InsightsFunctionTemplateList'
import { getFiltersFromSubTemplateId } from 'scenes/insights-functions/list/LinkedInsightsFunctions'

import { CyclotronJobFiltersType } from '~/types'

import {
    ERROR_TRACKING_DESTINATIONS,
    ERROR_TRACKING_SUB_TEMPLATE_IDS,
    ERROR_TRACKING_TRIGGERS,
} from './alertWizardConfig'

const FN_FUNCTION_FILTER_LIST = ERROR_TRACKING_SUB_TEMPLATE_IDS.map(getFiltersFromSubTemplateId).filter(
    (f) => !!f
) as CyclotronJobFiltersType[]

export function ErrorTrackingAlerting(): JSX.Element {
    const wizardProps: AlertWizardLogicProps = {
        logicKey: 'error-tracking',
        subTemplateIds: ERROR_TRACKING_SUB_TEMPLATE_IDS,
        triggers: ERROR_TRACKING_TRIGGERS,
        destinations: ERROR_TRACKING_DESTINATIONS,
        contextId: 'error-tracking',
    }

    return (
        <BindLogic logic={alertWizardLogic} props={wizardProps}>
            <ErrorTrackingAlertingInner />
        </BindLogic>
    )
}

function ErrorTrackingAlertingInner(): JSX.Element {
    const { alertCreationView, subTemplateIds } = useValues(alertWizardLogic)
    const { setAlertCreationView, resetWizard } = useActions(alertWizardLogic)

    if (alertCreationView === AlertCreationView.Wizard) {
        return (
            <AlertWizard
                onCancel={() => {
                    setAlertCreationView(AlertCreationView.None)
                    resetWizard()
                }}
                onSwitchToTraditional={() => {
                    insights.capture('error_tracking_alert_creation_switched_to_traditional', {
                        source: 'wizard',
                    })
                    setAlertCreationView(AlertCreationView.Traditional)
                    resetWizard()
                }}
            />
        )
    }

    if (alertCreationView === AlertCreationView.Traditional) {
        return (
            <InsightsFunctionTemplateList
                type="destination"
                subTemplateIds={subTemplateIds}
                getConfigurationOverrides={(id) => (id ? { filters: getFiltersFromSubTemplateId(id) } : undefined)}
                extraControls={
                    <Button
                        type="secondary"
                        size="small"
                        onClick={() => setAlertCreationView(AlertCreationView.None)}
                    >
                        Cancel
                    </Button>
                }
            />
        )
    }

    return (
        <InsightsFunctionList
            forceFilterGroups={FN_FUNCTION_FILTER_LIST}
            type="internal_destination"
            onDeleteInsightsFunction={(insightsFunction) => {
                insights.capture('error_tracking_alert_deleted', {
                    insights_function_id: insightsFunction.id,
                })
            }}
            onEditInsightsFunction={(insightsFunction) => {
                insights.capture('error_tracking_alert_edit_clicked', {
                    insights_function_id: insightsFunction.id,
                })
            }}
            extraControls={
                <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                        insights.capture('error_tracking_alert_creation_started', {
                            source: 'wizard_button',
                        })
                        setAlertCreationView(AlertCreationView.Wizard)
                    }}
                >
                    New notification
                </Button>
            }
        />
    )
}
