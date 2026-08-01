import { Dialog } from '@hanzo/elements'

import { dayjs } from 'lib/dayjs'
import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Switch } from 'lib/elements/Switch'
import { formatDate } from 'lib/utils/datetime'

import { AlertState } from '~/queries/schema/schema-general'

import { SnoozeButton } from 'products/alerts/frontend/components/SnoozeButton'
import { AlertFormType } from 'products/alerts/frontend/logic/alertFormLogic'
import type { AlertType } from 'products/alerts/frontend/types'

interface AlertLeadingActionsProps {
    alertForm: AlertFormType
    alert: AlertType | null
    onDeleteAlert: () => void
    onSnoozeAlert: (snoozeUntil: string) => void
    onClearSnooze: () => void
    onSendTestDelivery: () => void
    testDeliveryLoading: boolean
    testDeliveryDisabledReason?: string
    showTestDelivery: boolean
}

export function AlertLeadingActions({
    alertForm,
    alert,
    onDeleteAlert,
    onSnoozeAlert,
    onClearSnooze,
    onSendTestDelivery,
    testDeliveryLoading,
    testDeliveryDisabledReason,
    showTestDelivery,
}: AlertLeadingActionsProps): JSX.Element {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Button
                type="secondary"
                status="danger"
                onClick={() => {
                    Dialog.open({
                        title: `Delete "${alertForm.name || 'this alert'}"?`,
                        description: 'This alert will be permanently deleted. This action cannot be undone.',
                        primaryButton: {
                            children: 'Delete',
                            type: 'primary',
                            status: 'danger',
                            onClick: onDeleteAlert,
                            'data-attr': 'alert-delete-confirm',
                        },
                        secondaryButton: { children: 'Cancel' },
                    })
                }}
            >
                Delete alert
            </Button>
            <SnoozeButton
                onChange={onSnoozeAlert}
                value={alert?.snoozed_until}
                disabledReason={alert?.state === AlertState.FIRING ? undefined : 'Only firing alerts can be snoozed'}
            />
            {showTestDelivery ? (
                <Button
                    type="secondary"
                    onClick={onSendTestDelivery}
                    loading={testDeliveryLoading}
                    disabledReason={testDeliveryDisabledReason}
                >
                    Test delivery
                </Button>
            ) : null}
            {alert?.state === AlertState.SNOOZED ? (
                <Button
                    type="secondary"
                    status="default"
                    onClick={onClearSnooze}
                    tooltip={`Currently snoozed until ${formatDate(dayjs(alert.snoozed_until), 'MMM D, HH:mm')}`}
                >
                    Clear snooze
                </Button>
            ) : null}
        </div>
    )
}

export function AlertEnabledAction({ alertForm }: Pick<AlertLeadingActionsProps, 'alertForm'>): JSX.Element {
    return (
        <Field name="enabled" className="m-0">
            <Switch checked={alertForm.enabled} data-attr="alertForm-enabled" label="Enabled" />
        </Field>
    )
}
