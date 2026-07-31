import { useActions, useValues } from 'kea'

import { IconCalendar, IconEye, IconList, IconRefresh, IconSearch, IconTableOfContents } from '@hanzo/icons'
import {
    Button,
    Input,
    Select,
    Table,
    TableColumn,
    TableProps,
    Tag,
    TagProps,
    Link,
} from '@hanzo/elements'

import { CopyToClipboardInline } from 'lib/components/CopyToClipboard'
import { DateFilter } from 'lib/components/DateFilter/DateFilter'
import { TZLabel } from 'lib/components/TZLabel'
import { IconWithCount } from 'lib/elements/icons'
import { pluralize } from 'lib/utils'

import { LogEntryLevel } from '~/types'

import { LogLevelsPicker } from './LogLevelsPicker'
import { GroupedLogEntry, LOG_VIEWER_LIMIT, LogEntry, LogsViewerLogicProps, logsViewerLogic } from './logsViewerLogic'

export const tagTypeForLevel = (level: LogEntryLevel): TagProps['type'] => {
    switch (level.toLowerCase()) {
        case 'debug':
            return 'muted'
        case 'log':
        case 'info':
            return 'default'
        case 'warning':
        case 'warn':
            return 'warning'
        case 'error':
            return 'danger'
        default:
            return 'default'
    }
}

const shortInstanceId = (instanceId: string): string => {
    // first two letters of each
    return instanceId
        .split('-')
        .map((part) => part.slice(0, 2))
        .join('')
}

export type LogsViewerProps = LogsViewerLogicProps & {
    instanceLabel?: string
    renderColumns?: (
        columns: TableColumn<GroupedLogEntry, keyof GroupedLogEntry | undefined>[]
    ) => TableColumn<GroupedLogEntry, keyof GroupedLogEntry | undefined>[]
    renderMessage?: (message: string) => JSX.Element | string
    hideDateFilter?: boolean
    hideLevelsFilter?: boolean
    hideInstanceIdColumn?: boolean
}

/**
 * NOTE: There is a loose attempt to keeep this generic so we can use it as an abstract log component in the future.
 */

