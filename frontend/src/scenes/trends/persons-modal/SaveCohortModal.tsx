import { useState } from 'react'

import { Button, Input, Modal } from '@hanzo/elements'

interface Props {
    onSave: (title: string) => void
    onCancel: () => void
    isOpen: boolean
}

export function SaveCohortModal({ onSave, onCancel, isOpen }: Props): JSX.Element {
    const [cohortTitle, setCohortTitle] = useState('')
    return (
        <Modal
            title="New cohort"
            footer={
                <>
                    <Button type="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        disabledReason={!cohortTitle && 'Please add a title to your cohort'}
                        onClick={() => {
                            onSave(cohortTitle)
                            setCohortTitle('')
                        }}
                    >
                        Save
                    </Button>
                </>
            }
            onClose={onCancel}
            isOpen={isOpen}
        >
            <div className="mb-4">
                <Input
                    autoFocus
                    placeholder="Cohort name..."
                    value={cohortTitle}
                    data-attr="cohort-name"
                    onChange={setCohortTitle}
                />
            </div>
        </Modal>
    )
}
