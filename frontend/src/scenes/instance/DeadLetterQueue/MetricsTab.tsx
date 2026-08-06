import { useActions, useValues } from 'kea'

import { IconCalendar, IconRefresh } from '@hanzo/icons'
import { Divider } from '@hanzo/elements'

import { DateFilter } from 'lib/components/DateFilter/DateFilter'
import { Button } from 'lib/elements/Button'
import { Table } from 'lib/elements/Table'
import { Spinner } from 'lib/elements/Spinner/Spinner'
import { copyToClipboard } from 'lib/utils/copyToClipboard'
import { userLogic } from 'scenes/userLogic'

import { deadLetterQueueLogic } from './deadLetterQueueLogic'

// keep in sync with insights/api/dead_letter_queue.py
const ROWS_LIMIT = 10

export function MetricsTab(): JSX.Element {
    const { user } = useValues(userLogic)
    const { singleValueMetrics, tableMetrics, deadLetterQueueMetricsLoading, rowsPerMetric, filters } =
        useValues(deadLetterQueueLogic)
    const { loadDeadLetterQueueMetrics, loadMoreRows, setFilters } = useActions(deadLetterQueueLogic)

    if (!user?.is_staff) {
        return <></>
    }

    return (
        <div>
            <br />
            <DateFilter
                dateTo={filters.before}
                dateFrom={filters.after}
                onChange={(from, to) => setFilters({ after: from || undefined, before: to || undefined })}
                allowedRollingDateOptions={['days', 'weeks', 'months', 'years']}
                makeLabel={(key) => (
                    <>
                        <IconCalendar /> {key}
                    </>
                )}
            />

            <div className="mb-4 float-right">
                <Button
                    icon={deadLetterQueueMetricsLoading ? <Spinner /> : <IconRefresh />}
                    onClick={loadDeadLetterQueueMetrics}
                    type="secondary"
                    size="small"
                >
                    Refresh
                </Button>
            </div>

            <div className="flex deprecated-space-x-8 mb-4">
                {singleValueMetrics.map((row) => (
                    <div key={row.key} className="deprecated-space-y-1">
                        <div>{row.metric}</div>
                        <div className="text-2xl">{(row.value || '0').toLocaleString('en-US')}</div>
                    </div>
                ))}
            </div>

            {tableMetrics.map((row) => (
                <div key={row.key}>
                    <h2>{row.metric}</h2>
                    <Table
                        columns={
                            row.subrows?.columns?.map((columnTitle, index) => ({
                                title: columnTitle,
                                dataIndex: `col${index}`,
                                className: 'whitespace-nowrap overflow-hidden text-ellipsis max-w-xs cursor-pointer',
                                render: (value: any) => (
                                    <span
                                        onClick={() => copyToClipboard(String(value), 'value')}
                                        title="Click to copy"
                                        className="hover:bg-gray-100 px-1 py-0.5 rounded"
                                    >
                                        {value}
                                    </span>
                                ),
                            })) || []
                        }
                        dataSource={
                            rowsPerMetric[row.key].map((rowData) => {
                                return rowData.reduce<Record<string, string>>((acc, value, index) => {
                                    acc[`col${index}`] = value
                                    return acc
                                }, {})
                            }) || []
                        }
                        loading={deadLetterQueueMetricsLoading}
                        defaultSorting={{
                            columnKey: 'value',
                            order: -1,
                        }}
                        embedded
                    />
                    <div className="flex justify-center m-4 text-center">
                        <Button
                            disabledReason={rowsPerMetric[row.key].length % ROWS_LIMIT !== 0 && 'No more values'}
                            onClick={() => loadMoreRows(row.key)}
                        >
                            Load more values
                        </Button>
                    </div>
                    <Divider />
                </div>
            ))}
        </div>
    )
}
