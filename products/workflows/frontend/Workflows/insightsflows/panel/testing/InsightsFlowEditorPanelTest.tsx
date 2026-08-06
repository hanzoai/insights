import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { useEffect } from 'react'

import { IconInfo, IconPlayFilled, IconRedo, IconTestTube } from '@hanzo/icons'
import {
    Banner,
    Button,
    Collapse,
    Divider,
    Label,
    Switch,
    Link,
    ProfilePicture,
    Spinner,
    Tooltip,
} from '@hanzo/elements'

import { TaxonomicFilter } from 'lib/components/TaxonomicFilter/TaxonomicFilter'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { TZLabel } from 'lib/components/TZLabel'
import { Field } from 'lib/elements/Field'
import { Popover } from 'lib/elements/Popover/Popover'
import { InsightsFunctionTestEditor } from 'scenes/insights-functions/configuration/InsightsFunctionTest'
import { LogsViewerTable } from 'scenes/insights-functions/logs/LogsViewer'
import { asDisplay } from 'scenes/persons/person-utils'
import { urls } from 'scenes/urls'

import { renderWorkflowLogMessage } from '../../../logs/log-utils'
import { TRIGGER_NODE_ID, workflowLogic } from '../../../workflowLogic'
import { hogFlowEditorLogic } from '../../hogFlowEditorLogic'
import { hogFlowEditorTestLogic } from './hogFlowEditorTestLogic'

export function InsightsFlowTestPanelNonSelected(): JSX.Element {
    return (
        <div className="p-2">
            <div className="p-8 text-center rounded border bg-surface-secondary">
                <div className="text-muted">Please select a node...</div>
            </div>
        </div>
    )
}

