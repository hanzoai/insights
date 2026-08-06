import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconRefresh } from '@hanzo/icons'
import { SegmentedButton, Select } from '@hanzo/elements'

import { useFeatureFlag } from 'lib/hooks/useFeatureFlag'
import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input'
import { Skeleton } from 'lib/elements/Skeleton'

import { errorTrackingEditAccessDisabledReason } from '../../../utils'
import { BypassRules } from '../bypass_rules/BypassRules'
import { IssueRateLimitSettings } from './IssueRateLimitSettings'
import { BUCKET_OPTIONS, rateLimitConfigLogic } from './rateLimitConfigLogic'
import { RateLimitHistoryChart } from './RateLimitHistoryChart'
import { formatTotalDuration, RateLimitSimulationChart } from './RateLimitSimulationChart'

export function RateLimitSettings(): JSX.Element {
    const hasPerIssueRateLimit = useFeatureFlag('ERROR_TRACKING_RATE_LIMITING_PER_ISSUE')
    const hasBypassRules = useFeatureFlag('ERROR_TRACKING_RATE_LIMITING_BYPASS')

    return (
        <div className="space-y-8">
            <ProjectRateLimitSection />
            {hasPerIssueRateLimit ? <IssueRateLimitSettings /> : null}
            {hasBypassRules ? <BypassRulesSection /> : null}
        </div>
    )
}

function BypassRulesSection(): JSX.Element {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="font-semibold text-base mb-1">Bypass rules</h3>
                <p className="text-muted-foreground">
                    Exceptions matching a bypass rule are always ingested, skipping the rate limits above.
                </p>
            </div>
            <BypassRules />
        </div>
    )
}

function ProjectRateLimitSection(): JSX.Element {
    const {
        configLoading,
        configFormChanged,
        isConfigFormSubmitting,
        configForm,
        volume,
        volumeLoading,
        volumeBucketMinutes,
        chartMode,
        history,
        historyLoading,
    } = useValues(rateLimitConfigLogic)
    const { setChartMode, refreshChart } = useActions(rateLimitConfigLogic)
    const chartLoading = chartMode === 'history' ? historyLoading : volumeLoading

    if (configLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-64" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div>
                <h3 className="font-semibold text-base mb-1">Project-wide rate limit</h3>
                <p className="text-muted-foreground">
                    This limit applies across the entire project. Exceptions received above the configured rate are
                    dropped at ingestion.
                </p>
            </div>

            <Form logic={rateLimitConfigLogic} formKey="configForm" enableFormOnSubmit>
                <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
                    <div className="md:col-span-3 space-y-3">
                        <Field name="project_rate_limit_value" label="Maximum exceptions">
                            {({ value, onChange }) => (
                                <Input
                                    type="number"
                                    min={1}
                                    value={value ?? undefined}
                                    onChange={(v) => onChange(v ?? null)}
                                    placeholder="Unlimited"
                                    fullWidth
                                    data-attr="rate-limit-value"
                                />
                            )}
                        </Field>

                        <Field name="project_rate_limit_bucket_size_minutes" label="Per">
                            {({ value, onChange }) => (
                                <Select
                                    value={value}
                                    onChange={onChange}
                                    options={BUCKET_OPTIONS.map((o) => ({ label: o.label, value: o.minutes }))}
                                    fullWidth
                                    data-attr="rate-limit-bucket-size"
                                />
                            )}
                        </Field>

                        <p className="text-muted-foreground text-xs">Leave the value empty for no limit.</p>

                        <div className="flex justify-start pt-2">
                            <Button
                                type="primary"
                                htmlType="submit"
                                disabledReason={
                                    errorTrackingEditAccessDisabledReason() ??
                                    (!configFormChanged ? 'No changes to save' : undefined)
                                }
                                loading={isConfigFormSubmitting}
                            >
                                Save
                            </Button>
                        </div>
                    </div>

                    <div className="md:col-span-7 space-y-2">
                        <p className="text-muted-foreground text-xs">
                            {chartMode === 'simulation'
                                ? 'This shows your past traffic to help you choose a rate limit.'
                                : 'This shows how many exceptions were recorded vs dropped based on your rate limits.'}
                        </p>
                        <div className="relative">
                            <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between gap-2 pointer-events-none">
                                <SegmentedButton
                                    className="pointer-events-auto bg-surface-primary rounded"
                                    size="xsmall"
                                    value={chartMode}
                                    onChange={setChartMode}
                                    options={[
                                        { value: 'simulation', label: 'Simulation' },
                                        { value: 'history', label: 'History' },
                                    ]}
                                />
                                <div className="pointer-events-auto flex items-center gap-2 bg-surface-primary rounded pl-2">
                                    <span className="text-muted-foreground text-xs">
                                        Past {formatTotalDuration(volumeBucketMinutes)}
                                    </span>
                                    <Button
                                        size="xsmall"
                                        type="secondary"
                                        icon={<IconRefresh />}
                                        onClick={refreshChart}
                                        loading={chartLoading}
                                        tooltip="Refresh with the latest data"
                                    />
                                </div>
                            </div>
                            {chartMode === 'simulation' ? (
                                volumeLoading && volume.length === 0 ? (
                                    <Skeleton className="w-full h-80" />
                                ) : (
                                    <RateLimitSimulationChart
                                        volume={volume}
                                        rateLimit={configForm.project_rate_limit_value}
                                        bucketMinutes={volumeBucketMinutes}
                                    />
                                )
                            ) : historyLoading && history.length === 0 ? (
                                <Skeleton className="w-full h-80" />
                            ) : (
                                <RateLimitHistoryChart history={history} bucketMinutes={volumeBucketMinutes} />
                            )}
                        </div>
                    </div>
                </div>
            </Form>
        </div>
    )
}
