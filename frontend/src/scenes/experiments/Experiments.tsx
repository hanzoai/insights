import { useActions, useValues } from 'kea'
import { router } from 'kea-router'
import { useState } from 'react'

import { Dialog, Input, Select, Tag, Tooltip, toast } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { ActivityLog } from 'lib/components/ActivityLog/ActivityLog'
import { AppShortcut } from 'lib/components/AppShortcuts/AppShortcut'
import { keyBinds } from 'lib/components/AppShortcuts/shortcuts'
import { MemberSelect } from 'lib/components/MemberSelect'
import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { ExperimentsMascot } from 'lib/components/mascots'
import { dayjs } from 'lib/dayjs'
import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { Divider } from 'lib/elements/Divider'
import { Progress } from 'lib/elements/Progress'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { TableLink } from 'lib/elements/Table/TableLink'
import { atColumn, createdAtColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { Tabs } from 'lib/elements/Tabs'
import { pluralize } from 'lib/utils'
import { deleteWithUndo } from 'lib/utils/deleteWithUndo'
import { addProductIntentForCrossSell } from 'lib/utils/product-intents'
import stringWithWBR from 'lib/utils/stringWithWBR'
import MaxTool from 'scenes/max/MaxTool'
import { useMaxTool } from 'scenes/max/useMaxTool'
import { Scene, SceneExport } from 'scenes/sceneTypes'
import { QuickSurveyModal } from 'scenes/surveys/QuickSurveyModal'
import { QuickSurveyType } from 'scenes/surveys/quick-create/types'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { ProductIntentContext, ProductKey } from '~/queries/schema/schema-general'
import {
    AccessControlLevel,
    AccessControlResourceType,
    ActivityScope,
    Experiment,
    ExperimentProgressStatus,
    ExperimentsTabs,
} from '~/types'

import { DuplicateExperimentModal } from './DuplicateExperimentModal'
import { ExperimentVelocityStats } from './ExperimentVelocityStats'
import { StatusTag } from './ExperimentView/components'
import { ExperimentsSettings } from './ExperimentsSettings'
import { Holdouts } from './Holdouts'
import { SharedMetrics } from './SharedMetrics/SharedMetrics'
import {
    EXPERIMENTS_PER_PAGE,
    ExperimentsFilters,
    experimentsLogic,
    getExperimentStatus,
    getShippedVariantKey,
    isSingleVariantShipped,
} from './experimentsLogic'
import { isLegacyExperiment } from './utils'

export const scene: SceneExport = {
    component: Experiments,
    logic: experimentsLogic,
    productKey: ProductKey.EXPERIMENTS,
}

export const EXPERIMENTS_PRODUCT_DESCRIPTION =
    'Experiments help you test changes to your product to see which changes will lead to optimal results. Automatic statistical calculations let you see if the results are valid or if they are likely just a chance occurrence.'

// Component for the survey button using QuickSurveyModal
const ExperimentSurveyButton = ({
    experiment,
    onOpenModal,
}: {
    experiment: Experiment
    onOpenModal: () => void
}): JSX.Element => {
    // Don't show the button if there's no feature flag associated with the experiment
    if (!experiment.feature_flag) {
        return <></>
    }

    return (
        <Button onClick={onOpenModal} size="small" fullWidth data-attr="create-survey">
            Create survey
        </Button>
    )
}

const getExperimentDuration = (experiment: Experiment): number | undefined => {
    return experiment.end_date
        ? dayjs(experiment.end_date).diff(dayjs(experiment.start_date), 'day')
        : experiment.start_date
          ? dayjs().diff(dayjs(experiment.start_date), 'day')
          : undefined
}

const ExperimentsTableFilters = ({
    filters,
    onFiltersChange,
}: {
    filters: ExperimentsFilters
    onFiltersChange: (filters: ExperimentsFilters, replace?: boolean) => void
}): JSX.Element => {
    return (
        <div className="flex justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-6">
                <AppShortcut
                    name="SearchExperiments"
                    keybind={[keyBinds.filter]}
                    intent="Search experiments"
                    interaction="click"
                    scope={Scene.Experiments}
                >
                    <Input
                        type="search"
                        placeholder="Search experiments"
                        onChange={(search) => onFiltersChange({ search, page: 1 })}
                        value={filters.search || ''}
                    />
                </AppShortcut>
                <div className="flex items-center gap-2">
                    <span>
                        <b>Status</b>
                    </span>
                    <Select
                        size="xsmall"
                        onChange={(status) => {
                            if (status === 'all') {
                                const { status: _, ...restFilters } = filters
                                onFiltersChange({ ...restFilters, page: 1 }, true)
                            } else {
                                onFiltersChange({ status: status as ExperimentProgressStatus, page: 1 })
                            }
                        }}
                        options={
                            [
                                { label: 'All', value: 'all' },
                                { label: 'Draft', value: ExperimentProgressStatus.Draft },
                                { label: 'Running / Paused', value: ExperimentProgressStatus.Running },
                                { label: 'Complete', value: ExperimentProgressStatus.Complete },
                            ] as { label: string; value: string }[]
                        }
                        value={filters.status ?? 'all'}
                        dropdownMatchSelectWidth={false}
                        dropdownMaxContentWidth
                    />
                    <span className="ml-1">
                        <b>Created by</b>
                    </span>
                    <MemberSelect
                        defaultLabel="Any user"
                        value={filters.created_by_id ?? null}
                        size="xsmall"
                        onChange={(user) => {
                            if (!user) {
                                const { created_by_id, ...restFilters } = filters
                                onFiltersChange({ ...restFilters, page: 1 }, true)
                            } else {
                                onFiltersChange({ created_by_id: user.id, page: 1 })
                            }
                        }}
                    />
                    <span className="ml-1">
                        <b>Archived</b>
                    </span>
                    <Select
                        size="xsmall"
                        onChange={(value) => {
                            onFiltersChange({ archived: value === 'archived', page: 1 })
                        }}
                        options={[
                            { label: 'Active', value: 'active' },
                            { label: 'Archived', value: 'archived' },
                        ]}
                        value={filters.archived ? 'archived' : 'active'}
                        dropdownMatchSelectWidth={false}
                        dropdownMaxContentWidth
                    />
                </div>
            </div>
            <ExperimentVelocityStats />
        </div>
    )
}

const ExperimentsTable = ({
    openDuplicateModal,
    openSurveyModal,
}: {
    openDuplicateModal: (experiment: Experiment) => void
    openSurveyModal: (experiment: Experiment) => void
}): JSX.Element => {
    const { currentProjectId, experiments, experimentsLoading, tab, shouldShowEmptyState, filters, count, pagination } =
        useValues(experimentsLogic)
    const { loadExperiments, archiveExperiment, setExperimentsFilters } = useActions(experimentsLogic)

    const page = filters.page || 1
    const startCount = count === 0 ? 0 : (page - 1) * EXPERIMENTS_PER_PAGE + 1
    const endCount = page * EXPERIMENTS_PER_PAGE < count ? page * EXPERIMENTS_PER_PAGE : count

    const columns: TableColumns<Experiment> = [
        {
            title: 'Name',
            dataIndex: 'name',
            className: 'ph-no-capture',
            sticky: true,
            width: '40%',
            render: function Render(_, experiment: Experiment) {
                return (
                    <TableLink
                        to={experiment.id ? urls.experiment(experiment.id) : undefined}
                        title={
                            <>
                                {stringWithWBR(experiment.name, 17)}
                                {experiment.type === 'web' && (
                                    <Tag type="default" className="ml-1">
                                        No-code
                                    </Tag>
                                )}
                                {isLegacyExperiment(experiment) && (
                                    <Tooltip
                                        title="This experiment uses the legacy engine, so some features and improvements may be missing."
                                        docLink="https://hanzo.ai/docs/experiments/new-experimentation-engine"
                                    >
                                        <Tag type="warning" className="ml-1">
                                            Legacy
                                        </Tag>
                                    </Tooltip>
                                )}
                                {isSingleVariantShipped(experiment) && (
                                    <Tooltip
                                        title={`Variant "${getShippedVariantKey(experiment)}" has been rolled out to 100% of users`}
                                    >
                                        <Tag type="completion" className="ml-1">
                                            <b className="uppercase">100% rollout</b>
                                        </Tag>
                                    </Tooltip>
                                )}
                            </>
                        }
                        description={experiment.description}
                    />
                )
            },
        },
        createdByColumn<Experiment>() as TableColumn<Experiment, keyof Experiment | undefined>,
        createdAtColumn<Experiment>() as TableColumn<Experiment, keyof Experiment | undefined>,
        atColumn('start_date', 'Started') as TableColumn<Experiment, keyof Experiment | undefined>,
        {
            title: 'Duration',
            key: 'duration',
            render: function Render(_, experiment: Experiment) {
                const duration = getExperimentDuration(experiment)

                return <div>{duration !== undefined ? `${duration} day${duration !== 1 ? 's' : ''}` : '—'}</div>
            },
            sorter: (a, b) => {
                const durationA = getExperimentDuration(a) ?? -1
                const durationB = getExperimentDuration(b) ?? -1
                return durationA > durationB ? 1 : -1
            },
            align: 'right',
        },
        {
            title: 'Remaining',
            key: 'remaining_time',
            width: 80,
            render: function Render(_, experiment: Experiment) {
                const remainingDays = experiment.parameters?.recommended_running_time
                const daysElapsed = experiment.start_date
                    ? dayjs().diff(dayjs(experiment.start_date), 'day')
                    : undefined

                if (remainingDays === undefined || remainingDays === null) {
                    return (
                        <Tooltip title="Remaining time will be calculated once the experiment has enough data">
                            <div className="w-full">
                                <Progress percent={0} bgColor="var(--border)" strokeColor="var(--border)" />
                            </div>
                        </Tooltip>
                    )
                }

                if (remainingDays === 0) {
                    return (
                        <Tooltip title="Recommended sample size reached">
                            <div className="w-full">
                                <Progress percent={100} strokeColor="var(--success)" />
                            </div>
                        </Tooltip>
                    )
                }

                const totalEstimatedDays = (daysElapsed ?? 0) + remainingDays
                const progress = totalEstimatedDays > 0 ? ((daysElapsed ?? 0) / totalEstimatedDays) * 100 : 0

                return (
                    <Tooltip
                        title={`~${Math.ceil(remainingDays)} day${Math.ceil(remainingDays) !== 1 ? 's' : ''} remaining`}
                    >
                        <div className="w-full">
                            <Progress percent={progress} />
                        </div>
                    </Tooltip>
                )
            },
        },
        {
            title: 'Status',
            key: 'status',
            render: function Render(_, experiment: Experiment) {
                return <StatusTag status={getExperimentStatus(experiment)} />
            },
            align: 'center',
            sorter: (a, b) => {
                const statusA = getExperimentStatus(a)
                const statusB = getExperimentStatus(b)

                const score = {
                    draft: 1,
                    running: 2,
                    complete: 3,
                }
                return score[statusA] > score[statusB] ? 1 : -1
            },
        },
        {
            width: 0,
            render: function Render(_, experiment: Experiment) {
                return (
                    <More
                        overlay={
                            <>
                                <Button to={urls.experiment(`${experiment.id}`)} size="small" fullWidth>
                                    View
                                </Button>
                                <Button onClick={() => openDuplicateModal(experiment)} size="small" fullWidth>
                                    Duplicate
                                </Button>
                                <ExperimentSurveyButton
                                    experiment={experiment}
                                    onOpenModal={() => {
                                        openSurveyModal(experiment)
                                        void addProductIntentForCrossSell({
                                            from: ProductKey.EXPERIMENTS,
                                            to: ProductKey.SURVEYS,
                                            intent_context: ProductIntentContext.QUICK_SURVEY_STARTED,
                                        })
                                    }}
                                />
                                {!experiment.archived &&
                                    experiment?.end_date &&
                                    dayjs().isSameOrAfter(dayjs(experiment.end_date), 'day') && (
                                        <AccessControlAction
                                            resourceType={AccessControlResourceType.Experiment}
                                            minAccessLevel={AccessControlLevel.Editor}
                                            userAccessLevel={experiment.user_access_level}
                                        >
                                            <Button
                                                onClick={() => {
                                                    Dialog.open({
                                                        title: 'Archive this experiment?',
                                                        content: (
                                                            <div className="text-sm text-secondary">
                                                                This action will hide the experiment from the list by
                                                                default. It can be restored at any time.
                                                            </div>
                                                        ),
                                                        primaryButton: {
                                                            children: 'Archive',
                                                            type: 'primary',
                                                            onClick: () => archiveExperiment(experiment.id as number),
                                                            size: 'small',
                                                        },
                                                        secondaryButton: {
                                                            children: 'Cancel',
                                                            type: 'tertiary',
                                                            size: 'small',
                                                        },
                                                    })
                                                }}
                                                data-attr={`experiment-${experiment.id}-dropdown-archive`}
                                                fullWidth
                                            >
                                                Archive experiment
                                            </Button>
                                        </AccessControlAction>
                                    )}
                                <Divider />
                                <AccessControlAction
                                    resourceType={AccessControlResourceType.Experiment}
                                    minAccessLevel={AccessControlLevel.Editor}
                                    userAccessLevel={experiment.user_access_level}
                                >
                                    <Button
                                        status="danger"
                                        onClick={() => {
                                            Dialog.open({
                                                title: 'Delete this experiment?',
                                                content: (
                                                    <div className="text-sm text-secondary">
                                                        Experiment with its settings will be deleted, but event data
                                                        will be preserved.
                                                    </div>
                                                ),
                                                primaryButton: {
                                                    children: 'Delete',
                                                    type: 'primary',
                                                    onClick: () => {
                                                        void deleteWithUndo({
                                                            endpoint: `projects/${currentProjectId}/experiments`,
                                                            object: { name: experiment.name, id: experiment.id },
                                                            callback: () => {
                                                                loadExperiments()
                                                            },
                                                        })
                                                    },
                                                    size: 'small',
                                                },
                                                secondaryButton: {
                                                    children: 'Cancel',
                                                    type: 'tertiary',
                                                    size: 'small',
                                                },
                                            })
                                        }}
                                        data-attr={`experiment-${experiment.id}-dropdown-remove`}
                                        fullWidth
                                    >
                                        Delete experiment
                                    </Button>
                                </AccessControlAction>
                            </>
                        }
                    />
                )
            },
        },
    ]

    return (
        <SceneContent>
            {tab === ExperimentsTabs.All && (
                <AccessControlAction
                    resourceType={AccessControlResourceType.Experiment}
                    minAccessLevel={AccessControlLevel.Editor}
                >
                    <ProductIntroduction
                        productName="Experiments"
                        productKey={ProductKey.EXPERIMENTS}
                        thingName="experiment"
                        description={EXPERIMENTS_PRODUCT_DESCRIPTION}
                        docsURL="https://hanzo.ai/docs/experiments"
                        action={() => router.actions.push(urls.experiment('new'))}
                        isEmpty={shouldShowEmptyState}
                        customInsights={ExperimentsMascot}
                        className="my-0"
                    />
                </AccessControlAction>
            )}
            <ExperimentsTableFilters filters={filters} onFiltersChange={setExperimentsFilters} />
            <Divider className="my-0" />
            {count ? (
                <div>
                    <span className="text-secondary">
                        {`${startCount}${endCount - startCount > 1 ? '-' + endCount : ''} of ${pluralize(count, 'experiment')}`}
                    </span>
                </div>
            ) : null}

            <div data-attr="experiments-table-container">
                <Table
                    dataSource={experiments.results}
                    columns={columns}
                    rowKey="id"
                    loading={experimentsLoading}
                    defaultSorting={{
                        columnKey: 'created_at',
                        order: -1,
                    }}
                    noSortingCancellation
                    pagination={pagination}
                    nouns={['experiment', 'experiments']}
                    data-attr="experiment-table"
                    emptyState="No results for this filter, change filter or create a new experiment."
                    onSort={(newSorting) =>
                        setExperimentsFilters({
                            order: newSorting
                                ? `${newSorting.order === -1 ? '-' : ''}${newSorting.columnKey}`
                                : undefined,
                            page: 1,
                        })
                    }
                />
            </div>
        </SceneContent>
    )
}

export function Experiments(): JSX.Element {
    const { tab } = useValues(experimentsLogic)
    const { setExperimentsTab, loadExperiments } = useActions(experimentsLogic)

    const [duplicateModalExperiment, setDuplicateModalExperiment] = useState<Experiment | null>(null)
    const [surveyModalExperiment, setSurveyModalExperiment] = useState<Experiment | null>(null)

    // Register feature flag creation tool so that it's always available on experiments page
    useMaxTool({
        identifier: 'create_feature_flag',
        initialMaxPrompt: 'Create a feature flag for ',
        suggestions: [],
        callback: () => {},
        active: true,
        context: {},
    })

    return (
        <SceneContent>
            <SceneTitleSection
                name="Experiments"
                resourceType={{
                    type: 'experiment',
                }}
                actions={
                    tab !== ExperimentsTabs.SharedMetrics && tab !== ExperimentsTabs.Holdouts ? (
                        <AccessControlAction
                            resourceType={AccessControlResourceType.Experiment}
                            minAccessLevel={AccessControlLevel.Editor}
                        >
                            <MaxTool
                                identifier="create_experiment"
                                initialMaxPrompt="Create an experiment for "
                                suggestions={[
                                    'Create an experiment to test…',
                                    'Set up an A/B test with a 70/30 split between control and test for…',
                                ]}
                                callback={(toolOutput: {
                                    experiment_id?: string | number
                                    experiment_name?: string
                                    feature_flag_key?: string
                                    error?: string
                                }) => {
                                    if (toolOutput?.error || !toolOutput?.experiment_id) {
                                        toast.error(
                                            `Failed to create experiment: ${toolOutput?.error || 'Unknown error'}`
                                        )
                                        return
                                    }
                                    // Refresh experiments list to show new experiment, then redirect to it
                                    loadExperiments()
                                    router.actions.push(urls.experiment(toolOutput.experiment_id))
                                }}
                                position="bottom-right"
                                active={true}
                                context={{}}
                            >
                                <AppShortcut
                                    name="NewExperiment"
                                    keybind={[keyBinds.new]}
                                    intent="New experiment"
                                    interaction="click"
                                    scope={Scene.Experiments}
                                >
                                    <Button
                                        size="small"
                                        type="primary"
                                        data-attr="create-experiment"
                                        to={urls.experiment('new')}
                                        tooltip="New experiment"
                                    >
                                        <span className="pr-3">New experiment</span>
                                    </Button>
                                </AppShortcut>
                            </MaxTool>
                        </AccessControlAction>
                    ) : undefined
                }
            />
            <Tabs
                activeKey={tab}
                onChange={(newKey) => setExperimentsTab(newKey)}
                sceneInset
                tabs={[
                    {
                        key: ExperimentsTabs.All,
                        label: 'Experiments',
                        content: (
                            <ExperimentsTable
                                openDuplicateModal={setDuplicateModalExperiment}
                                openSurveyModal={setSurveyModalExperiment}
                            />
                        ),
                    },
                    {
                        key: ExperimentsTabs.SharedMetrics,
                        label: 'Shared metrics',
                        content: <SharedMetrics />,
                    },
                    { key: ExperimentsTabs.Holdouts, label: 'Holdout groups', content: <Holdouts /> },
                    {
                        key: ExperimentsTabs.History,
                        label: 'History',
                        content: <ActivityLog scope={ActivityScope.EXPERIMENT} />,
                    },
                    {
                        key: ExperimentsTabs.Settings,
                        label: 'Settings',
                        content: <ExperimentsSettings />,
                    },
                ]}
            />
            {duplicateModalExperiment && (
                <DuplicateExperimentModal
                    isOpen={true}
                    onClose={() => setDuplicateModalExperiment(null)}
                    experiment={duplicateModalExperiment}
                />
            )}
            {surveyModalExperiment && (
                <QuickSurveyModal
                    context={{ type: QuickSurveyType.EXPERIMENT, experiment: surveyModalExperiment }}
                    isOpen={true}
                    onCancel={() => setSurveyModalExperiment(null)}
                />
            )}
        </SceneContent>
    )
}
