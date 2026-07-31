import { Monaco } from '@monaco-editor/react'
import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { router } from 'kea-router'
import type { editor as importedEditor } from 'monaco-editor'
import { useEffect, useRef, useState } from 'react'

import { IconMagicWand } from '@hanzo/icons'
import { Input, Link } from '@hanzo/elements'

import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { Banner } from 'lib/elements/Banner'
import { Button } from 'lib/elements/Button'
import { CodeEditor } from 'lib/monaco/CodeEditor'
import { CodeEditorLogicProps, codeEditorLogic } from 'lib/monaco/codeEditorLogic'
import { dataWarehouseSettingsSceneLogic } from 'scenes/data-warehouse/settings/dataWarehouseSettingsSceneLogic'
import { urls } from 'scenes/urls'

import { InsightsQLQuery } from '~/queries/schema/schema-general'

import { insightsQLQueryEditorLogic } from './insightsQLQueryEditorLogic'

export interface InsightsQLQueryEditorProps {
    query: InsightsQLQuery
    setQuery?: (query: InsightsQLQuery) => void
    onChange?: (query: string) => void
    embedded?: boolean
    editorFooter?: (hasErrors: boolean, errors: string | null) => JSX.Element
    queryResponse?: Record<string, any>
}

let uniqueNode = 0

const EDITOR_HEIGHT = 222

export function InsightsQLQueryEditor(props: InsightsQLQueryEditorProps): JSX.Element {
    const editorRef = useRef<HTMLDivElement | null>(null)

    const [key, setKey] = useState(() =>
        router.values.location.pathname.includes(urls.sqlEditor()) ? router.values.location.pathname : uniqueNode++
    )

    useEffect(() => {
        if (router.values.location.pathname.includes(urls.sqlEditor())) {
            setKey(router.values.location.pathname)
        }
    }, [router.values.location.pathname])

    const [monacoAndEditor, setMonacoAndEditor] = useState(
        null as [Monaco, importedEditor.IStandaloneCodeEditor] | null
    )
    const [monaco, editor] = monacoAndEditor ?? []
    const insightsQLQueryEditorLogicProps = {
        query: props.query,
        setQuery: props.setQuery,
        onChange: props.onChange,
        key,
        editor,
        monaco,
        queryResponse: props.queryResponse,
    }
    const logic = insightsQLQueryEditorLogic(insightsQLQueryEditorLogicProps)
    const { queryInput, prompt, aiAvailable, promptError, promptLoading } = useValues(logic)
    const { setQueryInput, saveQuery, setPrompt, draftFromPrompt, saveAsView, onUpdateView } = useActions(logic)

    const codeEditorKey = `insightsQLQueryEditor/${key}`

    const codeEditorLogicProps: CodeEditorLogicProps = {
        key: codeEditorKey,
        sourceQuery: props.query,
        query: queryInput,
        language: 'insightsQL',
        metadataFilters: props.query.filters,
    }

    const { hasErrors, error } = useValues(codeEditorLogic(codeEditorLogicProps))

    const { editingView } = useValues(
        dataWarehouseSettingsSceneLogic({
            monaco,
            editor,
        })
    )

    // Clear editor state on unmount to avoid holding references to disposed editor
    useOnMountEffect(() => {
        return () => {
            setMonacoAndEditor(null)
        }
    })

    return (
        <div className="flex items-start gap-2">
            <div
                data-attr="insightsql-query-editor"
                className={clsx(
                    'flex flex-col rounded deprecated-space-y-2 w-full overflow-hidden',
                    !props.embedded && 'p-2 border'
                )}
            >
                <div className="flex gap-2">
                    <Input
                        className="grow"
                        prefix={<IconMagicWand />}
                        value={prompt}
                        onPressEnter={() => draftFromPrompt()}
                        onChange={(value) => setPrompt(value)}
                        placeholder={
                            aiAvailable
                                ? 'What do you want to know? How would you like to tweak the query?'
                                : 'To use AI features, set environment variable OPENAI_API_KEY for this instance of Insights'
                        }
                        disabled={!aiAvailable}
                        maxLength={400}
                    />
                    <Button
                        type="primary"
                        onClick={() => draftFromPrompt()}
                        disabledReason={
                            !aiAvailable
                                ? 'Environment variable OPENAI_API_KEY is unset for this instance of Insights'
                                : !prompt
                                  ? 'Provide a prompt first'
                                  : null
                        }
                        tooltipPlacement="left"
                        loading={promptLoading}
                    >
                        Think
                    </Button>
                </div>
                {promptError ? <Banner type="warning">{promptError}</Banner> : null}
                <div className="relative flex-1 overflow-hidden flex-col">
                    {/* eslint-disable-next-line react/forbid-dom-props */}
                    <div ref={editorRef} className="resize-y overflow-hidden" style={{ height: EDITOR_HEIGHT }}>
                        <CodeEditor
                            queryKey={codeEditorKey}
                            sourceQuery={props.query}
                            className="border rounded-b overflow-hidden h-full"
                            language="insightsQL"
                            value={queryInput}
                            onChange={(v) => {
                                setQueryInput(v ?? '')
                            }}
                            height="100%"
                            onMount={(editor, monaco) => {
                                setMonacoAndEditor([monaco, editor])
                            }}
                            onPressCmdEnter={(value, selectionType) => {
                                if (value && selectionType === 'selection') {
                                    saveQuery(value)
                                } else {
                                    saveQuery()
                                }
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
                            }}
                        />
                    </div>
                </div>
                <div className="flex flex-row px-px">
                    {props.editorFooter ? (
                        props.editorFooter(hasErrors, error)
                    ) : (
                        <>
                            <div className="flex-1">
                                <Button
                                    onClick={() => saveQuery()}
                                    type="primary"
                                    disabledReason={
                                        !props.setQuery
                                            ? 'No permission to update'
                                            : hasErrors
                                              ? (error ?? 'Query has errors')
                                              : undefined
                                    }
                                    center
                                    fullWidth
                                    data-attr="insightsql-query-editor-save"
                                >
                                    {!props.setQuery ? 'No permission to update' : 'Update and run'}
                                </Button>
                            </div>
                            {editingView ? (
                                <Button
                                    className="ml-2"
                                    onClick={onUpdateView}
                                    type="primary"
                                    center
                                    disabledReason={hasErrors ? (error ?? 'Query has errors') : ''}
                                    data-attr="insightsql-query-editor-update-view"
                                >
                                    Update view
                                </Button>
                            ) : (
                                <Button
                                    className="ml-2"
                                    onClick={saveAsView}
                                    type="primary"
                                    center
                                    disabledReason={hasErrors ? (error ?? 'Query has errors') : ''}
                                    data-attr="insightsql-query-editor-save-as-view"
                                    tooltip={
                                        <div>
                                            Save a query as a view that can be referenced in another query. This is
                                            useful for modeling data and organizing large queries into readable chunks.{' '}
                                            <Link to="https://hanzo.ai/docs/data-warehouse">More Info</Link>{' '}
                                        </div>
                                    }
                                >
                                    Save as view
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
