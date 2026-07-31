import { BindLogic, useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { router } from 'kea-router'
import { useState } from 'react'

import { IconEllipsis, IconRefresh } from '@hanzo/icons'
import {
    Banner,
    Button,
    Checkbox,
    Dialog,
    Dropdown,
    Menu,
    Table,
    Tag,
    TagType,
    Tooltip,
} from '@hanzo/elements'

import { DateFilter } from 'lib/components/DateFilter/DateFilter'
import { PropertyKeyInfo } from 'lib/components/PropertyKeyInfo'
import { TZLabel } from 'lib/components/TZLabel'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { capitalizeFirstLetter } from 'lib/utils'
import { InsightEmptyState } from 'scenes/insights/EmptyStates'
import { PersonDisplay } from 'scenes/persons/PersonDisplay'
import { urls } from 'scenes/urls'

import { CyclotronJobInvocationGlobals, GroupType, GroupTypeIndex, LogEntry } from '~/types'

import {
    convertToInsightsFunctionInvocationGlobals,
    insightsFunctionConfigurationLogic,
} from '../configuration/insightsFunctionConfigurationLogic'
import { insightsFunctionTestLogic } from '../configuration/insightsFunctionTestLogic'
import { InsightsFunctionFilters } from '../filters/InsightsFunctionFilters'
import { tagTypeForLevel } from '../logs/LogsViewer'
import { CyclotronJobTestInvocationResultWithEventId, insightsFunctionTestingLogic } from './insightsFunctionTestingLogic'

const buildGlobals = (
    row: any,
    groupTypes: Map<GroupTypeIndex, GroupType>,
    insightsFunctionName: string
): CyclotronJobInvocationGlobals => {
    const globals = convertToInsightsFunctionInvocationGlobals(row[0], row[1])
    globals.groups = {}
    groupTypes.forEach((groupType, index) => {
        const tuple = row?.[4 + index]
        if (tuple && Array.isArray(tuple) && tuple[2]) {
            let properties = {}
            try {
                properties = JSON.parse(tuple[3])
            } catch {
                // Ignore
            }
            globals.groups![groupType.group_type] = {
                type: groupType.group_type,
                index: tuple[1],
                id: tuple[2], // TODO: rename to "key"?
                url: `${window.location.origin}/groups/${tuple[1]}/${encodeURIComponent(tuple[2])}`,
                properties,
            }
        }
    })
    globals.source = {
        name: insightsFunctionName ?? 'Unnamed',
        url: window.location.href.split('#')[0],
    }

    return globals
}

export function InsightsFunctionTesting(): JSX.Element | null {
    const { logicProps } = useValues(insightsFunctionConfigurationLogic)
    const id = logicProps.id

    if (!id) {
        return null
    }

    return (
        <BindLogic logic={insightsFunctionTestingLogic} props={{ id }}>
            <div className="deprecated-space-y-3">
                <Banner type="info">
                    <span>
                        This is a list of all events matching your filters. You can run the function using these
                        historical events.
                    </span>
                </Banner>
                <div className="flex items-center gap-2 justify-bewtween">
                    <div className="flex items-center gap-2 flex-1">
                        <RunsFilters />
                    </div>

                    <div className="flex items-center gap-2">
                        <TestRunnerOptions />
                    </div>
                </div>

                <TestingEventsList />
            </div>
        </BindLogic>
    )
}

function EmptyColumn(): JSX.Element {
    return (
        <Tooltip title="NULL" placement="right" delayMs={0}>
            <span className="cursor-default" aria-hidden>
                —
            </span>
        </Tooltip>
    )
}

function TestRunnerOptions(): JSX.Element {
    const { selectingMany, eventsWithRetries, loadingRetries, selectedForRetry } = useValues(insightsFunctionTestingLogic)
    const { setSelectingMany, retryInvocation, selectForRetry, deselectForRetry, resetSelectedForRetry } =
        useActions(insightsFunctionTestingLogic)
    const { groupTypes, configuration } = useValues(insightsFunctionConfigurationLogic)

    return (
        <>
            {!selectingMany ? (
                <Button size="small" type="secondary" onClick={() => setSelectingMany(true)}>
                    Select invocations
                </Button>
            ) : (
                <>
                    <Button
                        size="small"
                        type="secondary"
                        onClick={() => {
                            setSelectingMany(false)
                            resetSelectedForRetry()
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="small"
                        type="secondary"
                        onClick={() =>
                            selectedForRetry.length === eventsWithRetries.length
                                ? deselectForRetry(eventsWithRetries.map((row) => row[0].uuid))
                                : selectForRetry(eventsWithRetries.map((row) => row[0].uuid))
                        }
                    >
                        <span>
                            {selectedForRetry.length === eventsWithRetries.length ? 'Deselect all' : 'Select all'}
                        </span>
                    </Button>
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                            Dialog.open({
                                title: 'Test selected events',
                                content: `Are you sure you want to test the selected events? Please don't close the window until the invocations have completed.`,
                                secondaryButton: {
                                    children: 'Cancel',
                                },
                                primaryButton: {
                                    children: 'Test selected events',
                                    onClick: () => {
                                        eventsWithRetries
                                            .filter((row) => selectedForRetry.includes(row[0].uuid))
                                            .forEach((row) =>
                                                retryInvocation({
                                                    eventId: row[0].uuid,
                                                    globals: buildGlobals(
                                                        row,
                                                        groupTypes,
                                                        configuration?.name ?? 'Unnamed'
                                                    ),
                                                })
                                            )
                                    },
                                },
                            })
                        }}
                        loading={loadingRetries.length > 0}
                        disabledReason={
                            loadingRetries.length > 0
                                ? 'Please wait for the current tests to complete.'
                                : selectedForRetry.length === 0
                                  ? 'No invocations selected'
                                  : undefined
                        }
                    >
                        Test selected
                    </Button>
                </>
            )}
        </>
    )
}

function RunsFilters(): JSX.Element {
    const { eventsLoading, baseEventsQuery } = useValues(insightsFunctionTestingLogic)
    const { loadEvents, changeDateRange, loadTotalEvents } = useActions(insightsFunctionTestingLogic)
    const { logicProps } = useValues(insightsFunctionConfigurationLogic)
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const handleRefresh = (): void => {
        loadEvents()
        loadTotalEvents()
    }

    return (
        <>
            <Button
                onClick={handleRefresh}
                loading={eventsLoading}
                type="secondary"
                icon={<IconRefresh />}
                size="small"
            >
                Refresh
            </Button>
            <DateFilter
                dateFrom={baseEventsQuery?.after ?? undefined}
                dateTo={baseEventsQuery?.before ?? undefined}
                onChange={changeDateRange}
            />
            <Dropdown
                visible={dropdownOpen}
                closeOnClickInside={false}
                matchWidth={false}
                placement="right-end"
                overlay={
                    <Form
                        logic={insightsFunctionConfigurationLogic}
                        props={logicProps}
                        formKey="configuration"
                        className="deprecated-space-y-3"
                    >
                        <InsightsFunctionFilters embedded={true} showTriggerOptions={false} />
                        <div className="flex justify-end mt-2">
                            <Button size="small" type="primary" onClick={() => setDropdownOpen(false)}>
                                Done
                            </Button>
                        </div>
                    </Form>
                }
            >
                <Button size="small" type="secondary" onClick={() => setDropdownOpen((v) => !v)}>
                    Filters
                </Button>
            </Dropdown>
        </>
    )
}

function TestingEventsList(): JSX.Element | null {
    const {
        eventsLoading,
        eventsWithRetries,
        totalEvents,
        pageTimestamps,
        expandedRows,
        loadingRetries,
        selectingMany,
        selectedForRetry,
    } = useValues(insightsFunctionTestingLogic)
    const {
        retryInvocation,
        loadNextEventsPage,
        loadPreviousEventsPage,
        expandRow,
        collapseRow,
        selectForRetry,
        deselectForRetry,
    } = useActions(insightsFunctionTestingLogic)
    const { groupTypes, configuration, logicProps } = useValues(insightsFunctionConfigurationLogic)
    const id = logicProps.id ?? 'new'
    const { setSampleGlobals, toggleExpanded } = useActions(insightsFunctionTestLogic(logicProps))

    return (
        <Table
            dataSource={eventsWithRetries}
            loading={eventsLoading}
            loadingSkeletonRows={5}
            pagination={{
                controlled: true,
                currentPage: pageTimestamps.length + 1,
                onForward: loadNextEventsPage,
                onBackward: loadPreviousEventsPage,
                pageSize: eventsWithRetries.length,
                hideOnSinglePage: false,
                entryCount: totalEvents,
            }}
            expandable={{
                isRowExpanded: ([event]) => expandedRows.includes(event.uuid),
                onRowExpand: ([event]) => expandRow(event.uuid),
                onRowCollapse: ([event]) => collapseRow(event.uuid),
                noIndent: true,
                expandedRowRender: ([, , , retries]) => {
                    return (
                        <Table
                            dataSource={retries.reduce(
                                (acc: LogEntry[], group: CyclotronJobTestInvocationResultWithEventId) =>
                                    acc.concat(group.logs),
                                []
                            )}
                            embedded={true}
                            columns={[
                                {
                                    key: 'spacer',
                                    width: 0,
                                    render: () => <div className="w-6" />,
                                },
                                {
                                    title: 'Timestamp',
                                    key: 'timestamp',
                                    dataIndex: 'timestamp',
                                    render: (_, { timestamp }) => <TZLabel time={timestamp} />,
                                },
                                {
                                    title: 'Level',
                                    key: 'level',
                                    dataIndex: 'level',
                                    render: (_, { level }) => (
                                        <Tag type={tagTypeForLevel(level)}>{level.toUpperCase()}</Tag>
                                    ),
                                },
                                {
                                    title: 'Message',
                                    key: 'message',
                                    dataIndex: 'message',
                                    render: (_, { message }) => <code className="whitespace-pre-wrap">{message}</code>,
                                },
                            ]}
                        />
                    )
                },
            }}
            columns={[
                {
                    title: 'Status',
                    key: 'status',
                    width: 0,
                    render: (_, row) => {
                        const eventId = row[0].uuid

                        const getStatus = (): { text: string; type: TagType } => {
                            if (loadingRetries.includes(eventId)) {
                                return {
                                    text: 'Running',
                                    type: 'warning',
                                }
                            } else if (row[3].length === 0) {
                                return {
                                    text: 'Not tested',
                                    type: 'muted',
                                }
                            } else if (row[3][row[3].length - 1].status === 'error') {
                                return {
                                    text: 'Failure',
                                    type: 'danger',
                                }
                            } else if (row[3][row[3].length - 1].status === 'success') {
                                return {
                                    text: 'Success',
                                    type: 'success',
                                }
                            }
                            return {
                                text: 'Unknown',
                                type: 'muted',
                            }
                        }

                        return (
                            <div className="flex gap-2 items-center">
                                {selectingMany ? (
                                    <Checkbox
                                        checked={selectedForRetry.includes(eventId)}
                                        onChange={(checked) => {
                                            if (checked) {
                                                selectForRetry([eventId])
                                            } else {
                                                deselectForRetry([eventId])
                                            }
                                        }}
                                    />
                                ) : null}

                                <Tag type={getStatus().type}>{capitalizeFirstLetter(getStatus().text)}</Tag>

                                <Menu
                                    items={[
                                        eventId
                                            ? {
                                                  label: 'View event',
                                                  to: urls.event(eventId, row[0].timestamp),
                                              }
                                            : null,
                                        {
                                            label: 'Test event',
                                            onClick: () => {
                                                retryInvocation({
                                                    eventId,
                                                    globals: buildGlobals(
                                                        row,
                                                        groupTypes,
                                                        configuration?.name ?? 'Unnamed'
                                                    ),
                                                })
                                                expandRow(eventId)
                                            },
                                        },
                                        {
                                            label: 'Test with this event in configuration',
                                            onClick: () => {
                                                const globals = buildGlobals(
                                                    row,
                                                    groupTypes,
                                                    configuration?.name ?? 'Unnamed'
                                                )
                                                setSampleGlobals(globals)
                                                toggleExpanded(true)
                                                router.actions.push(urls.insightsFunction(id) + '?tab=configuration')
                                            },
                                        },
                                    ]}
                                >
                                    <Button
                                        size="xsmall"
                                        icon={<IconEllipsis className="rotate-90" />}
                                        loading={loadingRetries.includes(eventId) ? true : undefined}
                                    />
                                </Menu>
                            </div>
                        )
                    },
                },
                {
                    title: 'Event',
                    key: 'event',
                    className: 'max-w-80',
                    render: (_, [event]) => {
                        return event.event ? (
                            <PropertyKeyInfo value={event.event} type={TaxonomicFilterGroupType.Events} />
                        ) : (
                            <EmptyColumn />
                        )
                    },
                },
                {
                    title: 'Person',
                    key: 'person',
                    render: (_, [, person]) => {
                        return person ? <PersonDisplay person={person} withIcon /> : <EmptyColumn />
                    },
                },
                {
                    title: 'URL / Screen',
                    key: 'url',
                    className: 'max-w-80',
                    render: (_, [event]) =>
                        event.properties['$current_url'] || event.properties['$screen_name'] ? (
                            <span>{event.properties['$current_url'] || event.properties['$screen_name']}</span>
                        ) : (
                            <EmptyColumn />
                        ),
                },
                {
                    title: 'Library',
                    key: 'library',
                    className: 'max-w-80',
                    render: (_, [event]) => {
                        return event.properties['$lib'] ? <span>{event.properties['$lib']}</span> : <EmptyColumn />
                    },
                },
                {
                    title: 'Time',
                    key: 'time',
                    className: 'max-w-80',
                    render: (_, [event]) => {
                        return event.timestamp ? <TZLabel time={event.timestamp} /> : <EmptyColumn />
                    },
                },
            ]}
            emptyState={<InsightEmptyState />}
        />
    )
}