export function LogsViewer({
    renderColumns = (c) => c,
    renderMessage = (m) => m,
    instanceLabel = 'invocation',
    hideDateFilter,
    hideLevelsFilter,
    hideInstanceIdColumn,
    ...props
}: LogsViewerProps): JSX.Element {
    const logic = logsViewerLogic(props)

    const {
        unGroupedLogs,
        groupedLogs,
        logsLoading,
        hiddenLogs,
        hiddenLogsLoading,
        isThereMoreToLoad,
        expandedRows,
        filters,
        isGrouped,
    } = useValues(logic)
    const { revealHiddenLogs, loadOlderLogs, setFilters, setRowExpanded, setIsGrouped } = useActions(logic)

    const groupedLogColumns: TableColumn<GroupedLogEntry, keyof GroupedLogEntry | undefined>[] = renderColumns([
        {
            title: 'Timestamp',
            key: 'timestamp',
            dataIndex: 'maxTimestamp',
            width: 0,
            sorter: (a: GroupedLogEntry, b: GroupedLogEntry) => a.maxTimestamp.unix() - b.maxTimestamp.unix(),
            render: (_, { maxTimestamp }) => <TZLabel time={maxTimestamp} />,
        },
        {
            width: 0,
            title: instanceLabel,
            isHidden: hideInstanceIdColumn === true,
            dataIndex: 'instanceId',
            key: 'instanceId',
            render: (_, { instanceId }) => (
                <code className="whitespace-nowrap">
                    <CopyToClipboardInline explicitValue={instanceId} selectable>
                        <Link
                            className="font-semibold"
                            subtle
                            onClick={() => setRowExpanded(instanceId, !expandedRows[instanceId])}
                            title={instanceId}
                        >
                            {shortInstanceId(instanceId)}
                        </Link>
                    </CopyToClipboardInline>
                </code>
            ),
        },
        {
            key: 'logLevel',
            dataIndex: 'logLevel',
            width: 0,
            render: (_, { instanceId, logLevel }) => {
                return (
                    <Link
                        subtle
                        className="flex items-center gap-2"
                        onClick={() => {
                            setRowExpanded(instanceId, !expandedRows[instanceId])
                        }}
                    >
                        <Tag type={tagTypeForLevel(logLevel)}>{logLevel.toUpperCase()}</Tag>
                    </Link>
                )
            },
        },
        {
            title: 'Last message',
            key: 'entries',
            dataIndex: 'entries',
            render: (_, { instanceId, entries }) => {
                const lastEntry = entries[entries.length - 1]
                return (
                    <code className="whitespace-pre-wrap">
                        <Link
                            subtle
                            onClick={() => {
                                setRowExpanded(instanceId, !expandedRows[instanceId])
                            }}
                        >
                            {renderMessage(lastEntry.message)}
                            {entries.length > 1 && (
                                <>
                                    <br />
                                    <span className="text-xs text-muted-alt">+ {entries.length - 1} more</span>
                                </>
                            )}
                        </Link>
                    </code>
                )
            },
        },
    ])

    const footer = (
        <Button
            onClick={loadOlderLogs}
            loading={logsLoading}
            fullWidth
            center
            disabledReason={!isThereMoreToLoad ? "There's nothing more to load" : undefined}
        >
            {isThereMoreToLoad ? `Load up to ${LOG_VIEWER_LIMIT} older entries` : 'No older entries'}
        </Button>
    )

    return (
        <div className="flex-1 deprecated-space-y-2 ph-no-capture flex flex-col">
            <div className="flex flex-wrap flex-row-reverse items-center gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-100">
                    <Input
                        type="search"
                        placeholder="Search messages or invocation ID…"
                        fullWidth
                        onChange={(value) => setFilters({ search: value })}
                        value={filters.search}
                        allowClear
                        prefix={
                            <>
                                <IconSearch />
                            </>
                        }
                    />
                </div>
                <div className="flex items-center gap-2">
                    {!hideLevelsFilter && (
                        <LogLevelsPicker value={filters.levels} onChange={(levels) => setFilters({ levels })} />
                    )}

                    {!hideDateFilter && (
                        <DateFilter
                            dateTo={filters.date_to}
                            dateFrom={filters.date_from}
                            onChange={(from, to) =>
                                setFilters({ date_from: from || undefined, date_to: to || undefined })
                            }
                            allowedRollingDateOptions={['days', 'weeks', 'months', 'years']}
                            makeLabel={(key) => (
                                <>
                                    <IconCalendar /> {key}
                                </>
                            )}
                        />
                    )}

                    {typeof props.groupByInstanceId !== 'boolean' && (
                        <Select
                            size="small"
                            value={isGrouped}
                            onChange={(checked) => setIsGrouped(checked)}
                            options={[
                                {
                                    label: <IconTableOfContents />,
                                    value: true,
                                    labelInMenu: (
                                        <>
                                            <IconTableOfContents className="mr-1" /> Group logs by {instanceLabel}
                                        </>
                                    ),
                                },
                                {
                                    label: <IconList />,
                                    value: false,
                                    labelInMenu: (
                                        <>
                                            <IconList className="mr-1" /> No grouping
                                        </>
                                    ),
                                },
                            ]}
                        />
                    )}
                    <Button
                        size="small"
                        onClick={revealHiddenLogs}
                        loading={hiddenLogsLoading}
                        type="secondary"
                        icon={
                            <IconWithCount count={hiddenLogs.length}>
                                {hiddenLogs.length ? <IconEye /> : <IconRefresh />}
                            </IconWithCount>
                        }
                        disabledReason={
                            !hiddenLogs.length ? 'No newer entries. Will check every 5 seconds.' : undefined
                        }
                        tooltip={`Show ${pluralize(hiddenLogs.length, 'newer entry', 'newer entries')}`}
                    />
                </div>
            </div>

            {isGrouped ? (
                <Table
                    key="grouped"
                    dataSource={groupedLogs}
                    loading={logsLoading}
                    className="ph-no-capture overflow-y-auto"
                    rowKey={(record) => record.instanceId}
                    footer={footer}
                    columns={groupedLogColumns}
                    expandable={{
                        noIndent: true,
                        isRowExpanded: (record) => expandedRows[record.instanceId] ?? false,
                        onRowExpand: (record) => setRowExpanded(record.instanceId, true),
                        onRowCollapse: (record) => setRowExpanded(record.instanceId, false),
                        expandedRowRender: (record) => {
                            return (
                                <LogsViewerTable
                                    instanceLabel={instanceLabel}
                                    renderMessage={renderMessage}
                                    embedded
                                    dataSource={record.entries}
                                    renderColumns={(columns) => [
                                        {
                                            key: 'spacer',
                                            width: 0,
                                            render: () => <div className="w-6" />,
                                        },
                                        ...columns,
                                    ]}
                                />
                            )
                        },
                    }}
                />
            ) : (
                <LogsViewerTable
                    instanceLabel={instanceLabel}
                    renderMessage={renderMessage}
                    key="ungrouped"
                    dataSource={unGroupedLogs}
                    loading={logsLoading}
                    className="ph-no-capture overflow-y-auto"
                    rowKey={(record, index) => `${record.timestamp.toISOString()}-${index}`}
                    footer={footer}
                    hideInstanceIdColumn={hideInstanceIdColumn}
                />
            )}

            <div className="mb-8" />
        </div>
    )
}

export function LogsViewerTable({
    instanceLabel,
    renderMessage,
    renderColumns = (c) => c,
    hideInstanceIdColumn,
    ...props
}: Omit<TableProps<LogEntry>, 'columns'> & {
    instanceLabel: string
    renderMessage: (message: string) => JSX.Element | string
    renderColumns?: (
        columns: TableColumn<LogEntry, keyof LogEntry | undefined>[]
    ) => TableColumn<LogEntry, keyof LogEntry | undefined>[]
    hideInstanceIdColumn?: boolean
}): JSX.Element {
    let logColumns: TableColumn<LogEntry, keyof LogEntry | undefined>[] = [
        {
            title: 'Timestamp',
            key: 'timestamp',
            dataIndex: 'timestamp',
            width: 0,
            render: (_, { timestamp }) => <TZLabel time={timestamp} />,
        },
        {
            title: 'Level',
            key: 'level',
            dataIndex: 'level',
            width: 0,
            render: (_, { level }) => <Tag type={tagTypeForLevel(level)}>{level.toUpperCase()}</Tag>,
        },
        {
            width: 0,
            isHidden: hideInstanceIdColumn === true,
            title: instanceLabel,
            dataIndex: 'instanceId',
            key: 'instanceId',
            render: (_, { instanceId }) => (
                <code className="whitespace-nowrap">
                    <CopyToClipboardInline explicitValue={instanceId} selectable>
                        <Link className="font-semibold" subtle title={instanceId}>
                            {shortInstanceId(instanceId)}
                        </Link>
                    </CopyToClipboardInline>
                </code>
            ),
        },
        {
            title: 'Message',
            key: 'message',
            dataIndex: 'message',
            render: (_, { message }) => <code className="whitespace-pre-wrap">{renderMessage(message)}</code>,
        },
    ]

    return (
        <Table
            {...props}
            rowKey={(record, index) => `${record.timestamp.toISOString()}-${index}`}
            columns={renderColumns(logColumns)}
        />
    )
}
