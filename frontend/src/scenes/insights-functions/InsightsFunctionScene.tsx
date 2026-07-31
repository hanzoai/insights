import { BindLogic, actions, connect, kea, key, path, props, reducers, selectors, useActions, useValues } from 'kea'
import { actionToUrl, router, urlToAction } from 'kea-router'

import { Divider, Link } from '@hanzo/elements'

import { ActivityLog } from 'lib/components/ActivityLog/ActivityLog'
import { NotFound } from 'lib/components/NotFound'
import { FEATURE_FLAGS } from 'lib/constants'
import { useFileSystemLogView } from 'lib/hooks/useFileSystemLogView'
import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { Skeleton } from 'lib/elements/Skeleton'
import { Tab, Tabs } from 'lib/elements/Tabs'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { capitalizeFirstLetter } from 'lib/utils'
import { DataPipelinesNewSceneKind } from 'scenes/data-pipelines/DataPipelinesNewScene'
import { InsightsFunctionConfiguration } from 'scenes/insights-functions/configuration/InsightsFunctionConfiguration'
import {
    InsightsFunctionConfigurationLogicProps,
    insightsFunctionConfigurationLogic,
} from 'scenes/insights-functions/configuration/insightsFunctionConfigurationLogic'
import { InsightsFunctionLogs } from 'scenes/insights-functions/logs/InsightsFunctionLogs'
import { InsightsFunctionTesting } from 'scenes/insights-functions/testing/InsightsFunctionTesting'
import { Scene, SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import {
    ActivityScope,
    Breadcrumb,
    CyclotronJobFilterPropertyFilter,
    InsightsFunctionType,
    InsightsFunctionTypeType,
} from '~/types'

import type { insightsFunctionSceneLogicType } from './InsightsFunctionSceneType'
import { InsightsFunctionBackfills } from './backfills/InsightsFunctionBackfills'
import { InsightsFunctionIconEditable } from './configuration/InsightsFunctionIcon'
import {
    InsightsFunctionConfigurationClearChangesButton,
    InsightsFunctionConfigurationSaveButton,
} from './configuration/components/InsightsFunctionConfigurationButtons'
import { InsightsFunctionMetrics } from './metrics/InsightsFunctionMetrics'
import { InsightsFunctionSkeleton } from './misc/InsightsFunctionSkeleton'

const INSIGHTS_FUNCTION_SCENE_TABS = ['configuration', 'metrics', 'logs', 'testing', 'backfills', 'history'] as const
export type InsightsFunctionSceneTab = (typeof INSIGHTS_FUNCTION_SCENE_TABS)[number]

const InsightsFunctionSceneMapping: Partial<Record<InsightsFunctionTypeType, { scene: Scene; url: () => string }>> = {
    transformation: { scene: Scene.Transformations, url: urls.transformations },
    destination: { scene: Scene.Destinations, url: urls.destinations },
    site_destination: { scene: Scene.Destinations, url: urls.destinations },
    source_webhook: { scene: Scene.Sources, url: urls.sources },
}

export const insightsFunctionSceneLogic = kea<insightsFunctionSceneLogicType>([
    props({} as InsightsFunctionConfigurationLogicProps),
    key(({ id, templateId }: InsightsFunctionConfigurationLogicProps) => id ?? templateId ?? 'new'),
    path((key) => ['scenes', 'insights-functions', 'insightsFunctionSceneLogic', key]),
    connect((props: InsightsFunctionConfigurationLogicProps) => ({
        values: [
            insightsFunctionConfigurationLogic(props),
            ['configuration', 'type', 'loading', 'loaded', 'teamHasCohortFilters', 'currentProjectId'],
        ],
    })),
    actions({
        setCurrentTab: (tab: InsightsFunctionSceneTab) => ({ tab }),
    }),
    reducers(() => ({
        currentTab: [
            'configuration' as InsightsFunctionSceneTab,
            {
                setCurrentTab: (_, { tab }) => tab,
            },
        ],
    })),
    selectors({
        logicProps: [() => [(_, props) => props], (props) => props],
        alertId: [
            (s) => [s.configuration],
            (configuration: InsightsFunctionType | null): string | undefined => {
                if (!configuration?.filters?.properties) {
                    return undefined
                }
                const alertIdProp = configuration.filters.properties.find(
                    (p: CyclotronJobFilterPropertyFilter) => p.key === 'alert_id'
                )
                const value = alertIdProp?.value
                return value ? String(value) : undefined
            },
        ],
        surveyId: [
            (s) => [s.configuration],
            (configuration: InsightsFunctionType | null): string | undefined => {
                for (const event of configuration?.filters?.events ?? []) {
                    const surveyIdProp = event.properties?.find((p) => p.key === '$survey_id')
                    if (surveyIdProp?.value) {
                        return String(surveyIdProp.value)
                    }
                }
                return undefined
            },
        ],
        isSurveyNotification: [
            (s) => [s.configuration],
            (configuration: InsightsFunctionType | null): boolean => {
                return (configuration?.filters?.events ?? []).some((e) => e.id === 'survey sent')
            },
        ],
        returnTo: [
            () => [router.selectors.searchParams],
            (searchParams: Record<string, string>): string | undefined => searchParams?.returnTo,
        ],
        breadcrumbs: [
            (s) => [
                s.type,
                s.loading,
                s.configuration,
                s.alertId,
                s.surveyId,
                s.isSurveyNotification,
                s.returnTo,
                (_, props) => props.id ?? null,
            ],
            (
                type: InsightsFunctionTypeType,
                loading: boolean,
                configuration: InsightsFunctionType | null,
                alertId: string | undefined,
                surveyId: string | undefined,
                isSurveyNotification: boolean,
                returnTo: string | undefined,
                id: string | null
            ): Breadcrumb[] => {
                if (loading) {
                    return [
                        {
                            key: Scene.InsightsFunction,
                            name: 'Loading...',
                            iconType: 'data_pipeline',
                        },
                    ]
                }

                const finalCrumb: Breadcrumb = {
                    key: Scene.InsightsFunction,
                    name: configuration?.name || '(Untitled)',
                    iconType: 'data_pipeline',
                }

                if (type === 'internal_destination' && alertId) {
                    // returnTo contains the full path back to the alert edit view
                    // Strip the alert_id param for the insight breadcrumb
                    const alertPath = returnTo ?? urls.alert(alertId!)
                    const insightPath = returnTo ? returnTo.split('?')[0] : urls.alerts()

                    return [
                        {
                            key: Scene.Insight,
                            name: 'Insight',
                            path: insightPath,
                            iconType: 'data_pipeline',
                        },
                        {
                            key: 'alert',
                            name: 'Alert',
                            path: alertPath,
                            iconType: 'data_pipeline',
                        },
                        finalCrumb,
                    ]
                }

                if (isSurveyNotification) {
                    const crumbs: Breadcrumb[] = [
                        {
                            key: Scene.Surveys,
                            name: 'surveys',
                            path: urls.surveys(),
                        },
                    ]
                    if (surveyId) {
                        crumbs.push({
                            key: Scene.Survey,
                            name: 'survey',
                            path: urls.survey(surveyId),
                        })
                    }
                    crumbs.push(finalCrumb)
                    return crumbs
                }

                if (type === 'site_app') {
                    return [
                        {
                            key: Scene.Apps,
                            name: 'Apps',
                            path: urls.apps(),
                            iconType: 'data_pipeline',
                        },
                        finalCrumb,
                    ]
                }

                const sceneMapping = InsightsFunctionSceneMapping[type]

                if (sceneMapping) {
                    return [
                        {
                            key: sceneMapping.scene,
                            name: `${capitalizeFirstLetter(type).replace('_', ' ')}s`,
                            path: id ? sceneMapping.url() : urls.dataPipelinesNew(type as DataPipelinesNewSceneKind),
                            iconType: 'data_pipeline',
                        },
                        finalCrumb,
                    ]
                }

                if (type === 'internal_destination') {
                    // Returns a Scene that is closest to the element based on the configuration.
                    // This is used to help the InsightsFunctionScene render correct breadcrumbs and redirections
                    if (configuration?.filters?.events?.some((e) => e.id.includes('error_tracking'))) {
                        // Error tracking scene
                        return [
                            {
                                key: Scene.ErrorTracking,
                                name: 'Error Tracking',
                                path: urls.errorTracking(),
                            },
                            {
                                key: Scene.InsightsFunction,
                                name: 'Alerts',
                                path: urls.errorTrackingConfiguration() + '#selectedSetting=error-tracking-alerting',
                            },
                            finalCrumb,
                        ]
                    }

                    return [
                        {
                            key: Scene.InsightsFunction,
                            name: 'Notifications',
                            path: returnTo,
                        },
                        finalCrumb,
                    ]
                }
                return [
                    {
                        key: Scene.InsightsFunction,
                        name: 'Function',
                    },
                    finalCrumb,
                ]
            },
        ],
    }),
    actionToUrl(({ values }) => ({
        setCurrentTab: () => {
            return [
                router.values.location.pathname,
                {
                    ...router.values.searchParams,
                    tab: values.currentTab,
                },
                router.values.hashParams,
            ]
        },
    })),
    urlToAction(({ actions, values }) => {
        const reactToTabChange = (_: any, search: Record<string, string>): void => {
            const possibleTab = (search.tab ?? 'configuration') as InsightsFunctionSceneTab

            const tab = INSIGHTS_FUNCTION_SCENE_TABS.includes(possibleTab) ? possibleTab : 'configuration'
            if (tab !== values.currentTab) {
                actions.setCurrentTab(tab)
            }
        }

        return {
            // All possible routes for this scene need to be listed here
            [urls.insightsFunction(':id')]: reactToTabChange,
            [urls.errorTrackingAlert(':id')]: reactToTabChange,
        }
    }),
])

export const scene: SceneExport<InsightsFunctionConfigurationLogicProps> = {
    component: InsightsFunctionScene,
    logic: insightsFunctionSceneLogic,
    paramsToProps: ({ params: { id, templateId }, hashParams }) => {
        return {
            id,
            templateId,
            subTemplateId: hashParams.configuration?.sub_template_id,
        }
    },
}

function InsightsFunctionHeader(): JSX.Element {
    const { configuration, logicProps, loading, isLegacyPlugin } = useValues(insightsFunctionConfigurationLogic)
    const { setConfigurationValue, duplicate, deleteInsightsFunction } = useActions(insightsFunctionConfigurationLogic)

    return (
        <>
            <SceneTitleSection
                name={configuration.name}
                description={configuration.description || ''}
                resourceType={{
                    type: 'data_pipeline',
                    forceIcon: (
                        <InsightsFunctionIconEditable
                            logicKey={logicProps.id ?? 'new'}
                            src={configuration.icon_url}
                            onChange={(val) => setConfigurationValue('icon_url', val)}
                            size="small"
                        />
                    ),
                }}
                isLoading={loading}
                onNameChange={(value) => setConfigurationValue('name', value)}
                onDescriptionChange={(value) => setConfigurationValue('description', value)}
                canEdit
                actions={
                    <>
                        {!logicProps.templateId && (
                            <>
                                <More
                                    size="small"
                                    overlay={
                                        <>
                                            {!isLegacyPlugin && (
                                                <Button fullWidth onClick={() => duplicate()}>
                                                    Duplicate
                                                </Button>
                                            )}
                                            <Divider />
                                            <Button status="danger" fullWidth onClick={() => deleteInsightsFunction()}>
                                                Delete
                                            </Button>
                                        </>
                                    }
                                />
                                <Divider vertical />
                            </>
                        )}
                        <InsightsFunctionConfigurationClearChangesButton />
                        <InsightsFunctionConfigurationSaveButton />
                    </>
                }
            />
        </>
    )
}

export function InsightsFunctionScene(): JSX.Element {
    const { currentTab, loading, loaded, logicProps, type, teamHasCohortFilters, currentProjectId } =
        useValues(insightsFunctionSceneLogic)
    const { setCurrentTab } = useActions(insightsFunctionSceneLogic)
    const { featureFlags } = useValues(featureFlagLogic)

    const { id, templateId, subTemplateId } = logicProps

    useFileSystemLogView({
        type: `insights_function/${type ?? ''}`,
        ref: id ?? null,
        enabled: Boolean(id && type && loaded),
        deps: [id, type, loaded],
    })

    if (loading && !loaded) {
        return (
            <div className="flex flex-col gap-4">
                <Skeleton className="w-full h-12" />
                <InsightsFunctionSkeleton />
            </div>
        )
    }

    if (id && !loaded) {
        return <NotFound object="Custom function" />
    }

    if (!templateId && !id) {
        return <NotFound object="Custom function" />
    }

    const tabs: (Tab<InsightsFunctionSceneTab> | null)[] = [
        {
            label: 'Configuration',
            key: 'configuration',
            content: <InsightsFunctionConfiguration id={id} />,
        },

        type === 'site_app' || type === 'site_destination'
            ? null
            : {
                  label: 'Metrics',
                  key: 'metrics',
                  content: <InsightsFunctionMetrics id={id} />,
              },
        type === 'site_app' || type === 'site_destination'
            ? null
            : {
                  label: 'Logs',
                  key: 'logs',
                  content: <InsightsFunctionLogs />,
              },
        type === 'site_app' || type === 'site_destination' || type === 'internal_destination'
            ? null
            : {
                  label: 'Testing',
                  key: 'testing',
                  content: <InsightsFunctionTesting />,
              },

        type === 'destination' && featureFlags[FEATURE_FLAGS.BACKFILL_WORKFLOWS_DESTINATION]
            ? {
                  label: 'Backfills',
                  key: 'backfills',
                  content: <InsightsFunctionBackfills id={id} />,
              }
            : null,

        {
            label: 'History',
            key: 'history',
            content: <ActivityLog id={id} scope={ActivityScope.INSIGHTS_FUNCTION} />,
        },
    ]

    return (
        <SceneContent>
            <BindLogic logic={insightsFunctionConfigurationLogic} props={logicProps}>
                <InsightsFunctionHeader />
                {teamHasCohortFilters && (
                    <Banner type="warning" className="mb-4">
                        <strong>Warning:</strong> This function has "Filter out internal and test users" enabled, but
                        your team's test account filters include cohorts. Cohorts cannot be used in real-time filters
                        and may cause this function to fail. Please update your{' '}
                        <Link to={`/project/${currentProjectId}/settings/project#internal-user-filtering`}>
                            test account filters
                        </Link>{' '}
                        to use inline expressions instead of cohorts.
                    </Banner>
                )}
                {templateId ? (
                    <InsightsFunctionConfiguration templateId={templateId} subTemplateId={subTemplateId} />
                ) : (
                    <Tabs activeKey={currentTab} tabs={tabs} onChange={setCurrentTab} sceneInset={true} />
                )}
            </BindLogic>
        </SceneContent>
    )
}
