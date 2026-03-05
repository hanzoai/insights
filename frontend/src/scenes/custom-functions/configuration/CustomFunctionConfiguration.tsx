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
import { customFunctionConfigurationLogic } from 'scenes/custom-functions/configuration/customFunctionConfigurationLogic'
import { CustomFunctionFilters } from 'scenes/custom-functions/filters/CustomFunctionFilters'
import { CustomFunctionMappings } from 'scenes/custom-functions/mapping/CustomFunctionMappings'
import { CustomFunctionEventEstimates } from 'scenes/custom-functions/metrics/CustomFunctionEventEstimates'

import { humanizeCustomFunctionType } from '../custom-function-utils'
import { CustomFunctionStatusIndicator } from '../misc/CustomFunctionStatusIndicator'
import { CustomFunctionStatusTag } from '../misc/CustomFunctionStatusTag'
import { CustomFunctionTest } from './CustomFunctionTest'
import { CustomFunctionCode } from './components/CustomFunctionCode'
import {
    CustomFunctionConfigurationClearChangesButton,
    CustomFunctionConfigurationSaveButton,
} from './components/CustomFunctionConfigurationButtons'
import { CustomFunctionInputs } from './components/CustomFunctionInputs'
import { CustomFunctionSourceWebhookInfo } from './components/CustomFunctionSourceWebhookInfo'
import { CustomFunctionSourceWebhookTest } from './components/CustomFunctionSourceWebhookTest'
import { CustomFunctionTemplateOptions } from './components/CustomFunctionTemplateOptions'

export interface CustomFunctionConfigurationProps {
    templateId?: string | null
    subTemplateId?: string | null
    id?: string | null
    logicKey?: string
}

export function CustomFunctionConfiguration({
    templateId,
    subTemplateId,
    id,
    logicKey,
}: CustomFunctionConfigurationProps): JSX.Element {
    const logicProps = { templateId, subTemplateId, id, logicKey }
    const logic = customFunctionConfigurationLogic(logicProps)
    const {
        configuration,
        loading,
        loaded,
        customFunction,
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
        customFunction?.template?.code_language === 'hog' &&
        customFunction?.template &&
        !customFunction.template.id.startsWith('template-blank-') ? (
            <LemonDropdown showArrow overlay={<CustomFunctionTemplateOptions />}>
                <LemonButton type="tertiary" size="small" className="border border-dashed" fullWidth>
                    <span className="flex flex-wrap flex-1 gap-1 items-center">
                        Built from template:
                        <span className="font-semibold">{customFunction?.template.name}</span>
                        <CustomFunctionStatusTag status={customFunction.template.status} />
                        <div className="flex-1" />
                        {templateHasChanged ? <LemonTag type="success">Modified</LemonTag> : null}
                    </span>
                </LemonButton>
            </LemonDropdown>
        ) : null

    return (
        <div className="deprecated-space-y-3">
            <BindLogic logic={customFunctionConfigurationLogic} props={logicProps}>
                {customFunction?.filters?.bytecode_error ? (
                    <div>
                        <LemonBanner type="error">
                            <b>Error saving filters:</b> {customFunction.filters.bytecode_error}
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
                  ].includes(templateId ?? customFunction?.template?.id ?? '') ||
                  template?.status === 'alpha' ||
                  customFunction?.template?.status === 'alpha' ? (
                    <div>
                        <LemonBanner type="warning">
                            <p>
                                This {humanizeCustomFunctionType(type)} is currently in an experimental state. For many
                                cases this will work just fine but for others there may be unexpected issues and we do
                                not offer official customer support for it in these cases.
                            </p>
                            {['template-reddit-conversions-api', 'template-snapchat-ads'].includes(
                                templateId ?? customFunction?.template?.id ?? ''
                            ) ? (
                                <span className="mt-2">
                                    The receiving destination imposes a rate limit of 10 events per second. Exceeding
                                    this limit may result in some events failing to be delivered.
                                </span>
                            ) : null}
                            {['site_destination'].includes(template?.type ?? customFunction?.template?.type ?? '') ? (
                                <span className="mt-2">
                                    Make sure to enable the `opt_in_site_apps` flag in your `posthog.init` config.
                                </span>
                            ) : null}
                        </LemonBanner>
                    </div>
                ) : null}

                <Form
                    logic={customFunctionConfigurationLogic}
                    props={logicProps}
                    formKey="configuration"
                    className="deprecated-space-y-3"
                >
                    <div className="flex flex-wrap gap-4 items-start">
                        <div className="flex flex-col flex-1 gap-4 min-w-100">
                            <div className={clsx('p-3 rounded border deprecated-space-y-2 bg-surface-primary')}>
                                <div className="flex items-center justify-between">
                                    <LemonLabel>Status</LemonLabel>
                                    {customFunction && <CustomFunctionStatusIndicator customFunction={customFunction} />}
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

                            {type === 'source_webhook' && <CustomFunctionSourceWebhookInfo />}
                            {showFilters && <CustomFunctionFilters />}
                            {showExpectedVolume ? <CustomFunctionEventEstimates /> : null}
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
                            <CustomFunctionInputs />

                            <CustomFunctionMappings />

                            {canEditSource && <CustomFunctionCode />}
                            {showTesting ? <CustomFunctionTest /> : null}
                            {type === 'source_webhook' && <CustomFunctionSourceWebhookTest />}
                            <div className="flex gap-2 justify-end">
                                <CustomFunctionConfigurationClearChangesButton />
                                <CustomFunctionConfigurationSaveButton />
                            </div>
                        </div>
                    </div>
                </Form>
            </BindLogic>
        </div>
    )
}