export function InsightsFlowEditorPanelTest(): JSX.Element | null {
    const { workflow, selectedNode } = useValues(hogFlowEditorLogic)
    const { setSelectedNodeId } = useActions(hogFlowEditorLogic)
    const { logicProps } = useValues(workflowLogic)

    const {
        sampleGlobals,
        sampleGlobalsLoading,
        sampleGlobalsError,
        noMatchingEvents,
        canTryExtendedSearch,
        isTestInvocationSubmitting,
        testResult,
        shouldLoadSampleGlobals,
        nextActionId,
        eventPanelOpen,
        eventSelectorOpen,
        lastSearchedEventName,
    } = useValues(hogFlowEditorTestLogic(logicProps))
    const {
        submitTestInvocation,
        setTestResult,
        loadSampleGlobals,
        loadSampleEventByName,
        setSampleGlobals,
        setEventPanelOpen,
        setEventSelectorOpen,
    } = useActions(hogFlowEditorTestLogic(logicProps))

    const display = asDisplay(sampleGlobals?.person)
    const url = urls.personByDistinctId(sampleGlobals?.event?.distinct_id || '')

    useEffect(() => {
        setTestResult(null)
    }, [selectedNode?.id, setTestResult])

    if (!selectedNode) {
        return (
            <div className="m-8 text-center flex flex-col gap-2 items-center">
                <h1>
                    <IconTestTube className="mr-2" />
                    Test your workflow
                </h1>

                <p>Step through each action in your workflow and see how it behaves.</p>

                <Button type="primary" onClick={() => setSelectedNodeId(TRIGGER_NODE_ID)}>
                    Start testing
                </Button>
            </div>
        )
    }

    return (
        <Form
            logic={hogFlowEditorTestLogic}
            props={logicProps}
            formKey="testInvocation"
            enableFormOnSubmit
            className="flex overflow-hidden flex-col flex-1"
        >
            <div className="flex gap-2 items-center p-2">
                <Field name="mock_async_functions" className="flex-1">
                    {({ value, onChange }) => (
                        <Switch
                            onChange={(v) => onChange(!v)}
                            checked={!value}
                            data-attr="toggle-workflow-test-panel-new-mocking"
                            className="whitespace-nowrap"
                            size="small"
                            bordered
                            label={
                                <Tooltip
                                    title={
                                        <>
                                            When disabled, message deliveries and other async actions will not be
                                            called. Instead they will be mocked out and logged.
                                        </>
                                    }
                                >
                                    <span className="flex gap-2">
                                        Make real HTTP requests
                                        <IconInfo className="text-lg" />
                                    </span>
                                </Tooltip>
                            }
                        />
                    )}
                </Field>
                {testResult ? (
                    <>
                        <div className="flex-1" />
                        <Button
                            type="secondary"
                            onClick={() => setTestResult(null)}
                            loading={isTestInvocationSubmitting}
                            size="small"
                            data-attr="clear-workflow-test-panel-new-result"
                        >
                            Clear test result
                        </Button>

                        {nextActionId && (
                            <Button
                                type="primary"
                                onClick={() => setSelectedNodeId(nextActionId)}
                                icon={<IconPlayFilled />}
                                loading={isTestInvocationSubmitting}
                                size="small"
                                data-attr="continue-workflow-test-panel-new"
                            >
                                Go to next step
                            </Button>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex-1" />

                        <Button
                            type="primary"
                            data-attr="test-workflow-panel-new"
                            onClick={() => submitTestInvocation()}
                            loading={isTestInvocationSubmitting}
                            disabledReason={sampleGlobals ? undefined : 'Must load event to run test'}
                            size="small"
                        >
                            Run test
                        </Button>
                    </>
                )}
            </div>
            <Divider className="my-0" />
            <div className="flex flex-col flex-1 overflow-y-auto">
                {/* Event Information */}
                <div className="flex-0">
                    <Collapse
                        embedded
                        multiple
                        activeKeys={eventPanelOpen}
                        onChange={setEventPanelOpen}
                        panels={[
                            {
                                key: 'event',
                                header: sampleGlobalsLoading ? (
                                    <>
                                        Loading test event... <Spinner />
                                    </>
                                ) : (
                                    <>Test event: {sampleGlobals?.event?.event} </>
                                ),
                                className: 'bg-surface-secondary',
                                content: (
                                    <div>
                                        <div className="bg-surface-secondary">
                                            {sampleGlobalsError && (
                                                <div>
                                                    <Banner type="info" className="mb-2">
                                                        {sampleGlobalsError}
                                                    </Banner>
                                                    {canTryExtendedSearch && (
                                                        <div className="mb-2 text-center">
                                                            <Button
                                                                type="primary"
                                                                onClick={() => {
                                                                    if (shouldLoadSampleGlobals) {
                                                                        loadSampleGlobals({ extendedSearch: true })
                                                                    } else {
                                                                        // For non-event triggers, reload with the last searched event name
                                                                        loadSampleEventByName({
                                                                            eventName:
                                                                                lastSearchedEventName || '$pageview',
                                                                            extendedSearch: true,
                                                                        })
                                                                    }
                                                                }}
                                                                loading={sampleGlobalsLoading}
                                                            >
                                                                Try searching last 30 days (slower)
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex gap-2 items-center">
                                                <ProfilePicture name={display} />
                                                <div className="flex-1">
                                                    {sampleGlobals?.person ? (
                                                        <Link to={url} className="flex gap-2 items-center">
                                                            <span className="font-semibold">{display}</span>
                                                        </Link>
                                                    ) : (
                                                        <span className="text-muted">Loading...</span>
                                                    )}{' '}
                                                    <span className="text-muted">performed</span>{' '}
                                                    <span className="space-y-1 font-semibold text-md">
                                                        {sampleGlobals?.event?.event}
                                                    </span>{' '}
                                                    {sampleGlobals?.event?.timestamp && (
                                                        <TZLabel time={sampleGlobals?.event?.timestamp} />
                                                    )}
                                                </div>
                                                {shouldLoadSampleGlobals ? (
                                                    <Button
                                                        type="secondary"
                                                        onClick={() => loadSampleGlobals()}
                                                        tooltip={
                                                            noMatchingEvents
                                                                ? 'No events match the current filters. Try adjusting your trigger filters.'
                                                                : 'Find the last event matching the trigger event filters, and use it to populate the globals for a test run.'
                                                        }
                                                        disabledReason={
                                                            noMatchingEvents
                                                                ? 'No matching events found - adjust your trigger filters'
                                                                : undefined
                                                        }
                                                        icon={<IconRedo />}
                                                        size="small"
                                                    >
                                                        Load new event
                                                    </Button>
                                                ) : (
                                                    <Popover
                                                        overlay={
                                                            <TaxonomicFilter
                                                                groupType={TaxonomicFilterGroupType.Events}
                                                                value={sampleGlobals?.event?.event || ''}
                                                                onChange={(_, value) => {
                                                                    if (typeof value === 'string') {
                                                                        loadSampleEventByName({ eventName: value })
                                                                    }
                                                                }}
                                                                allowNonCapturedEvents
                                                                taxonomicGroupTypes={[
                                                                    TaxonomicFilterGroupType.CustomEvents,
                                                                    TaxonomicFilterGroupType.Events,
                                                                ]}
                                                            />
                                                        }
                                                        visible={eventSelectorOpen}
                                                        onClickOutside={() => setEventSelectorOpen(false)}
                                                        placement="bottom-end"
                                                    >
                                                        <Button
                                                            type="secondary"
                                                            onClick={() => setEventSelectorOpen(!eventSelectorOpen)}
                                                            tooltip="Select an event type to load test data"
                                                            size="small"
                                                        >
                                                            {sampleGlobals?.event?.event || 'Select event'}
                                                        </Button>
                                                    </Popover>
                                                )}
                                            </div>

                                            {/* Event Properties */}
                                            {sampleGlobals && (
                                                <>
                                                    <div className="text-sm mt-2">
                                                        Here are all the global variables you can use in your workflow:
                                                    </div>
                                                    <div className="flex-col gap-2 my-3 max-h-48 overflow-auto">
                                                        <InsightsFunctionTestEditor
                                                            value={JSON.stringify(sampleGlobals, null, 2)}
                                                            onChange={setSampleGlobals}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </div>
                <Divider className="my-0" />
                <div className="flex flex-col flex-1 gap-2 p-2">
                    <h3 className="mb-0">Test results</h3>
                    {!testResult ? (
                        <div className="text-muted text-sm">No tests run yet</div>
                    ) : (
                        <>
                            <Banner
                                type={
                                    testResult.status === 'success'
                                        ? 'success'
                                        : testResult.status === 'skipped'
                                          ? 'warning'
                                          : 'error'
                                }
                            >
                                {testResult.status === 'success'
                                    ? 'Success'
                                    : testResult.status === 'skipped'
                                      ? 'Workflow was skipped because the event did not match the filter criteria'
                                      : 'Error: ' + testResult.errors?.join(', ')}
                            </Banner>

                            <div className="flex flex-col gap-2">
                                <Label>Logs</Label>

                                <LogsViewerTable
                                    instanceLabel="workflow run"
                                    renderMessage={(m) => renderWorkflowLogMessage(workflow, m)}
                                    dataSource={testResult.logs ?? []}
                                    renderColumns={(columns) => columns.filter((column) => column.key !== 'instanceId')}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Form>
    )
}
