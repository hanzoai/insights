import { Banner, Table, Tag, Tooltip } from '@hanzo/elements'

import { dayjs } from 'lib/dayjs'
import { Progress } from 'lib/elements/Progress'
import { atColumn, createdAtColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { TableLink } from 'lib/elements/Table/TableLink'
import type { TableColumn } from 'lib/elements/Table/types'
import stringWithWBR from 'lib/utils/stringWithWBR'
import { urls } from 'scenes/urls'

import {
    getExperimentStatus,
    getShippedVariantKey,
    isSingleVariantShipped,
} from '~/scenes/experiments/experimentsLogic'
import { StatusTag } from '~/scenes/experiments/ExperimentView/StatusTag'
import { isLegacyExperiment } from '~/scenes/experiments/utils'
import type { Experiment } from '~/types'
import { ExperimentStatus } from '~/types'

type RelatedExperimentsTableProps = {
    relatedExperiments: Experiment[]
    relatedExperimentsLoading: boolean
    multipleExperimentsBannerMessage: React.ReactNode
}

const getExperimentDuration = (experiment: Experiment): number | undefined => {
    return experiment.end_date
        ? dayjs(experiment.end_date).diff(dayjs(experiment.start_date), 'day')
        : experiment.start_date
          ? dayjs().diff(dayjs(experiment.start_date), 'day')
          : undefined
}

export const RelatedExperimentsTable = ({
    relatedExperiments,
    relatedExperimentsLoading,
    multipleExperimentsBannerMessage,
}: RelatedExperimentsTableProps): JSX.Element | null => {
    return (
        <div className="space-y-6">
            <Banner type="info">{multipleExperimentsBannerMessage}</Banner>
            <Table
                dataSource={relatedExperiments}
                loading={relatedExperimentsLoading}
                defaultSorting={{
                    columnKey: 'created_at',
                    order: -1,
                }}
                noSortingCancellation
                rowKey="id"
                nouns={['experiment', 'experiments']}
                data-attr="experiments-table"
                columns={[
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

                            return (
                                <div>
                                    {duration !== undefined ? `${duration} day${duration !== 1 ? 's' : ''}` : '—'}
                                </div>
                            )
                        },
                        sorter: (a, b) => {
                            const durationA = getExperimentDuration(a) ?? -1
                            const durationB = getExperimentDuration(b) ?? -1
                            return durationA - durationB
                        },
                        align: 'right',
                    },
                    {
                        title: 'Remaining',
                        key: 'remaining_time',
                        width: 80,
                        render: function Render(_, experiment: Experiment) {
                            const remainingDays = experiment.running_time_calculation?.recommended_running_time
                            const daysElapsed = experiment.start_date
                                ? dayjs().diff(dayjs(experiment.start_date), 'day')
                                : undefined

                            if (remainingDays === undefined || remainingDays === null) {
                                return (
                                    <Tooltip title="Remaining time will be calculated once the experiment has enough data">
                                        <div className="w-full">
                                            <Progress
                                                percent={0}
                                                bgColor="var(--border)"
                                                strokeColor="var(--border)"
                                            />
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
                            const progress =
                                totalEstimatedDays > 0 ? ((daysElapsed ?? 0) / totalEstimatedDays) * 100 : 0

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

                            const score: Record<ExperimentStatus, number> = {
                                [ExperimentStatus.Draft]: 1,
                                [ExperimentStatus.Running]: 2,
                                [ExperimentStatus.Paused]: 3,
                                [ExperimentStatus.ExposureFrozen]: 4,
                                [ExperimentStatus.Stopped]: 5,
                            }
                            return score[statusA] > score[statusB] ? 1 : -1
                        },
                    },
                ]}
            />
        </div>
    )
}
