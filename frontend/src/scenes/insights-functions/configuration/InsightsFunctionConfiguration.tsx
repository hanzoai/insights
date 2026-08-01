// Side-effect: registers the CDP script-function approval-card previews (cdp-functions-partial-update diff)
// into the shared Insights AI tool registry. Imported here so it's registered whenever the config scene loads.
import './registerInsightsFunctionToolPreviews'

import clsx from 'clsx'
import { BindLogic, useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import {
    Banner,
    Button,
    Dropdown,
    Label,
    Switch,
    Tag,
    SpinnerOverlay,
} from '@hanzo/elements'

import { NotFound } from 'lib/components/NotFound'
import { Field } from 'lib/elements/Field'
import { insightsFunctionConfigurationLogic } from 'scenes/insights-functions/configuration/insightsFunctionConfigurationLogic'
import { InsightsFunctionFilters } from 'scenes/insights-functions/filters/InsightsFunctionFilters'
import { InsightsFunctionMappings } from 'scenes/insights-functions/mapping/InsightsFunctionMappings'
import { InsightsFunctionEventEstimates } from 'scenes/insights-functions/metrics/InsightsFunctionEventEstimates'
import { SurveyResponseKeysReference } from 'scenes/surveys/components/SurveyResponseKeysReference'

import { useAttachedContext, useToolStreamListener } from 'products/insights_ai/frontend/api/logics'
import { resolveToolCall } from 'products/insights_ai/frontend/api/tools'

import { humanizeInsightsFunctionType } from '../script-function-utils'
import { InsightsFunctionStatusIndicator } from '../misc/InsightsFunctionStatusIndicator'
import { InsightsFunctionStatusTag } from '../misc/InsightsFunctionStatusTag'
import { InsightsFunctionCode } from './components/InsightsFunctionCode'
import {
    InsightsFunctionConfigurationClearChangesButton,
    InsightsFunctionConfigurationSaveButton,
} from './components/InsightsFunctionConfigurationButtons'
import { InsightsFunctionInputs } from './components/InsightsFunctionInputs'
import { InsightsFunctionSourceWebhookInfo } from './components/InsightsFunctionSourceWebhookInfo'
import { InsightsFunctionSourceWebhookTest } from './components/InsightsFunctionSourceWebhookTest'
import { InsightsFunctionTemplateOptions } from './components/InsightsFunctionTemplateOptions'
import { InsightsFunctionTest } from './InsightsFunctionTest'

export interface InsightsFunctionConfigurationProps {
    templateId?: string | null
    subTemplateId?: string | null
    id?: string | null
    logicKey?: string
}

export function InsightsFunctionConfiguration({
    templateId,
    subTemplateId,
    id,
    logicKey,
}: InsightsFunctionConfigurationProps): JSX.Element {
    const logicProps = { templateId, subTemplateId, id, logicKey }
    const logic = insightsFunctionConfigurationLogic(logicProps)
    const {
        loading,
        loaded,
        insightsFunction,
        template,
        templateHasChanged,
        type,
        mightDropEvents,
        showFilters,
        showExpectedVolume,
        canEditSource,
        showTesting,
        survey,
    } = useValues(logic)
    const { loadInsightsFunction } = useActions(logic)

    // The section components attach the config blobs (code, inputs, filters) as unkeyed values; only a
    // keyed item renders its id into the context line, and the agent needs the id for cdp-functions-partial-update.
    useAttachedContext(
        insightsFunction?.id
            ? [
                  {
                      type: 'insights_function',
                      key: insightsFunction.id,
                      label: `Current ${humanizeInsightsFunctionType(type)}: ${insightsFunction.name}`,
                  },
              ]
            : null
    )

    // An approved `cdp-functions-partial-update` mutates the function server-side while this form keeps
    // pre-update state, so the scene (and the approval-card diff for any later proposal, e.g. a revert)
    // would show stale values. Refetch on completion — `loadInsightsFunctionSuccess` resets the form, which
    // also discards unsaved manual edits; tool results land in the open scene. A plain tool-stream
    // listener, not `useMcpToolApplyBack`: the refetch is idempotent, so it must not be dropped by the
    // apply-back claim gating (claims snapshot the targets mounted at prompt-send and release each turn).
    useToolStreamListener({
        tools: ['cdp-functions-partial-update'],
        onEvent: (event) => {
            if (event.phase !== 'completed' || !insightsFunction?.id) {
                return
            }
            // A parseable payload targeting a different function is not ours to absorb; an unparseable
            // one may still be ours, and a same-data refetch is harmless, so reload in that case.
            const innerInput = resolveToolCall(event.invocation).innerInput
            const targetId = typeof innerInput?.id === 'string' ? innerInput.id : null
            if (targetId && targetId !== insightsFunction.id) {
                return
            }
            loadInsightsFunction()
        },
    })

    if (loading && !loaded) {
        return <SpinnerOverlay />
    }

    if (!loaded) {
        return <NotFound object="Script function" />
    }

    const templateInfo =
        insightsFunction?.template?.code_language === 'script' &&
        insightsFunction?.template &&
        !insightsFunction.template.id.startsWith('template-blank-') ? (
            <Dropdown showArrow overlay={<InsightsFunctionTemplateOptions />}>
                <Button type="tertiary" size="small" className="border border-dashed" fullWidth>
                    <span className="flex flex-wrap flex-1 gap-1 items-center">
                        Built from template:
                        <span className="font-semibold">{insightsFunction?.template.name}</span>
                        <InsightsFunctionStatusTag status={insightsFunction.template.status} />
                        <div className="flex-1" />
                        {templateHasChanged ? <Tag type="success">Modified</Tag> : null}
                    </span>
                </Button>
            </Dropdown>
        ) : null

    return (
        <div className="deprecated-space-y-3">
            <BindLogic logic={insightsFunctionConfigurationLogic} props={logicProps}>
                {insightsFunction?.filters?.bytecode_error ? (
                    <div>
                        <Banner type="error">
                            <b>Error saving filters:</b> {insightsFunction.filters.bytecode_error}
                        </Banner>
                    </div>
                ) : [
                      'template-google-ads',
                      'template-meta-ads',
                      'template-tiktok-ads',
                      'template-snapchat-ads',
                      'template-linkedin-ads',
                      'template-reddit-pixel',
                      'template-tiktok-pixel',
                      'template-snapchat-pixel',
                      'template-reddit-conversions-api',
                  ].includes(templateId ?? insightsFunction?.template?.id ?? '') ||
                  template?.status === 'alpha' ||
                  insightsFunction?.template?.status === 'alpha' ? (
                    <div>
                        <Banner type="warning">
                            <p>
                                This {humanizeInsightsFunctionType(type)} is currently in an experimental state. For many
                                cases this will work just fine but for others there may be unexpected issues and we do
                                not offer official customer support for it in these cases.
                            </p>
                            {['template-reddit-conversions-api', 'template-snapchat-ads'].includes(
                                templateId ?? insightsFunction?.template?.id ?? ''
                            ) ? (
                                <span className="mt-2">
                                    The receiving destination imposes a rate limit of 10 events per second. Exceeding
                                    this limit may result in some events failing to be delivered.
                                </span>
                            ) : null}
                            {['site_destination'].includes(template?.type ?? insightsFunction?.template?.type ?? '') ? (
                                <span className="mt-2">
                                    Make sure to enable the `opt_in_site_apps` flag in your `insights.init` config.
                                </span>
                            ) : null}
                        </Banner>
                    </div>
                ) : null}

                <Form
                    logic={insightsFunctionConfigurationLogic}
                    props={logicProps}
                    formKey="configuration"
                    className="deprecated-space-y-3"
                >
                    <div className="flex flex-wrap gap-4 items-start">
                        <div className="flex flex-col flex-1 gap-4 min-w-100">
                            <div className={clsx('p-3 rounded border deprecated-space-y-2 bg-surface-primary')}>
                                <div className="flex items-center justify-between">
                                    <Label>Status</Label>
                                    {insightsFunction && <InsightsFunctionStatusIndicator insightsFunction={insightsFunction} />}
                                </div>
                                <Field name="enabled">
                                    {({ value, onChange }) => (
                                        <Switch
                                            onChange={() => onChange(!value)}
                                            checked={value}
                                            disabled={loading}
                                            bordered
                                            fullWidth
                                            label={type === 'transformation_log' ? 'Enable' : 'Enable destination'}
                                            tooltip={
                                                <>
                                                    {type === 'transformation_log'
                                                        ? value
                                                            ? 'Enabled. Log records will be processed.'
                                                            : 'Disabled. Log records will not be processed.'
                                                        : value
                                                          ? 'Enabled. Events will be processed.'
                                                          : 'Disabled. Events will not be processed.'}
                                                </>
                                            }
                                        />
                                    )}
                                </Field>

                                {templateInfo}
                            </div>

                            {type === 'source_webhook' && <InsightsFunctionSourceWebhookInfo />}
                            {showFilters && <InsightsFunctionFilters />}
                            {survey && <SurveyResponseKeysReference questions={survey.questions} />}
                            {showExpectedVolume ? <InsightsFunctionEventEstimates /> : null}
                        </div>

                        <div className="deprecated-space-y-4 flex-2 min-w-100">
                            {mightDropEvents && (
                                <div>
                                    <Banner type="info">
                                        {type === 'transformation_log' ? (
                                            <>
                                                <b>Warning:</b> This transformation can drop log records irreversibly
                                                (any record it returns null for is discarded). Double check your code
                                                before enabling.
                                            </>
                                        ) : (
                                            <>
                                                <b>Warning:</b> This transformation can filter out events, dropping them
                                                irreversibly. Make sure to double check your configuration, and use
                                                filters to limit the events that this transformation is applied to.
                                            </>
                                        )}
                                    </Banner>
                                </div>
                            )}
                            <InsightsFunctionInputs />

                            <InsightsFunctionMappings />

                            {canEditSource && <InsightsFunctionCode />}
                            {showTesting ? <InsightsFunctionTest /> : null}
                            {type === 'source_webhook' && <InsightsFunctionSourceWebhookTest />}
                            <div className="flex gap-2 justify-end">
                                <InsightsFunctionConfigurationClearChangesButton />
                                <InsightsFunctionConfigurationSaveButton />
                            </div>
                        </div>
                    </div>
                </Form>
            </BindLogic>
        </div>
    )
}
