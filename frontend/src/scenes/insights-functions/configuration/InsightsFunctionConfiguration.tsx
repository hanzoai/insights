import clsx from 'clsx'
import { BindLogic, useValues } from 'kea'
import { Form } from 'kea-forms'

import {
    LemonBanner,
    LemonButton,
    LemonDropdown,
    LemonLabel,
    LemonSwitch,
    LemonTag,
    SpinnerOverlay,
} from '@posthog/lemon-ui'

import { NotFound } from 'lib/components/NotFound'
import { LemonField } from 'lib/lemon-ui/LemonField'
import { insightsFunctionConfigurationLogic } from 'scenes/insights-functions/configuration/insightsFunctionConfigurationLogic'
import { InsightsFunctionFilters } from 'scenes/insights-functions/filters/InsightsFunctionFilters'
import { InsightsFunctionMappings } from 'scenes/insights-functions/mapping/InsightsFunctionMappings'
import { InsightsFunctionEventEstimates } from 'scenes/insights-functions/metrics/InsightsFunctionEventEstimates'

import { humanizeInsightsFunctionType } from '../insights-function-utils'
import { InsightsFunctionStatusIndicator } from '../misc/InsightsFunctionStatusIndicator'
import { InsightsFunctionStatusTag } from '../misc/InsightsFunctionStatusTag'
import { InsightsFunctionTest } from './InsightsFunctionTest'
import { InsightsFunctionCode } from './components/InsightsFunctionCode'
import {
    InsightsFunctionConfigurationClearChangesButton,
    InsightsFunctionConfigurationSaveButton,
} from './components/InsightsFunctionConfigurationButtons'
import { InsightsFunctionInputs } from './components/InsightsFunctionInputs'
import { InsightsFunctionSourceWebhookInfo } from './components/InsightsFunctionSourceWebhookInfo'
import { InsightsFunctionSourceWebhookTest } from './components/InsightsFunctionSourceWebhookTest'
import { InsightsFunctionTemplateOptions } from './components/InsightsFunctionTemplateOptions'

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
        configuration,
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
    } = useValues(logic)

    if (loading && !loaded) {
        return <SpinnerOverlay />
    }

    if (!loaded) {
        return <NotFound object="Custom function" />
    }

    const templateInfo =
        insightsFunction?.template?.code_language === 'fn' &&
        insightsFunction?.template &&
        !insightsFunction.template.id.startsWith('template-blank-') ? (
            <LemonDropdown showArrow overlay={<InsightsFunctionTemplateOptions />}>
                <LemonButton type="tertiary" size="small" className="border border-dashed" fullWidth>
                    <span className="flex flex-wrap flex-1 gap-1 items-center">
                        Built from template:
                        <span className="font-semibold">{insightsFunction?.template.name}</span>
                        <InsightsFunctionStatusTag status={insightsFunction.template.status} />
                        <div className="flex-1" />
                        {templateHasChanged ? <LemonTag type="success">Modified</LemonTag> : null}
                    </span>
                </LemonButton>
            </LemonDropdown>
        ) : null

    return (
        <div className="deprecated-space-y-3">
            <BindLogic logic={insightsFunctionConfigurationLogic} props={logicProps}>
                {insightsFunction?.filters?.bytecode_error ? (
                    <div>
                        <LemonBanner type="error">
                            <b>Error saving filters:</b> {insightsFunction.filters.bytecode_error}
                        </LemonBanner>
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
                        <LemonBanner type="warning">
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
                                    Make sure to enable the `opt_in_site_apps` flag in your `posthog.init` config.
                                </span>
                            ) : null}
                        </LemonBanner>
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
                                    <LemonLabel>Status</LemonLabel>
                                    {insightsFunction && <InsightsFunctionStatusIndicator insightsFunction={insightsFunction} />}
                                </div>
                                <LemonField name="enabled">
                                    {({ value, onChange }) => (
                                        <LemonSwitch
                                            onChange={() => onChange(!value)}
                                            checked={value}
                                            disabled={loading}
                                            bordered
                                            fullWidth
                                            label={
                                                <span className="flex flex-1">
                                                    {configuration.enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            }
                                            tooltip={
                                                <>
                                                    {value
                                                        ? 'Enabled. Events will be processed.'
                                                        : 'Disabled. Events will not be processed.'}
                                                </>
                                            }
                                        />
                                    )}
                                </LemonField>

                                {templateInfo}
                            </div>

                            {type === 'source_webhook' && <InsightsFunctionSourceWebhookInfo />}
                            {showFilters && <InsightsFunctionFilters />}
                            {showExpectedVolume ? <InsightsFunctionEventEstimates /> : null}
                        </div>

                        <div className="deprecated-space-y-4 flex-2 min-w-100">
                            {mightDropEvents && (
                                <div>
                                    <LemonBanner type="info">
                                        <b>Warning:</b> This transformation can filter out events, dropping them
                                        irreversibly. Make sure to double check your configuration, and use filters to
                                        limit the events that this transformation is applied to.
                                    </LemonBanner>
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
