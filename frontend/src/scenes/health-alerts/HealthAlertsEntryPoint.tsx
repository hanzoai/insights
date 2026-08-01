import { BindLogic, useActions, useValues } from 'kea'
import insights from 'insights-js'

import { Button } from '@hanzo/elements'

import { AlertWizard } from 'lib/components/Alerting/AlertWizard/AlertWizard'
import {
    AlertCreationView,
    AlertWizardLogicProps,
    alertWizardLogic,
    applyKindFilter,
    decorateAlertName,
} from 'lib/components/Alerting/AlertWizard/alertWizardLogic'
import { InsightsFunctionList } from 'scenes/insights-functions/list/InsightsFunctionsList'
import { InsightsFunctionTemplateList } from 'scenes/insights-functions/list/InsightsFunctionTemplateList'
import { getFiltersFromSubTemplateId } from 'scenes/insights-functions/list/LinkedInsightsFunctions'
import { urls } from 'scenes/urls'

import { CyclotronJobFiltersType, InsightsFunctionSubTemplateType } from '~/types'

import {
    HEALTH_ALERT_DESTINATIONS,
    HEALTH_ALERT_SUB_TEMPLATE_IDS,
    HEALTH_ALERT_TRIGGERS,
} from './healthAlertsWizardConfig'

const FN_FUNCTION_FILTER_LIST = HEALTH_ALERT_SUB_TEMPLATE_IDS.map(getFiltersFromSubTemplateId).filter(
    (f) => !!f
) as CyclotronJobFiltersType[]

export interface HealthAlertsEntryPointProps {
    logicKey?: string
    // Restricts the resulting InsightsFunction's filter to a `kind IN (...)` set.
    // The central scene reads this from the `preset_kinds` URL search param so
    // per-page entry points (SDK Health, Pipeline Status) can deep-link in with
    // a scoped wizard. Omit (or pass an empty array) to leave filters
    // unrestricted (every kind).
    presetKinds?: string[]
}

export function HealthAlertsEntryPoint({
    logicKey = 'health-alerts',
    presetKinds,
}: HealthAlertsEntryPointProps = {}): JSX.Element {
    const wizardProps: AlertWizardLogicProps = {
        logicKey,
        subTemplateIds: HEALTH_ALERT_SUB_TEMPLATE_IDS,
        triggers: HEALTH_ALERT_TRIGGERS,
        destinations: HEALTH_ALERT_DESTINATIONS,
        presetTriggerKinds: presetKinds,
    }

    return (
        <BindLogic logic={alertWizardLogic} props={wizardProps}>
            <HealthAlertsEntryPointInner />
        </BindLogic>
    )
}

function HealthAlertsEntryPointInner(): JSX.Element {
    const { alertCreationView, subTemplateIds, selectedKinds } = useValues(alertWizardLogic)
    const { setAlertCreationView, resetWizard } = useActions(alertWizardLogic)

    if (alertCreationView === AlertCreationView.Wizard) {
        return (
            <AlertWizard
                onCancel={() => {
                    setAlertCreationView(AlertCreationView.None)
                    resetWizard()
                }}
                onSwitchToTraditional={() => {
                    insights.capture('health_alerts_creation_switched_to_traditional', { source: 'wizard' })
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
                getConfigurationOverrides={(_id, subTemplate) => {
                    if (!subTemplate) {
                        return undefined
                    }
                    const overrides: Partial<InsightsFunctionSubTemplateType> = {}
                    const filters = applyKindFilter(subTemplate.filters, selectedKinds)
                    if (filters && filters !== subTemplate.filters) {
                        overrides.filters = filters
                    }
                    if (selectedKinds && selectedKinds.length > 0) {
                        if (subTemplate.name) {
                            overrides.name = decorateAlertName(subTemplate.name, selectedKinds)
                        }
                        if (subTemplate.description) {
                            overrides.description = decorateAlertName(subTemplate.description, selectedKinds)
                        }
                    }
                    return Object.keys(overrides).length > 0 ? overrides : undefined
                }}
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
            returnTo={urls.healthAlerts(selectedKinds ?? undefined)}
            onDeleteInsightsFunction={(insightsFunction) => {
                insights.capture('health_alerts_deleted', { insights_function_id: insightsFunction.id })
            }}
            onEditInsightsFunction={(insightsFunction) => {
                insights.capture('health_alerts_edit_clicked', { insights_function_id: insightsFunction.id })
            }}
            extraControls={
                <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                        insights.capture('health_alerts_creation_started', { source: 'wizard_button' })
                        setAlertCreationView(AlertCreationView.Wizard)
                    }}
                >
                    New health alert
                </Button>
            }
        />
    )
}
