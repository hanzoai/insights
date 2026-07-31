import { useActions, useValues } from 'kea'
import { Form, Group } from 'kea-forms'
import { useCallback } from 'react'

import { IconChevronLeft, IconInfo } from '@hanzo/icons'
import {
    Banner,
    Checkbox,
    Collapse,
    Input,
    SegmentedButton,
    Select,
    SpinnerOverlay,
    Tooltip,
} from '@hanzo/elements'

import { AlertStateIndicator } from 'lib/components/Alerts/views/ManageAlertsModal'
import { MemberSelectMultiple } from 'lib/components/MemberSelectMultiple'
import { TZLabel } from 'lib/components/TZLabel'
import { UserActivityIndicator } from 'lib/components/UserActivityIndicator/UserActivityIndicator'
import { FEATURE_FLAGS } from 'lib/constants'
import { dayjs } from 'lib/dayjs'
import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Modal } from 'lib/elements/Modal'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { alphabet, formatDate } from 'lib/utils'
import { trendsDataLogic } from 'scenes/trends/trendsDataLogic'

import {
    AlertCalculationInterval,
    AlertConditionType,
    AlertState,
    InsightThresholdType,
} from '~/queries/schema/schema-general'
import { InsightLogicProps, InsightShortId, QueryBasedInsightModel } from '~/types'

import { SnoozeButton } from '../SnoozeButton'
import { alertFormLogic, canCheckOngoingInterval } from '../alertFormLogic'
import { alertLogic } from '../alertLogic'
import { alertNotificationLogic } from '../alertNotificationLogic'
import { AlertType } from '../types'
import { AlertDestinationSelector } from './AlertDestinationSelector'
import { InlineAlertNotifications } from './InlineAlertNotifications'

function alertCalculationIntervalToLabel(interval: AlertCalculationInterval): string {
    switch (interval) {
        case AlertCalculationInterval.HOURLY:
            return 'hour'
        case AlertCalculationInterval.DAILY:
            return 'day'
        case AlertCalculationInterval.WEEKLY:
            return 'week'
        case AlertCalculationInterval.MONTHLY:
            return 'month'
    }
}

