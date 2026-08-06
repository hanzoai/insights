import { useActions, useValues } from 'kea'

import { Banner, Button, Modal } from '@hanzo/elements'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { Markdown } from 'lib/elements/Markdown'
import { Spinner } from 'lib/elements/Spinner'

import { endpointSceneLogic } from './endpointSceneLogic'

export function MaterializationSuggestionModal(): JSX.Element {
    const {
        materializationSuggestionModalOpen,
        materializationSuggestion,
        materializationSuggestionLoading,
        suggestionMatchesCurrentQuery,
    } = useValues(endpointSceneLogic)
    const { closeMaterializationSuggestionModal, applyMaterializationSuggestion, regenerateMaterializationSuggestion } =
        useActions(endpointSceneLogic)

    const suggestion = materializationSuggestion
    const hasValidatedSuggestion = suggestion?.suggestion_status === 'ok' && !!suggestion.suggested_query
    const suggestionFailed =
        suggestion?.suggestion_status === 'invalid' || suggestion?.suggestion_status === 'model_error'
    // The error banner already spells out the failed check — repeating it as context is noise
    const showBlocker = !(suggestionFailed && suggestion?.error === suggestion?.original_reason)

    return (
        <Modal
            isOpen={materializationSuggestionModalOpen}
            onClose={closeMaterializationSuggestionModal}
            title="Make this endpoint materializable"
            description="AI rewrites your query into an equivalent form that passes our materialization checks. Nothing is saved until you apply the changes and update the endpoint."
            width={768}
            footer={
                <>
                    <Button type="secondary" onClick={closeMaterializationSuggestionModal}>
                        Close
                    </Button>
                    <Button
                        type="secondary"
                        onClick={regenerateMaterializationSuggestion}
                        loading={materializationSuggestionLoading}
                        disabledReason={materializationSuggestionLoading ? 'Waiting for the suggestion' : undefined}
                        tooltip="Ask the AI for a fresh rewrite, replacing this suggestion"
                    >
                        Regenerate
                    </Button>
                    <Button
                        type="primary"
                        onClick={applyMaterializationSuggestion}
                        disabledReason={
                            materializationSuggestionLoading
                                ? 'Waiting for the suggestion'
                                : !hasValidatedSuggestion
                                  ? 'No validated suggestion to apply'
                                  : suggestionMatchesCurrentQuery
                                    ? 'Your query already matches this suggestion'
                                    : undefined
                        }
                    >
                        Apply changes to query
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-3">
                {materializationSuggestionLoading ? (
                    <div className="flex items-center gap-2 py-8 justify-center text-muted">
                        <Spinner />
                        <span>Analyzing your query against the materialization rules…</span>
                    </div>
                ) : suggestion ? (
                    <>
                        {showBlocker && (
                            <p className="text-secondary text-sm mb-0">Current blocker: {suggestion.original_reason}</p>
                        )}
                        {suggestion.suggestion_status === 'ok' && suggestionMatchesCurrentQuery && (
                            <Banner type="info">
                                Your current query already matches this suggestion — there is nothing to apply. If you
                                haven't saved yet, update the endpoint to create the new version.
                            </Banner>
                        )}
                        {suggestion.suggestion_status === 'ok' && !suggestionMatchesCurrentQuery && (
                            <>
                                {suggestion.explanation && (
                                    <Markdown lowKeyHeadings disableImages>
                                        {suggestion.explanation}
                                    </Markdown>
                                )}
                                <CodeSnippet language={Language.SQL} wrap>
                                    {suggestion.suggested_query ?? ''}
                                </CodeSnippet>
                                <p className="text-muted text-xs mb-0">
                                    This rewrite passes the live materialization checks and keeps your variables
                                    unchanged. Review it carefully — applying it and saving creates a new version.
                                </p>
                            </>
                        )}
                        {suggestion.suggestion_status === 'cannot_fix' && (
                            <Banner type="info">
                                <Markdown lowKeyHeadings disableImages>
                                    {suggestion.explanation ||
                                        'No semantically equivalent rewrite exists for this query.'}
                                </Markdown>
                            </Banner>
                        )}
                        {suggestionFailed && (
                            <>
                                <Banner type="error">
                                    Couldn't produce a rewrite that passes the checks
                                    {suggestion.error ? `: ${suggestion.error}` : '.'}
                                </Banner>
                                {suggestion.suggested_query && (
                                    <>
                                        <p className="mb-0">
                                            Last attempt (did not pass validation — shown as a starting point):
                                        </p>
                                        <CodeSnippet language={Language.SQL} wrap>
                                            {suggestion.suggested_query}
                                        </CodeSnippet>
                                    </>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <Banner type="error">
                        The suggestion request failed. Check that AI data processing is enabled for your organization,
                        then try again.
                    </Banner>
                )}
            </div>
        </Modal>
    )
}
