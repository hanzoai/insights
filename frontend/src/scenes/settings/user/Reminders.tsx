import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconPencil, IconPlus, IconTrash } from '@hanzo/icons'
import { Button, Input, Modal, Select, Table, Tag } from '@hanzo/elements'

import { DatePicker } from 'lib/components/DatePicker/DatePicker'
import { TZLabel } from 'lib/components/TZLabel'
import { dayjs } from 'lib/dayjs'
import { Dialog } from 'lib/elements/Dialog'
import { Field } from 'lib/elements/Field'
import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { SegmentedButton } from 'lib/elements/SegmentedButton'
import { TextArea } from 'lib/elements/TextArea'
import { capitalizeFirstLetter } from 'lib/utils/strings'

import { ReminderApi, ReminderStatusEnumApi } from 'products/reminders/frontend/generated/api.schemas'

import { remindersLogic } from './remindersLogic'

const RECURRENCE_OPTIONS = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
]

const STATUS_TAG_TYPE: Record<ReminderStatusEnumApi, 'primary' | 'muted' | 'danger'> = {
    active: 'primary',
    completed: 'muted',
    errored: 'danger',
}

function scheduleSummary(reminder: ReminderApi): string {
    if (reminder.cron_expression) {
        return `Cron: ${reminder.cron_expression}`
    }
    if (reminder.recurrence_interval) {
        return capitalizeFirstLetter(reminder.recurrence_interval)
    }
    return 'One-off'
}

function ReminderModal(): JSX.Element {
    const {
        editingReminderId,
        reminderForm,
        isReminderFormSubmitting,
        isScheduleEditable,
        projectOptions,
        timezoneOptions,
    } = useValues(remindersLogic)
    const { setEditingReminderId, submitReminderForm } = useActions(remindersLogic)

    const isOpen = editingReminderId !== null
    const isCreating = editingReminderId === 'new'

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => setEditingReminderId(null)}
            title={isCreating ? 'New reminder' : 'Edit reminder'}
            footer={
                <>
                    <Button type="secondary" onClick={() => setEditingReminderId(null)}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={submitReminderForm}
                        loading={isReminderFormSubmitting}
                        data-attr="save-reminder"
                    >
                        {isCreating ? 'Create reminder' : 'Save'}
                    </Button>
                </>
            }
        >
            <Form logic={remindersLogic} formKey="reminderForm" className="deprecated-space-y-4">
                <Field name="title" label="Title">
                    <Input placeholder="Review the activation dashboard" maxLength={255} autoFocus />
                </Field>
                <Field name="message" label="Message" info="Optional longer text shown in the notification.">
                    <TextArea placeholder="Optional details" minRows={2} />
                </Field>
                <Field name="team" label="Project">
                    {({ value, onChange }) => (
                        <Select value={value} onChange={onChange} options={projectOptions} fullWidth />
                    )}
                </Field>

                <Field name="scheduleType" label="Schedule">
                    {({ value, onChange }) => (
                        <SegmentedButton
                            value={value}
                            onChange={onChange}
                            disabledReason={!isScheduleEditable ? 'This reminder has already fired' : undefined}
                            options={[
                                { value: 'one-off', label: 'One-off' },
                                { value: 'repeats', label: 'Repeats' },
                                { value: 'advanced', label: 'Advanced' },
                            ]}
                            fullWidth
                        />
                    )}
                </Field>

                {reminderForm.scheduleType === 'one-off' && (
                    <Field name="scheduled_at" label="Fires at">
                        {({ value, onChange }) => (
                            <DatePicker
                                value={value ? dayjs(value) : null}
                                onChange={(date) => onChange(date ? date.toISOString() : null)}
                                granularity="minute"
                                placeholder="Select date and time"
                                maxDate={dayjs().add(10, 'year')}
                                disabledReason={!isScheduleEditable ? 'This reminder has already fired' : undefined}
                            />
                        )}
                    </Field>
                )}

                {reminderForm.scheduleType === 'repeats' && (
                    <Field name="recurrence_interval" label="Repeats every">
                        {({ value, onChange }) => (
                            <Select
                                value={value}
                                onChange={onChange}
                                options={RECURRENCE_OPTIONS}
                                placeholder="Select an interval"
                                disabled={!isScheduleEditable}
                                fullWidth
                            />
                        )}
                    </Field>
                )}

                {reminderForm.scheduleType === 'advanced' && (
                    <Field
                        name="cron_expression"
                        label="Cron expression"
                        info="5-field cron, max 4 fires per day."
                    >
                        <Input placeholder="0 9 * * 1" disabled={!isScheduleEditable} />
                    </Field>
                )}

                {reminderForm.scheduleType !== 'one-off' && (
                    <Field name="end_date" label="Ends" info="Optional. The reminder stops after this time.">
                        {({ value, onChange }) => (
                            <DatePicker
                                value={value ? dayjs(value) : null}
                                onChange={(date) => onChange(date ? date.toISOString() : null)}
                                granularity="minute"
                                placeholder="No end date"
                                clearable
                                maxDate={dayjs().add(10, 'year')}
                                disabledReason={!isScheduleEditable ? 'This reminder has already fired' : undefined}
                            />
                        )}
                    </Field>
                )}

                <Field name="timezone" label="Time zone">
                    {({ value, onChange }) => (
                        <InputSelect
                            mode="single"
                            value={[value]}
                            onChange={(newTimezones) => newTimezones[0] && onChange(newTimezones[0])}
                            options={timezoneOptions}
                            placeholder="Select a time zone"
                            disabled={!isScheduleEditable}
                            virtualized
                        />
                    )}
                </Field>
            </Form>
        </Modal>
    )
}

