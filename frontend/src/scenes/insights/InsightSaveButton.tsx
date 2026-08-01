import { Button } from 'lib/elements/Button'

export function InsightSaveButton({
    saveAs,
    saveInsight,
    isSaved,
    insightSaving,
    insightChanged,
    addingToDashboard,
    onSaveAndAddToDashboard,
}: {
    saveAs: () => void
    saveInsight: (redirectToViewMode?: boolean) => void
    isSaved: boolean | undefined
    insightSaving: boolean
    insightChanged: boolean
    addingToDashboard: boolean
    // When provided, adds a "Save & add to dashboard" dropdown option that saves then opens the add-to-dashboard modal.
    onSaveAndAddToDashboard?: () => void
}): JSX.Element {
    const disabled = isSaved && !insightChanged
    const saveAsAvailable = isSaved && !addingToDashboard

    return (
        <Button
            type="primary"
            onClick={() => saveInsight(true)}
            data-attr="insight-save-button"
            disabled={disabled}
            size="small"
            loading={!disabled && insightSaving}
            sideAction={{
                dropdown: {
                    placement: 'bottom-end',
                    overlay: (
                        <>
                            {!disabled && (
                                <Button
                                    onClick={() => saveInsight(false)}
                                    data-attr="insight-save-and-continue"
                                    fullWidth
                                    loading={insightSaving}
                                >
                                    {addingToDashboard ? 'Save, add to dashboard' : 'Save'} & continue editing
                                </Button>
                            )}
                            {!disabled && onSaveAndAddToDashboard && (
                                <Button
                                    onClick={() => onSaveAndAddToDashboard()}
                                    data-attr="insight-save-and-add-to-dashboard"
                                    fullWidth
                                    loading={insightSaving}
                                >
                                    Save & add to dashboard…
                                </Button>
                            )}
                            {saveAsAvailable && (
                                <Button onClick={() => saveAs()} data-attr="insight-save-as-new-insight" fullWidth>
                                    Save as…
                                </Button>
                            )}
                        </>
                    ),
                },
                disabled: disabled && !saveAsAvailable,
                'data-attr': 'insight-save-dropdown',
            }}
        >
            {disabled ? 'No changes' : addingToDashboard ? 'Save & add to dashboard' : 'Save'}
        </Button>
    )
}
