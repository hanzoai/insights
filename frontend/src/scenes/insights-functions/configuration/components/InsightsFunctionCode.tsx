import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { useRef } from 'react'

import { IconInfo } from '@hanzo/icons'
import { Banner, Button, Dropdown, Link } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { CodeEditorResizeable } from 'lib/monaco/CodeEditorResizable'
import MaxTool from 'scenes/max/MaxTool'

import { iconForType } from '~/layout/panel-layout/ProjectTree/defaultTree'

import { insightsFunctionConfigurationLogic } from '../insightsFunctionConfigurationLogic'
import { InsightsFunctionTemplateOptions } from './InsightsFunctionTemplateOptions'

export function InsightsFunctionCode(): JSX.Element {
    const {
        showSource,
        configuration,
        sampleGlobalsWithInputs,
        templateHasChanged,
        type,
        mightDropEvents,
        oldIQLCode,
        newScriptCode,
    } = useValues(insightsFunctionConfigurationLogic)

    const {
        setShowSource,
        setOldIQLCode,
        setNewIQLCode,
        clearIQLCodeDiff,
        reportAIInsightsFunctionPrompted,
        reportAIInsightsFunctionAccepted,
        reportAIInsightsFunctionRejected,
        reportAIInsightsFunctionPromptOpen,
    } = useActions(insightsFunctionConfigurationLogic)

    const sourceCodeRef = useRef<HTMLDivElement>(null)

    const content = (
        <div
            ref={sourceCodeRef}
            className={clsx(
                'p-3 rounded border deprecated-space-y-2',
                showSource ? 'bg-surface-primary' : 'bg-surface-secondary'
            )}
        >
            <div className="flex gap-2 justify-end items-center">
                <div className="flex-1 deprecated-space-y-2">
                    <h2 className="mb-0">Edit source</h2>
                    {!showSource ? <p>Click here to edit the function's source code</p> : null}
                </div>

                {templateHasChanged ? (
                    <Dropdown showArrow overlay={<InsightsFunctionTemplateOptions />}>
                        <Button type="tertiary" size={showSource ? 'xsmall' : 'small'} icon={<IconInfo />}>
                            Modified code
                        </Button>
                    </Dropdown>
                ) : null}

                {!showSource ? (
                    <Button
                        type="secondary"
                        onClick={() => {
                            setShowSource(true)
                            setTimeout(() => {
                                sourceCodeRef.current?.scrollIntoView({
                                    behavior: 'smooth',
                                    block: 'start',
                                })
                            }, 100)
                        }}
                    >
                        Edit source code
                    </Button>
                ) : (
                    <Button size="xsmall" type="secondary" onClick={() => setShowSource(false)}>
                        Hide source code
                    </Button>
                )}
            </div>

            {showSource ? (
                <Field name="iql">
                    {({ value, onChange }) => (
                        <>
                            {!type.startsWith('site_') ? (
                                <span className="text-xs text-secondary">
                                    This is the underlying Custom code that will run whenever this triggers.{' '}
                                    <Link to="https://hanzo.ai/docs/iql">See the docs</Link> for more info
                                </span>
                            ) : null}
                            {mightDropEvents && (
                                <Banner type="warning" className="mt-2">
                                    <b>Warning:</b> Returning null or undefined will drop the event. If this is
                                    unintentional, return the event object instead.
                                </Banner>
                            )}
                            {type === 'source_webhook' && (
                                <Banner type="info" className="mt-2">
                                    <b>HTTP requests:</b> Webhook sources can call <code>insightsCapture</code> to
                                    ingest events to Insights. You can also do HTTP calls with <code>fetch</code>. In
                                    this case however, the request will be queued to a background task, a{' '}
                                    <code>201 Created</code> response will be returned and the event will be ingested
                                    asynchronously.
                                </Banner>
                            )}
                            <CodeEditorResizeable
                                language={type.startsWith('site_') ? 'typescript' : 'iql'}
                                value={newScriptCode ?? value ?? ''}
                                originalValue={oldIQLCode && newScriptCode ? oldIQLCode : undefined}
                                onChange={(v) => {
                                    // If user manually edits while diff is showing, clear the diff
                                    if (oldIQLCode && newScriptCode) {
                                        clearIQLCodeDiff()
                                    }
                                    onChange(v ?? '')
                                }}
                                globals={sampleGlobalsWithInputs}
                                showDiffActions={!!(oldIQLCode && newScriptCode)}
                                onAcceptChanges={() => {
                                    if (newScriptCode) {
                                        onChange(newScriptCode)
                                    }
                                    reportAIInsightsFunctionAccepted()
                                    clearIQLCodeDiff()
                                }}
                                onRejectChanges={() => {
                                    if (oldIQLCode) {
                                        onChange(oldIQLCode)
                                    }
                                    reportAIInsightsFunctionRejected()
                                    clearIQLCodeDiff()
                                }}
                                options={{
                                    minimap: {
                                        enabled: false,
                                    },
                                    wordWrap: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true,
                                    fixedOverflowWidgets: true,
                                    suggest: {
                                        showInlineDetails: true,
                                    },
                                    quickSuggestionsDelay: 300,
                                    readOnly: !!(oldIQLCode && newScriptCode),
                                }}
                            />
                        </>
                    )}
                </Field>
            ) : null}
        </div>
    )

    return (
        <MaxTool
            identifier="create_iql_transformation_function"
            context={{
                current_iql_code: configuration.fn ?? '',
            }}
            contextDescription={{
                text: 'Current Custom code',
                icon: iconForType('data_warehouse'),
            }}
            callback={(toolOutput: string) => {
                // Store the old value before changing
                setOldIQLCode(configuration.fn ?? '')
                // Store the new value from Max Tool
                setNewIQLCode(toolOutput)
                // Report that AI was prompted
                reportAIInsightsFunctionPrompted()
                // Don't immediately update the form - let user accept/reject
            }}
            onMaxOpen={() => {
                reportAIInsightsFunctionPromptOpen()
            }}
            suggestions={[]}
            introOverride={{
                headline: 'What transformation do you want to create?',
                description: 'Let me help you quickly write the code for your transformation, and tweak it.',
            }}
        >
            {content}
        </MaxTool>
    )
}
