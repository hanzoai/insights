import { connect, kea, path } from 'kea'
import { loaders } from 'kea-loaders'

import api from 'lib/api'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { parseGithubRepoURL } from 'lib/utils'
import { sourceWizardLogic } from 'scenes/data-warehouse/new/sourceWizardLogic'
import { userLogic } from 'scenes/userLogic'

import { InsightsFunctionType, PluginConfigTypeNew, PluginType } from '~/types'

import { BATCH_EXPORT_ICON_MAP } from '../batch-exports/BatchExportIcon'
import type { nonInsightsFunctionsLogicType } from './nonInsightsFunctionsLogicType'

export const nonInsightsFunctionsLogic = kea<nonInsightsFunctionsLogicType>([
    path((key) => ['scenes', 'data-pipelines', 'utils', 'nonInsightsFunctionsLogic', key]),

    connect(() => ({
        values: [sourceWizardLogic, ['connectors'], featureFlagLogic, ['featureFlags'], userLogic, ['user']],
    })),

    loaders(() => ({
        insightsFunctionPluginsDestinations: [
            null as InsightsFunctionType[] | null,
            {
                // NOTE: This is super temporary until we have fully migrated off of plugins
                loadInsightsFunctionPluginsDestinations: async () => {
                    const [pluginConfigs, plugins] = await Promise.all([
                        api.loadPaginatedResults<PluginConfigTypeNew>(
                            `api/projects/@current/pipeline_destination_configs`
                        ),
                        api.loadPaginatedResults<PluginType>(`api/organizations/@current/pipeline_destinations`),
                    ])

                    const pluginsById = Object.fromEntries(plugins.map((plugin) => [plugin.id, plugin]))

                    const customfunctions: InsightsFunctionType[] = []

                    for (const pluginConfig of pluginConfigs) {
                        const plugin = pluginsById[pluginConfig.plugin]

                        let iconUrl = plugin.icon ?? 'static/images/plugin-default.png'

                        try {
                            const { user, repo, path } = parseGithubRepoURL(plugin.url || '')
                            iconUrl = `https://raw.githubusercontent.com/${user}/${repo}/${path || 'main'}/logo.png`
                        } catch {
                            // Do nothing
                        }

                        customfunctions.push({
                            id: `plugin-${pluginConfig.id}`,
                            name: pluginConfig.name || plugin?.name || 'Unknown app',
                            description: pluginConfig.description || plugin?.description || '',
                            type: 'destination',
                            created_by: null,
                            created_at: '',
                            updated_at: pluginConfig.updated_at,
                            enabled: pluginConfig.enabled,
                            execution_order: undefined,
                            iql: '',
                            icon_url: iconUrl,
                        })
                    }

                    return customfunctions
                },
            },
        ],

        insightsFunctionPluginsSiteApps: [
            null as InsightsFunctionType[] | null,
            {
                // NOTE: This is super temporary until we have fully migrated off of plugins
                loadInsightsFunctionPluginsSiteApps: async () => {
                    const [pluginConfigs, plugins] = await Promise.all([
                        api.loadPaginatedResults<PluginConfigTypeNew>(
                            `api/projects/@current/pipeline_frontend_apps_configs`
                        ),
                        api.loadPaginatedResults<PluginType>(`api/organizations/@current/pipeline_frontend_apps`),
                    ])

                    const pluginsById = Object.fromEntries(plugins.map((plugin) => [plugin.id, plugin]))

                    const customfunctions: InsightsFunctionType[] = []

                    for (const pluginConfig of pluginConfigs) {
                        const plugin = pluginsById[pluginConfig.plugin]

                        let iconUrl = plugin.icon ?? 'static/images/plugin-default.png'

                        try {
                            const { user, repo, path } = parseGithubRepoURL(plugin.url || '')
                            iconUrl = `https://raw.githubusercontent.com/${user}/${repo}/${path || 'main'}/logo.png`
                        } catch {
                            // Do nothing
                        }

                        customfunctions.push({
                            id: `plugin-${pluginConfig.id}`,
                            name: pluginConfig.name || plugin?.name || 'Unknown app',
                            description: pluginConfig.description || plugin?.description || '',
                            type: 'destination',
                            created_by: null,
                            created_at: '',
                            updated_at: pluginConfig.updated_at,
                            enabled: pluginConfig.enabled,
                            execution_order: undefined,
                            iql: '',
                            icon_url: iconUrl,
                        })
                    }

                    return customfunctions
                },
            },
        ],

        insightsFunctionBatchExports: [
            null as InsightsFunctionType[] | null,
            {
                loadInsightsFunctionBatchExports: async () => {
                    const response = await api.batchExports.list()
                    const results = response.results
                    const insightsFunctions: InsightsFunctionType[] = []

                    for (const batchExport of results) {
                        // TODO - exclude Workflows from here
                        insightsFunctions.push({
                            id: `batch-export-${batchExport.id}`,
                            name: batchExport.name,
                            description: `${batchExport.destination.type} batch export`,
                            type: 'destination',
                            created_by: null,
                            created_at: batchExport.created_at,
                            updated_at: batchExport.created_at,
                            enabled: !batchExport.paused,
                            iql: '',
                            icon_url: BATCH_EXPORT_ICON_MAP[batchExport.destination.type],
                            execution_order: undefined,
                        })
                    }

                    return insightsFunctions
                },
            },
        ],
    })),
])
