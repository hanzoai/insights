import { connect, kea, path, props, selectors } from 'kea'

import { Link } from '@posthog/lemon-ui'

import { FEATURE_FLAGS, type FeatureFlagKey } from 'lib/constants'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { humanizeBatchExportName } from 'scenes/data-pipelines/batch-exports/utils'
import { sourceWizardLogic } from 'scenes/data-warehouse/new/sourceWizardLogic'
import { DATA_WAREHOUSE_SOURCE_ICON_MAP } from 'scenes/data-warehouse/settings/DataWarehouseSourceIcon'
import { userLogic } from 'scenes/userLogic'

import { SourceConfig } from '~/queries/schema/schema-general'
import { BATCH_EXPORT_SERVICE_NAMES, CustomFunctionTemplateStatus, CustomFunctionTemplateType } from '~/types'

import { BATCH_EXPORT_ICON_MAP } from '../batch-exports/BatchExportIcon'
import type { nonCustomFunctionTemplatesLogicType } from './nonCustomFunctionTemplatesLogicType'

export interface NonCustomFunctionTemplatesLogicProps {
    availableSources: Record<string, SourceConfig>
}

type SourceDisplayStatus = {
    status: CustomFunctionTemplateStatus
    descriptionEl: string | JSX.Element
}

function getSourceDisplayStatus(
    connector: SourceConfig,
    unreleased: boolean,
    featureFlag: boolean | undefined
): SourceDisplayStatus {
    const unreleasedDescriptionEl = 'Get notified when this source is available to connect'
    const releasedDescriptionEl = (
        <>
            Data will be synced to Insights and regularly refreshed.{' '}
            <Link to="https://posthog.com/docs/cdp/sources">Learn more</Link>
        </>
    )
    // regardless of release status, those passing the feature flag should see a released source
    if (featureFlag === true) {
        return {
            status: connector.betaSource ? 'beta' : 'stable',
            descriptionEl: releasedDescriptionEl,
        }
    }
    // regardless of release status, those failing the feature flag should see an unreleased source
    if (featureFlag === false) {
        return {
            status: 'coming_soon',
            descriptionEl: unreleasedDescriptionEl,
        }
    }
    // undefined feature flag should see whatever the release status is
    return {
        status: unreleased ? 'coming_soon' : connector.betaSource ? 'beta' : 'stable',
        descriptionEl: unreleased ? unreleasedDescriptionEl : releasedDescriptionEl,
    }
}

export const nonCustomFunctionTemplatesLogic = kea<nonCustomFunctionTemplatesLogicType>([
    props({} as NonCustomFunctionTemplatesLogicProps),
    path((key) => ['scenes', 'data-pipelines', 'utils', 'nonCustomFunctionTemplatesLogic', key]),

    connect(({ availableSources }: NonCustomFunctionTemplatesLogicProps) => ({
        values: [
            sourceWizardLogic({ availableSources }),
            ['connectors', 'manualConnectors'],
            featureFlagLogic,
            ['featureFlags'],
            userLogic,
            ['user'],
        ],
    })),

    selectors({
        customFunctionTemplatesDataWarehouseSources: [
            (s) => [s.connectors, s.manualConnectors, s.featureFlags],
            (connectors, manualConnectors, featureFlags): CustomFunctionTemplateType[] => {
                const managed = connectors.map((connector: SourceConfig): CustomFunctionTemplateType => {
                    const featureFlagDefined = connector.featureFlag !== undefined
                    const featureFlagRaw = featureFlags[connector.featureFlag as FeatureFlagKey]
                    let featureFlagValue: boolean | undefined = undefined
                    if (featureFlagDefined && featureFlagRaw !== undefined) {
                        featureFlagValue = !!featureFlagRaw
                    }
                    const unreleasedValue = !!connector.unreleasedSource
                    const { status, descriptionEl } = getSourceDisplayStatus(
                        connector,
                        unreleasedValue,
                        featureFlagValue
                    )

                    return {
                        id: `managed-${connector.name}`,
                        type: 'source',
                        name: connector.label ?? connector.name,
                        icon_url: connector.iconPath,
                        icon_class_name: connector.iconClassName,
                        status: status,
                        description: descriptionEl,
                        code: '',
                        code_language: 'custom_script',
                        inputs_schema: [],
                        filters: null,
                        masking: null,
                        free: true,
                        featured: connector.featured ?? false,
                    }
                })
                const selfManaged = manualConnectors.map(
                    (source): CustomFunctionTemplateType => ({
                        id: `self-managed-${source.type}`,
                        type: 'source',
                        name: source.name,
                        icon_url: DATA_WAREHOUSE_SOURCE_ICON_MAP[source.type],
                        status: 'stable',
                        description: (
                            <>
                                Data will be queried directly from your data source that you manage.{' '}
                                <Link to="https://posthog.com/docs/cdp/sources">Learn more</Link>
                            </>
                        ),
                        code: '',
                        code_language: 'custom_script',
                        inputs_schema: [],
                        filters: null,
                        masking: null,
                        free: true,
                    })
                )

                return [...managed, ...selfManaged]
            },
        ],

        customFunctionTemplatesBatchExports: [
            (s) => [s.featureFlags, s.user],
            (featureFlags, user): CustomFunctionTemplateType[] => {
                // HTTP is currently only used for Cloud to Cloud migrations and shouldn't be accessible to users
                const httpEnabled =
                    featureFlags[FEATURE_FLAGS.BATCH_EXPORTS_POSTHOG_HTTP] || user?.is_impersonated || user?.is_staff
                // Databricks is currently behind a feature flag
                const databricksEnabled = featureFlags[FEATURE_FLAGS.BATCH_EXPORTS_DATABRICKS]

                const services = BATCH_EXPORT_SERVICE_NAMES.filter(
                    (service) =>
                        (httpEnabled ? true : service !== ('HTTP' as const)) &&
                        (databricksEnabled ? true : service !== ('Databricks' as const))
                )

                return services.map(
                    (service): CustomFunctionTemplateType => ({
                        id: `batch-export-${service}`,
                        type: 'destination',
                        name: humanizeBatchExportName(service),
                        icon_url: BATCH_EXPORT_ICON_MAP[service],
                        status: service === 'Databricks' ? 'beta' : service === 'AzureBlob' ? 'beta' : 'stable',
                        code: '',
                        code_language: 'custom_script',
                        inputs_schema: [],
                        filters: null,
                        masking: null,
                        free: false,
                        description: `${humanizeBatchExportName(service)} batch export`,
                    })
                )
            },
        ],
    }),
])
