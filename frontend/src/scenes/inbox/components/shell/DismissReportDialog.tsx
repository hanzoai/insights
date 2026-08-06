import { IconHide, IconPause } from '@hanzo/icons'

import { Dialog } from 'lib/elements/Dialog'
import { Field } from 'lib/elements/Field'
import { Radio, RadioOption } from 'lib/elements/Radio'
import { TextArea } from 'lib/elements/TextArea'
import { Tooltip } from 'lib/elements/Tooltip'

import { DISMISSAL_REASON_OPTIONS, DismissalReasonValue, isDismissalReasonSnooze } from '../../utils/dismissalReasons'

export interface DismissReportDialogResult {
    reason: DismissalReasonValue
    note: string
}

interface OpenDismissReportDialogParams {
    /** Report title for single-report copy. Ignored when `selectedCount > 1`. */
    reportTitle?: string | null
    /** When greater than 1, copy reflects a bulk dismiss of the current selection. */
    selectedCount?: number
    /** Called with the chosen reason + note once the user confirms. */
    onConfirm: (result: DismissReportDialogResult) => void | Promise<void>
}

const PAUSE_OPTION_TOOLTIP =
    'Snoozes this report: it briefly leaves your inbox while more context is gathered, and it can come back if new findings match.'
const SUPPRESS_OPTION_TOOLTIP =
    'Dismisses permanently: the report leaves your inbox and matching findings will not surface it again. Your reason is saved with the report.'

// Vertical radio list mirroring desktop `DismissReportDialog`: each reason carries an icon +
// tooltip explaining whether it snoozes (pause) or dismisses permanently (eye-slash).
const REASON_RADIO_OPTIONS: RadioOption<DismissalReasonValue>[] = DISMISSAL_REASON_OPTIONS.map((option) => {
    const snoozes = isDismissalReasonSnooze(option.value)
    return {
        value: option.value,
        label: (
            <Tooltip title={snoozes ? PAUSE_OPTION_TOOLTIP : SUPPRESS_OPTION_TOOLTIP} placement="right">
                <span className="inline-flex flex-wrap items-center gap-1.5">
                    {option.label}
                    {snoozes ? (
                        <IconPause className="shrink-0 text-secondary" />
                    ) : (
                        <IconHide className="shrink-0 text-secondary" />
                    )}
                </span>
            </Tooltip>
        ),
    }
})

/**
 * Opens the dismiss dialog. Mirrors desktop `DismissReportDialog`: pick a reason
 * (canonical {@link DISMISSAL_REASON_OPTIONS}) plus an optional note, then suppress.
 * The caller wires `onConfirm` to the bulk-dismiss action or a direct
 * `api.signalReports.setState(id, { state: 'suppressed', dismissal_reason, dismissal_note })`.
 */
export function openDismissReportDialog({
    reportTitle,
    selectedCount = 1,
    onConfirm,
}: OpenDismissReportDialogParams): void {
    const isBulk = selectedCount > 1
    const title = isBulk
        ? `Archive ${selectedCount} reports?`
        : `Archive report "${reportTitle?.trim() ? reportTitle : 'Untitled report'}"?`
    const description = isBulk
        ? 'These reports will be archived out of your inbox. Your feedback is saved on each report, and your note goes to the agents that filed them.'
        : 'This report will be archived out of your inbox. Your feedback is saved on the report, and your note goes to the agent that filed it.'

    Dialog.openForm({
        title,
        description,
        maxWidth: '30rem',
        initialValues: { reason: null as DismissalReasonValue | null, note: '' },
        content: (
            <div className="flex flex-col gap-3">
                <Field name="reason" label="Reason">
                    {({ value, onChange }) => (
                        <Radio value={value} onChange={onChange} options={REASON_RADIO_OPTIONS} />
                    )}
                </Field>
                <Field name="note" label="Note" info="Optional. The agent reads it on its next run.">
                    <TextArea
                        placeholder="What made this report wrong, or not worth fixing?"
                        maxLength={4000}
                        rows={3}
                    />
                </Field>
            </div>
        ),
        errors: {
            reason: (reason) => (!reason ? "You haven't picked a reason" : undefined),
        },
        primaryButtonProps: { children: 'Archive & teach the agent' },
        shouldAwaitSubmit: true,
        onSubmit: async ({ reason, note }) => {
            if (!reason) {
                return
            }
            await onConfirm({ reason, note: (note ?? '').trim() })
        },
    })
}
