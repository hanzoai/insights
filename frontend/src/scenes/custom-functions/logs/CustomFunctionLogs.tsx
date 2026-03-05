import { useActions, useValues } from 'kea'
import { router } from 'kea-router'
import { useMemo } from 'react'

import { IconEllipsis } from '@posthog/icons'
import { LemonButton, LemonCheckbox, LemonDialog, LemonMenu, LemonTag, Link } from '@posthog/lemon-ui'

import { LemonTableColumns } from 'lib/lemon-ui/LemonTable'
import { capitalizeFirstLetter } from 'lib/utils'
import { urls } from 'scenes/urls'

import { customFunctionConfigurationLogic } from '../configuration/customFunctionConfigurationLogic'
import { customFunctionTestLogic } from '../configuration/customFunctionTestLogic'
import { LogsViewer } from './LogsViewer'
import { customFunctionLogsLogic } from './customFunctionLogsLogic'
import { GroupedLogEntry, LogsViewerLogicProps } from './logsViewerLogic'

const EVENT_LINK_REGEX = /Event: '(.+)'/g

export const renderCustomFunctionMessage = (message: string): JSX.Element => {
    const parts = message.split(EVENT_LINK_REGEX)
    const elements: (string | JSX.Element)[] = []

    for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
            // Even indices are regular text parts
            if (parts[i]) {
                elements.push(parts[i])
            }
        } else {
            elements.push(
                <Link className="rounded p-1 -m-1 bg-border text-bg-primary" to={parts[i]} targetBlankIcon>
                    View event
                </Link>
            )
        }
    }

    return <>{elements}</>
}

export function CustomFunctionLogs(): JSX.Element | null {
    const { logicProps } = useValues(customFunctionConfigurationLogic)
    const id = logicProps.id
    const logsLogicProps: LogsViewerLogicProps = {
        sourceType: 'custom_function',
        sourceId: logicProps.id ?? 'unknown',
    }
    const logic = customFunctionLogsLogic(logsLogicProps)

    const { selectingMany, selectedForRetry, retryRunning } = useValues(logic)
    const { setSelectingMany, retrySelectedInvocations, selectAllForRetry } = useActions(logic)

    if (!id) {
        return null
    }

    return (
        <>
            {selectingMany ? (
                <div className="flex gap-2 items-center mb-2 justify-end">
                    <>
                        <LemonButton size="small" type="secondary" onClick={() => setSelectingMany(false)}>
                            Cancel
                        </LemonButton>
                        <LemonButton size="small" type="secondary" onClick={() => selectAllForRetry()}>
                            Select all
                        </LemonButton>
                        <LemonButton
                            size="small"
                            type="primary"
                            onClick={() => {
                                LemonDialog.open({
                                    title: 'Retry invocations',
                                    content: `Are you sure you want to retry the selected events? Please don't close the window until the invocations have completed.`,
                                    secondaryButton: {
                                        children: 'Cancel',
                                    },
                                    primaryButton: {
                                        children: 'Retry selected events',
                                        onClick: () => retrySelectedInvocations(),
                                    },
                                })
                            }}
                            loading={retryRunning}
                            disabledReason={
                                retryRunning
                                    ? 'Please wait for the current retries to complete.'
                                    : Object.values(selectedForRetry).length === 0
                                      ? 'No invocations selected'
                                      : undefined
                            }
                        >
                            Retry selected
                        </LemonButton>
                    </>
                </div>
            ) : null}
            <LogsViewer
                {...logsLogicProps}
                sourceId={id}
                renderColumns={(columns) => {
                    // Add in custom columns for handling retries
                    const newColumns: LemonTableColumns<GroupedLogEntry> = [
                        {
                            title: 'Status',
                            key: 'status',
                            width: 0,
                            render: (_, record) => <CustomFunctionLogsStatus record={record} customFunctionId={id} />,
                        },
                        ...columns.filter((column) => column.key !== 'logLevel'),
                    ]

                    return newColumns
                }}
                renderMessage={(message) => renderCustomFunctionMessage(message)}
            />
        </>
    )
}

type CustomFunctionLogsStatus = 'success' | 'failure' | 'running'

function CustomFunctionLogsStatus({
    record,
    customFunctionId,
}: {
    record: GroupedLogEntry
    customFunctionId: string
}): JSX.Element {
    const logicProps: LogsViewerLogicProps = {
        sourceType: 'custom_function',
        sourceId: customFunctionId,
    }
    const { loadSampleGlobals, toggleExpanded } = useActions(customFunctionTestLogic({ id: customFunctionId }))
    const { contextId } = useValues(customFunctionConfigurationLogic({ id: customFunctionId }))

    const { retries, selectingMany, selectedForRetry, eventIdByInvocationId } = useValues(
        customFunctionLogsLogic(logicProps)
    )
    const { retryInvocations, setSelectingMany, setSelectedForRetry } = useActions(customFunctionLogsLogic(logicProps))

    const thisRetry = retries[record.instanceId]

    const status = useMemo<CustomFunctionLogsStatus>((): CustomFunctionLogsStatus => {
        if (thisRetry === 'pending') {
            return 'running'
        }

        const lastEntry = record.entries[record.entries.length - 1]

        if (lastEntry.message.includes('Function completed') || lastEntry.message.includes('Execution successful')) {
            return 'success'
        }

        if (lastEntry.level === 'ERROR') {
            return 'failure'
        }

        return 'running'
    }, [record, thisRetry])

    const eventId = eventIdByInvocationId?.[record.instanceId]

    const internalEvent = ['error-tracking', 'insight-alerts', 'activity-log'].includes(contextId)

    return (
        <div className="flex items-center gap-2">
            {selectingMany ? (
                <LemonCheckbox
                    checked={selectedForRetry[record.instanceId] ?? false}
                    onChange={(checked) => setSelectedForRetry({ [record.instanceId]: checked })}
                />
            ) : null}
            <LemonTag type={status === 'success' ? 'success' : status === 'failure' ? 'danger' : 'warning'}>
                {capitalizeFirstLetter(status)}
            </LemonTag>

            {!internalEvent && (
                <LemonMenu
                    items={[
                        eventId
                            ? {
                                  label: 'View event',
                                  to: urls.event(eventId, ''),
                              }
                            : null,
                        {
                            label: 'Retry event',
                            disabledReason: !eventId ? 'Could not find the source event' : undefined,
                            onClick: () => retryInvocations([record]),
                        },
                        {
                            label: 'Select for retry',
                            onClick: () => {
                                setSelectingMany(true)
                                setSelectedForRetry({
                                    [record.instanceId]: true,
                                })
                            },
                        },
                        {
                            label: 'Test with this event in configuration',
                            onClick: () => {
                                loadSampleGlobals({ eventId })
                                toggleExpanded(true)
                                router.actions.push(urls.customFunction(customFunctionId) + '?tab=configuration')
                            },
                        },
                    ]}
                >
                    <LemonButton
                        size="xsmall"
                        icon={<IconEllipsis className="rotate-90" />}
                        loading={thisRetry === 'pending'}
                    />
                </LemonMenu>
            )}
        </div>
    )
}
