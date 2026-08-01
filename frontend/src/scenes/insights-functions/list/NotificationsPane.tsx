import { useActions } from 'kea'

import { Button } from '@hanzo/elements'

import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'

import { AvailableFeature, CyclotronJobFiltersType, InsightsFunctionSubTemplateIdType } from '~/types'

import { InsightsFunctionList } from './InsightsFunctionsList'
import { insightsFunctionsListLogic } from './insightsFunctionsListLogic'
import { getFiltersFromSubTemplateId } from './LinkedInsightsFunctions'
import { NewNotificationDialog } from './NewNotificationDialog'
import { newNotificationDialogLogic } from './newNotificationDialogLogic'

export interface NotificationsPaneProps {
    /** The sub-template ID that defines the filters, names, and message templates */
    subTemplateId: InsightsFunctionSubTemplateIdType
    /** Description shown above the notification list */
    description: string
    /** Title for the new notification dialog */
    dialogTitle?: string
    /** The billing feature required to use notifications. Defaults to AUDIT_LOGS. */
    requiredFeature?: AvailableFeature
    /** Where the back arrow on a notification's configuration page should return to */
    returnTo?: string
}

export function NotificationsPane({
    subTemplateId,
    description,
    dialogTitle,
    requiredFeature = AvailableFeature.AUDIT_LOGS,
    returnTo,
}: NotificationsPaneProps): JSX.Element {
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
    })

    const insightsFunctionFilterList = [getFiltersFromSubTemplateId(subTemplateId)].filter(
        (f): f is CyclotronJobFiltersType => !!f
    )

    const listLogicProps = { forceFilterGroups: insightsFunctionFilterList, type: 'internal_destination' as const }
    const { loadInsightsFunctions } = useActions(insightsFunctionsListLogic(listLogicProps))
    const onCreated = (): void => {
        loadInsightsFunctions()
    }

    const logicProps = { subTemplateId, onCreated }
    const { openDialog } = useActions(newNotificationDialogLogic(logicProps))

    return (
        <PayGateMini feature={requiredFeature}>
            <div>
                <p>{description}</p>
                <InsightsFunctionList
                    forceFilterGroups={insightsFunctionFilterList}
                    type="internal_destination"
                    returnTo={returnTo}
                    extraControls={
                        <Button
                            type="primary"
                            size="small"
                            disabledReason={restrictedReason ?? undefined}
                            onClick={openDialog}
                        >
                            New notification
                        </Button>
                    }
                />
                <NewNotificationDialog subTemplateId={subTemplateId} onCreated={onCreated} title={dialogTitle} />
            </div>
        </PayGateMini>
    )
}