export function Reminders(): JSX.Element {
    const { reminders, remindersLoading } = useValues(remindersLogic)
    const { setEditingReminderId, deleteReminder } = useActions(remindersLogic)

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Button
                    type="primary"
                    icon={<IconPlus />}
                    onClick={() => setEditingReminderId('new')}
                    data-attr="new-reminder"
                >
                    New reminder
                </Button>
            </div>

            <Table
                loading={remindersLoading}
                dataSource={reminders}
                rowKey="id"
                emptyState="No reminders yet. Create one to get a nudge when it's due."
                columns={[
                    {
                        title: 'Title',
                        dataIndex: 'title',
                        render: (_, reminder) => <span className="font-semibold">{reminder.title}</span>,
                    },
                    {
                        title: 'Schedule',
                        render: (_, reminder) => scheduleSummary(reminder),
                    },
                    {
                        title: 'Next fire',
                        render: (_, reminder) =>
                            reminder.next_fire_at ? <TZLabel time={reminder.next_fire_at} /> : '—',
                    },
                    {
                        title: 'Status',
                        render: (_, reminder) => (
                            <Tag type={STATUS_TAG_TYPE[reminder.status]}>
                                {capitalizeFirstLetter(reminder.status)}
                            </Tag>
                        ),
                    },
                    {
                        title: '',
                        width: 0,
                        render: (_, reminder) => (
                            <div className="flex gap-1 justify-end">
                                <Button
                                    size="small"
                                    icon={<IconPencil />}
                                    tooltip="Edit"
                                    onClick={() => setEditingReminderId(reminder.id)}
                                />
                                <Button
                                    size="small"
                                    status="danger"
                                    icon={<IconTrash />}
                                    tooltip="Delete"
                                    onClick={() =>
                                        Dialog.open({
                                            title: 'Delete reminder?',
                                            description: `"${reminder.title}" will be permanently deleted.`,
                                            primaryButton: {
                                                children: 'Delete',
                                                status: 'danger',
                                                onClick: () => deleteReminder(reminder.id),
                                            },
                                            secondaryButton: { children: 'Cancel' },
                                        })
                                    }
                                />
                            </div>
                        ),
                    },
                ]}
            />

            <ReminderModal />
        </div>
    )
}
