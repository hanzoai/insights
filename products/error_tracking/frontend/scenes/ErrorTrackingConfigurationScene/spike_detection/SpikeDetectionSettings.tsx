import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Banner } from '@hanzo/elements'

import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input'
import { Skeleton } from 'lib/elements/Skeleton'
import { settingsLogic } from 'scenes/settings/settingsLogic'

import { ERROR_TRACKING_LOGIC_KEY, errorTrackingEditAccessDisabledReason } from '../../../utils'
import { RecentSpikes } from './RecentSpikes'
import { spikeDetectionConfigLogic } from './spikeDetectionConfigLogic'

export function SpikeDetectionSettings(): JSX.Element {
    const { configLoading, configFormChanged, isConfigFormSubmitting, hasSpikeAlerts } =
        useValues(spikeDetectionConfigLogic)
    const { selectSetting } = useActions(
        settingsLogic({
            logicKey: ERROR_TRACKING_LOGIC_KEY,
            sectionId: 'environment-error-tracking',
            settingId: 'error-tracking-alerting',
        })
    )

    if (configLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-10" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <Form logic={spikeDetectionConfigLogic} formKey="configForm" enableFormOnSubmit className="space-y-4">
                <Banner type="info" action={{ children: 'Send feedback', id: 'spike-detection-feedback-button' }}>
                    <p>
                        Spike detection is in early stage. We may make changes to the defaults or replace these settings
                        as we iterate. We'd love your feedback!
                    </p>
                </Banner>

                {!hasSpikeAlerts && (
                    <Banner
                        type="info"
                        action={{
                            children: 'Configure alerts',
                            onClick: () => selectSetting('error-tracking-alerting'),
                        }}
                    >
                        <p>
                            You don't have any alerts configured for spike events. Set up notifications to get alerted
                            when issues spike.
                        </p>
                    </Banner>
                )}

                <p className="text-muted-foreground">
                    Configure spike detection settings for error tracking alerts. When an issue receives significantly
                    more exceptions than its baseline, a spike alert will be triggered.
                </p>

                <div className="grid grid-cols-3 gap-4">
                    <Field
                        name="snooze_duration_minutes"
                        label="Snooze duration (minutes)"
                        info="Time to wait before alerting again for the same issue after a spike is detected."
                    >
                        <Input
                            type="number"
                            min={1}
                            placeholder="10"
                            fullWidth
                            data-attr="spike-detection-snooze-duration"
                        />
                    </Field>

                    <Field
                        name="multiplier"
                        label="Multiplier"
                        info="The factor by which the current exception count must exceed the baseline to be considered a spike."
                    >
                        <Input
                            type="number"
                            min={1}
                            placeholder="10"
                            fullWidth
                            data-attr="spike-detection-multiplier"
                        />
                    </Field>

                    <Field
                        name="threshold"
                        label="Minimum threshold"
                        info="The minimum number of exceptions required in a 5-minute window before a spike can be detected."
                    >
                        <Input
                            type="number"
                            min={1}
                            placeholder="500"
                            fullWidth
                            data-attr="spike-detection-threshold"
                        />
                    </Field>
                </div>

                <div className="flex justify-end">
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
            </Form>

            <div>
                <h3 className="font-semibold mb-2">Recent spike events</h3>
                <RecentSpikes />
            </div>
        </div>
    )
}