export function AlertStateTable({ alert }: { alert: AlertType }): JSX.Element | null {
    if (!alert.checks || alert.checks.length === 0) {
        return null
    }

    return (
        <div className="bg-primary p-4 mt-10 rounded-lg">
            <div className="flex flex-row gap-2 items-center mb-2">
                <h3 className="m-0">Current status: </h3>
                <AlertStateIndicator alert={alert} />
                <h3 className="m-0">
                    {alert.snoozed_until && ` until ${formatDate(dayjs(alert?.snoozed_until), 'MMM D, HH:mm')}`}
                </h3>
            </div>
            <table className="w-full table-auto border-spacing-2 border-collapse">
                <thead>
                    <tr className="text-left">
                        <th>Status</th>
                        <th className="text-right">Time</th>
                        <th className="text-right pr-4">Value</th>
                        <th>Targets notified</th>
                    </tr>
                </thead>
                <tbody>
                    {alert.checks.map((check) => (
                        <tr key={check.id}>
                            <td>{check.state}</td>
                            <td className="text-right">
                                <TZLabel time={check.created_at} />
                            </td>
                            <td className="text-right pr-4">{check.calculated_value}</td>
                            <td>{check.targets_notified ? 'Yes' : 'No'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

interface EditAlertModalProps {
    isOpen: boolean | undefined
    alertId?: AlertType['id']
    insightId: QueryBasedInsightModel['id']
    insightShortId: InsightShortId
    onEditSuccess: (alertId?: AlertType['id'] | undefined) => void
    onClose?: () => void
    insightLogicProps?: InsightLogicProps
}

export function EditAlertModal({
    isOpen,
    alertId,
    insightId,
    insightShortId,
    onClose,
    onEditSuccess,
    insightLogicProps,
}: EditAlertModalProps): JSX.Element {
    const _alertLogic = alertLogic({ alertId })
    const { alert, alertLoading } = useValues(_alertLogic)
    const { loadAlert } = useActions(_alertLogic)

    // need to reload edited alert as well
    const _onEditSuccess = useCallback(
        (alertId: AlertType['id'] | undefined) => {
            if (alertId) {
                loadAlert()
            }
            onEditSuccess(alertId)
        },
        [loadAlert, onEditSuccess]
    )

    const formLogicProps = {
        alert,
        insightId,
        onEditSuccess: _onEditSuccess,
        insightVizDataLogicProps: insightLogicProps,
    }
    const formLogic = alertFormLogic(formLogicProps)
    const { alertForm, isAlertFormSubmitting, alertFormChanged } = useValues(formLogic)
    const { deleteAlert, snoozeAlert, clearSnooze } = useActions(formLogic)
    const { setAlertFormValue } = useActions(formLogic)

    const { featureFlags } = useValues(featureFlagLogic)
    const inlineNotificationsEnabled = !!featureFlags[FEATURE_FLAGS.ALERTS_INLINE_NOTIFICATIONS]

    const { pendingNotifications } = useValues(alertNotificationLogic({ alertId: alertId }))
    const hasPendingNotifications = inlineNotificationsEnabled && pendingNotifications.length > 0

    const trendsLogic = trendsDataLogic({ dashboardItemId: insightShortId })
    const {
        alertSeries,
        isNonTimeSeriesDisplay,
        isBreakdownValid,
        formulaNodes,
        interval: trendInterval,
    } = useValues(trendsLogic)

    const creatingNewAlert = alertForm.id === undefined
    // can only check ongoing interval for absolute value/increase alerts with upper threshold
    const can_check_ongoing_interval = canCheckOngoingInterval(alertForm)

    return (
        <Modal onClose={onClose} isOpen={isOpen} width={750} simple title="">
            {alertLoading ? (
                <SpinnerOverlay />
            ) : (
                <Form
                    logic={alertFormLogic}
                    props={formLogicProps}
                    formKey="alertForm"
                    enableFormOnSubmit
                    className="Modal__layout"
                >
                    <Modal.Header>
                        <div className="flex items-center gap-2">
                            <Button icon={<IconChevronLeft />} onClick={onClose} size="xsmall" />

                            <h3>{creatingNewAlert ? 'New' : 'Edit '} Alert</h3>
                        </div>
                    </Modal.Header>

                    <Modal.Content>
                        <div className="deprecated-space-y-8">
                            <div className="deprecated-space-y-4">
                                <div className="flex gap-4 items-center">
                                    <Field className="flex-auto" name="name">
                                        <Input placeholder="Alert name" data-attr="alertForm-name" />
                                    </Field>
                                    <Field name="enabled">
                                        <Checkbox
                                            checked={alertForm?.enabled}
                                            data-attr="alertForm-enabled"
                                            fullWidth
                                            label="Enabled"
                                        />
                                    </Field>
                                </div>
                                {alert?.created_by ? (
                                    <UserActivityIndicator
                                        at={alert.created_at}
                                        by={alert.created_by}
                                        prefix="Created"
                                    />
                                ) : null}
                            </div>

                            <div className="deprecated-space-y-6">
                                <h3>Definition</h3>
                                <div className="deprecated-space-y-5">
                                    {isBreakdownValid && (
                                        <Banner type="warning">
                                            For trends with breakdown, the alert will fire if any of the breakdown
                                            values breaches the threshold.
                                        </Banner>
                                    )}
                                    <div className="flex gap-4 items-center">
                                        <div>When</div>
                                        <Group name={['config']}>
                                            <Field name="series_index" className="flex-auto">
                                                <Select
                                                    fullWidth
                                                    data-attr="alertForm-series-index"
                                                    options={
                                                        formulaNodes?.length > 0
                                                            ? formulaNodes.map(({ formula, custom_name }, index) => ({
                                                                  label: `${
                                                                      custom_name ? custom_name : 'Formula'
                                                                  } (${formula})`,
                                                                  value: index,
                                                              }))
                                                            : (alertSeries?.map(
                                                                  ({ custom_name, name, event }, index) => ({
                                                                      label: isBreakdownValid
                                                                          ? 'any breakdown value'
                                                                          : `${alphabet[index]} - ${
                                                                                custom_name ?? name ?? event
                                                                            }`,
                                                                      value: isBreakdownValid ? 0 : index,
                                                                  })
                                                              ) ?? [])
                                                    }
                                                    disabledReason={
                                                        isBreakdownValid &&
                                                        `For trends with breakdown, the alert will fire if any of the breakdown
                                            values breaches the threshold.`
                                                    }
                                                />
                                            </Field>
                                        </Group>
                                        <Group name={['condition']}>
                                            <Field name="type">
                                                <Select
                                                    fullWidth
                                                    className="w-40"
                                                    data-attr="alertForm-condition"
                                                    options={[
                                                        {
                                                            label: 'has value',
                                                            value: AlertConditionType.ABSOLUTE_VALUE,
                                                        },
                                                        {
                                                            label: 'increases by',
                                                            value: AlertConditionType.RELATIVE_INCREASE,
                                                            disabledReason:
                                                                isNonTimeSeriesDisplay &&
                                                                'This condition is only supported for time series trends',
                                                        },
                                                        {
                                                            label: 'decreases by',
                                                            value: AlertConditionType.RELATIVE_DECREASE,
                                                            disabledReason:
                                                                isNonTimeSeriesDisplay &&
                                                                'This condition is only supported for time series trends',
                                                        },
                                                    ]}
                                                />
                                            </Field>
                                        </Group>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div>less than</div>
                                        <Field name="lower">
                                            <Input
                                                type="number"
                                                className="w-30"
                                                data-attr="alertForm-lower-threshold"
                                                value={
                                                    alertForm.threshold.configuration.type ===
                                                        InsightThresholdType.PERCENTAGE &&
                                                    alertForm.threshold.configuration.bounds?.lower
                                                        ? alertForm.threshold.configuration.bounds?.lower * 100
                                                        : alertForm.threshold.configuration.bounds?.lower
                                                }
                                                onChange={(value) =>
                                                    setAlertFormValue('threshold', {
                                                        configuration: {
                                                            type: alertForm.threshold.configuration.type,
                                                            bounds: {
                                                                ...alertForm.threshold.configuration.bounds,
                                                                lower:
                                                                    value &&
                                                                    alertForm.threshold.configuration.type ===
                                                                        InsightThresholdType.PERCENTAGE
                                                                        ? value / 100
                                                                        : value,
                                                            },
                                                        },
                                                    })
                                                }
                                            />
                                        </Field>
                                        <div>or more than</div>
                                        <Field name="upper">
                                            <Input
                                                type="number"
                                                className="w-30"
                                                data-attr="alertForm-upper-threshold"
                                                value={
                                                    alertForm.threshold.configuration.type ===
                                                        InsightThresholdType.PERCENTAGE &&
                                                    alertForm.threshold.configuration.bounds?.upper
                                                        ? alertForm.threshold.configuration.bounds?.upper * 100
                                                        : alertForm.threshold.configuration.bounds?.upper
                                                }
                                                onChange={(value) =>
                                                    setAlertFormValue('threshold', {
                                                        configuration: {
                                                            type: alertForm.threshold.configuration.type,
                                                            bounds: {
                                                                ...alertForm.threshold.configuration.bounds,
                                                                upper:
                                                                    value &&
                                                                    alertForm.threshold.configuration.type ===
                                                                        InsightThresholdType.PERCENTAGE
                                                                        ? value / 100
                                                                        : value,
                                                            },
                                                        },
                                                    })
                                                }
                                            />
                                        </Field>
                                        {alertForm.condition.type !== AlertConditionType.ABSOLUTE_VALUE && (
                                            <Group name={['threshold', 'configuration']}>
                                                <Field name="type">
                                                    <SegmentedButton
                                                        options={[
                                                            {
                                                                value: InsightThresholdType.PERCENTAGE,
                                                                label: '%',
                                                                tooltip: 'Percent',
                                                            },
                                                            {
                                                                value: InsightThresholdType.ABSOLUTE,
                                                                label: '#',
                                                                tooltip: 'Absolute number',
                                                            },
                                                        ]}
                                                    />
                                                </Field>
                                            </Group>
                                        )}
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div>Run alert every</div>
                                        <Field name="calculation_interval">
                                            <Select
                                                fullWidth
                                                className="w-28"
                                                data-attr="alertForm-calculation-interval"
                                                options={Object.values(AlertCalculationInterval).map((interval) => ({
                                                    label: alertCalculationIntervalToLabel(interval),
                                                    value: interval,
                                                }))}
                                            />
                                        </Field>
                                        <div>
                                            and check {alertForm?.config.check_ongoing_interval ? 'current' : 'last'}
                                        </div>
                                        <Select
                                            fullWidth
                                            className="w-28"
                                            data-attr="alertForm-trend-interval"
                                            disabledReason={
                                                <>
                                                    To change the interval being checked, edit and <b>save</b> the
                                                    interval which the insight is 'grouped by'
                                                </>
                                            }
                                            value={trendInterval ?? 'day'}
                                            options={[
                                                {
                                                    label: trendInterval ?? 'day',
                                                    value: trendInterval ?? 'day',
                                                },
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3>Notification</h3>
                                <div className="flex gap-4 items-center mt-2">
                                    <div>E-mail</div>
                                    <div className="flex-auto">
                                        <MemberSelectMultiple
                                            value={alertForm.subscribed_users?.map((u) => u.id) ?? []}
                                            idKey="id"
                                            onChange={(value) => setAlertFormValue('subscribed_users', value)}
                                        />
                                    </div>
                                </div>

                                <h4 className="mt-4">CDP Destinations</h4>
                                <div className="mt-4">
                                    {inlineNotificationsEnabled ? (
                                        <InlineAlertNotifications alertId={alertId} />
                                    ) : alertId ? (
                                        <div className="flex flex-col">
                                            <AlertDestinationSelector
                                                alertId={alertId}
                                                insightShortId={insightShortId}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-muted-alt">
                                            Save alert first to add destinations (e.g. Slack, Webhooks)
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="deprecated-space-y-2">
                                <Collapse
                                    panels={[
                                        {
                                            key: 'advanced',
                                            header: 'Advanced options',
                                            content: (
                                                <div className="space-y-2">
                                                    <Group name={['config']}>
                                                        <div className="flex gap-1">
                                                            <Field name="check_ongoing_interval">
                                                                <Checkbox
                                                                    checked={
                                                                        can_check_ongoing_interval &&
                                                                        alertForm?.config.check_ongoing_interval
                                                                    }
                                                                    data-attr="alertForm-check-ongoing-interval"
                                                                    fullWidth
                                                                    label="Check ongoing period"
                                                                    disabledReason={
                                                                        !can_check_ongoing_interval &&
                                                                        'Can only alert for ongoing period when checking for absolute value/increase above a set upper threshold.'
                                                                    }
                                                                />
                                                            </Field>
                                                            <Tooltip
                                                                title="Checks the insight value for the ongoing period (current week/month) that hasn't yet completed. Use this if you want to be alerted right away when the insight value rises/increases above threshold"
                                                                placement="right"
                                                                delayMs={0}
                                                            >
                                                                <IconInfo />
                                                            </Tooltip>
                                                        </div>
                                                    </Group>
                                                    <Field name="skip_weekend">
                                                        <Checkbox
                                                            checked={
                                                                (alertForm?.calculation_interval ===
                                                                    AlertCalculationInterval.DAILY ||
                                                                    alertForm?.calculation_interval ===
                                                                        AlertCalculationInterval.HOURLY) &&
                                                                alertForm?.skip_weekend
                                                            }
                                                            data-attr="alertForm-skip-weekend"
                                                            fullWidth
                                                            label="Skip checking on weekends"
                                                            disabledReason={
                                                                alertForm?.calculation_interval !==
                                                                    AlertCalculationInterval.DAILY &&
                                                                alertForm?.calculation_interval !==
                                                                    AlertCalculationInterval.HOURLY &&
                                                                'Can only skip weekend checking for hourly/daily alerts'
                                                            }
                                                        />
                                                    </Field>
                                                </div>
                                            ),
                                        },
                                    ]}
                                />
                            </div>
                        </div>

                        {alert && <AlertStateTable alert={alert} />}
                    </Modal.Content>

                    <Modal.Footer>
                        <div className="flex-1">
                            <div className="flex gap-2">
                                {!creatingNewAlert ? (
                                    <Button type="secondary" status="danger" onClick={deleteAlert}>
                                        Delete alert
                                    </Button>
                                ) : null}
                                {!creatingNewAlert && alert?.state === AlertState.FIRING ? (
                                    <SnoozeButton onChange={snoozeAlert} value={alert?.snoozed_until} />
                                ) : null}
                                {!creatingNewAlert && alert?.state === AlertState.SNOOZED ? (
                                    <Button
                                        type="secondary"
                                        status="default"
                                        onClick={clearSnooze}
                                        tooltip={`Currently snoozed until ${formatDate(
                                            dayjs(alert?.snoozed_until),
                                            'MMM D, HH:mm'
                                        )}`}
                                    >
                                        Clear snooze
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isAlertFormSubmitting}
                            disabledReason={!alertFormChanged && !hasPendingNotifications && 'No changes to save'}
                        >
                            {creatingNewAlert ? 'Create alert' : 'Save'}
                        </Button>
                    </Modal.Footer>
                </Form>
            )}
        </Modal>
    )
}
