import { Button } from 'lib/elements/Button'

export const RunningTimeCalculatorModalFooter = ({
    onClose,
    onSave,
    disabled = false,
}: {
    onClose: () => void
    onSave: () => void
    disabled?: boolean
}): JSX.Element => {
    return (
        <div className="flex items-center w-full">
            <div className="flex items-center gap-2 ml-auto">
                <Button form="edit-experiment-metric-form" type="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    form="edit-experiment-metric-form"
                    onClick={onSave}
                    type="primary"
                    disabledReason={disabled ? 'Calculation required before saving' : undefined}
                >
                    Save
                </Button>
            </div>
        </div>
    )
}
