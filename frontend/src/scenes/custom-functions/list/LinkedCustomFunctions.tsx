import { useMemo, useState } from 'react'

import { LemonButton } from '@posthog/lemon-ui'

import { CyclotronJobFiltersType, CustomFunctionSubTemplateIdType, CustomFunctionTypeType } from '~/types'

import { CUSTOM_FUNCTION_SUB_TEMPLATE_COMMON_PROPERTIES } from '../sub-templates/sub-templates'
import { CustomFunctionTemplateList } from './CustomFunctionTemplateList'
import { CustomFunctionList } from './CustomFunctionsList'

export type LinkedCustomFunctionsProps = {
    type: CustomFunctionTypeType
    forceFilterGroups?: CyclotronJobFiltersType[]
    subTemplateIds?: CustomFunctionSubTemplateIdType[]
    newDisabledReason?: string
    hideFeedback?: boolean
    emptyText?: string
    queryParams?: Record<string, string>
}

const getFiltersFromSubTemplateId = (
    subTemplateId: CustomFunctionSubTemplateIdType
): CyclotronJobFiltersType | undefined => {
    const commonProperties = CUSTOM_FUNCTION_SUB_TEMPLATE_COMMON_PROPERTIES[subTemplateId]
    return commonProperties.filters ?? undefined
}

export function LinkedCustomFunctions({
    type,
    forceFilterGroups,
    subTemplateIds,
    newDisabledReason,
    hideFeedback,
    emptyText,
    queryParams,
}: LinkedCustomFunctionsProps): JSX.Element | null {
    const [showNewDestination, setShowNewDestination] = useState(false)
    const logicKey = useMemo(() => {
        return JSON.stringify({ type, subTemplateIds, forceFilterGroups })
    }, [type, subTemplateIds, forceFilterGroups])

    // TRICKY: All templates are destinations - internal destinations are just a different source
    // and set by the subtemplate modifier
    const templateType = type === 'internal_destination' ? 'destination' : type

    const getConfigurationOverrides = (
        subTemplateId?: CustomFunctionSubTemplateIdType
    ): CyclotronJobFiltersType | undefined => {
        if (forceFilterGroups && forceFilterGroups.length > 0) {
            return forceFilterGroups[0]
        }
        if (subTemplateId) {
            return getFiltersFromSubTemplateId(subTemplateId)
        }
        return undefined
    }

    const customFunctionFilterList =
        forceFilterGroups ??
        (subTemplateIds?.map(getFiltersFromSubTemplateId).filter((filters) => !!filters) as
            | CyclotronJobFiltersType[]
            | undefined)

    return showNewDestination ? (
        <CustomFunctionTemplateList
            type={templateType}
            subTemplateIds={subTemplateIds}
            getConfigurationOverrides={getConfigurationOverrides}
            queryParams={queryParams}
            extraControls={
                <>
                    <LemonButton type="secondary" size="small" onClick={() => setShowNewDestination(false)}>
                        Cancel
                    </LemonButton>
                </>
            }
        />
    ) : (
        <CustomFunctionList
            key={logicKey}
            forceFilterGroups={customFunctionFilterList}
            type={type}
            hideFeedback={hideFeedback}
            emptyText={emptyText}
            extraControls={
                <>
                    <LemonButton
                        type="primary"
                        size="small"
                        disabledReason={newDisabledReason}
                        onClick={() => setShowNewDestination(true)}
                    >
                        New notification
                    </LemonButton>
                </>
            }
        />
    )
}
