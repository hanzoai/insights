import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { useRef } from 'react'

import { IconInfo, IconX } from '@hanzo/icons'
import {
    Banner,
    Button,
    Divider,
    Input,
    Label,
    Select,
    Skeleton,
    Switch,
    Tag,
    Tooltip,
} from '@hanzo/elements'

import { CodeSnippet } from 'lib/components/CodeSnippet'
import { Field } from 'lib/elements/Field'
import { CodeEditorResizeable } from 'lib/monaco/CodeEditorResizable'

import { insightsFunctionConfigurationLogic } from '../insightsFunctionConfigurationLogic'
import { insightsFunctionSourceWebhookTestLogic } from './insightsFunctionSourceWebhookTestLogic'

export function InsightsFunctionSourceWebhookTest(): JSX.Element {
    const { logicProps, configurationChanged } = useValues(insightsFunctionConfigurationLogic)
    const { isTestInvocationSubmitting, testResult, expanded, exampleCurlRequest, testInvocation } = useValues(
        insightsFunctionSourceWebhookTestLogic(logicProps)
    )
    const { submitTestInvocation, setTestResult, toggleExpanded } = useActions(
        insightsFunctionSourceWebhookTestLogic(logicProps)
    )

    const testResultsRef = useRef<HTMLDivElement>(null)

    const unsaved = !logicProps.id

    return (
        <Form logic={insightsFunctionSourceWebhookTestLogic} props={logicProps} formKey="testInvocation" enableFormOnSubmit>
            <div
                ref={testResultsRef}
                className={clsx(
                    'p-3 rounded border',
                    expanded ? 'bg-surface-primary' : 'bg-surface-secondary',
                    expanded ? 'min-h-120' : ''
                )}
            >
                <div className="flex gap-2 justify-end items-center mb-2">
                    <div className="flex-1 deprecated-space-y-2">
                        <h2 className="flex gap-2 items-center mb-0">
                            <span>Testing</span>
                        </h2>
                        {!expanded ? (
                            unsaved ? (
                                <p>Testing tools are only available after creating the webhook</p>
                            ) : (
                                <p>Click here to test your webhook</p>
                            )
                        ) : null}
                    </div>

                    {!expanded ? (
                        <Button
                            data-attr="expand-script-testing"
                            type="secondary"
                            disabledReason={
                                unsaved ? 'Testing tools are only available after creating the webhook' : undefined
                            }
                            onClick={() => {
                                toggleExpanded()
                                // Add a small delay to allow the content to expand
                                setTimeout(() => {
                                    testResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }, 100)
                            }}
                        >
                            Start testing
                        </Button>
                    ) : (
                        <>
                            <Field name="mock_request">
                                {({ value, onChange }) => (
                                    <Switch
                                        onChange={(v) => onChange(!v)}
                                        checked={!value}
                                        data-attr="toggle-script-test-mocking"
                                        className="px-2 py-1"
                                        label={
                                            <Tooltip
                                                title={
                                                    <>
                                                        When disabled, the webhook request will be sent but only tested
                                                        without creating events or performing HTTP requests.
                                                    </>
                                                }
                                            >
                                                <span className="flex gap-2">
                                                    Debug webhook request only
                                                    <IconInfo className="text-lg" />
                                                </span>
                                            </Tooltip>
                                        }
                                    />
                                )}
                            </Field>

                            {expanded && (
                                <Button
                                    data-attr="hide-script-testing"
                                    icon={<IconX />}
                                    onClick={() => toggleExpanded()}
                                    tooltip="Hide testing"
                                />
                            )}
                        </>
                    )}
                </div>

                {expanded ? (
                    <>
                        <Banner type={configurationChanged ? 'warning' : 'info'} className="mb-2">
                            {configurationChanged ? <span>You have unsaved changes.</span> : null}
                            <span>
                                Testing is performed against the latest saved configuration and will create real events.
                            </span>
                        </Banner>

                        <div className="flex flex-col gap-2">
                            <Field name="method" label="HTTP method">
                                <Select
                                    options={[
                                        { label: 'POST', value: 'POST' },
                                        { label: 'GET', value: 'GET' },
                                    ]}
                                />
                            </Field>

                            <Field name="query" label="HTTP Query Parameters">
                                <Input placeholder="e.g. ph_event=event&ph_distinct_id=my-distinct-id" />
                            </Field>
                            <Field name="headers" label="HTTP Headers">
                                {({ value, onChange }) => (
                                    <CodeEditorResizeable
                                        language="json"
                                        value={value}
                                        onChange={onChange}
                                        maxHeight={200}
                                    />
                                )}
                            </Field>
                            {testInvocation.method !== 'GET' && (
                                <Field name="body" label="HTTP Body">
                                    {({ value, onChange }) => (
                                        <CodeEditorResizeable
                                            language="json"
                                            value={value}
                                            onChange={onChange}
                                            maxHeight={200}
                                        />
                                    )}
                                </Field>
                            )}
                            <Divider className="my-4" />
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2 justify-between items-center">
                                    <Label className="flex-1">
                                        Response
                                        {testResult && (
                                            <>
                                                <Tag
                                                    type={
                                                        testResult.status >= 200 && testResult.status < 300
                                                            ? 'success'
                                                            : 'danger'
                                                    }
                                                >
                                                    {testResult.status}
                                                </Tag>
                                            </>
                                        )}
                                    </Label>
                                    {testResult ? (
                                        <Button type="secondary" size="small" onClick={() => setTestResult(null)}>
                                            Clear
                                        </Button>
                                    ) : null}
                                    <Button
                                        type="primary"
                                        data-attr="test-script-webhook"
                                        onClick={submitTestInvocation}
                                        loading={isTestInvocationSubmitting}
                                        size="small"
                                    >
                                        Test webhook
                                    </Button>
                                </div>

                                {testResult ? (
                                    <div className="flex flex-col gap-2">
                                        <CodeSnippet thing="Response body">{testResult.body}</CodeSnippet>
                                    </div>
                                ) : isTestInvocationSubmitting ? (
                                    <Skeleton className="h-12" />
                                ) : (
                                    <p>No response yet</p>
                                )}
                            </div>
                        </div>

                        <Divider className="my-4" />

                        {/* Show an example curl request */}
                        <CodeSnippet thing="Example request">{exampleCurlRequest}</CodeSnippet>
                    </>
                ) : null}
            </div>
        </Form>
    )
}
