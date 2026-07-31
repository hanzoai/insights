import { useActions } from 'kea'
import { useMemo, useState } from 'react'

import { IconPencil } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input'
import { Modal } from 'lib/elements/Modal'

import { experimentsTabLogic } from './experimentsTabLogic'

interface SelectorEditorProps {
    selector: string | null
    variant: string
    transformIndex: number
}

export function SelectorEditor({ selector, variant, transformIndex }: SelectorEditorProps): JSX.Element {
    const { inspectElementSelected } = useActions(experimentsTabLogic)

    const [editSelectorOpen, setEditSelectorOpen] = useState(false)
    const [editSelectorValue, setEditSelectorValue] = useState('')

    const isValidSelector = useMemo(() => {
        if (!editSelectorValue) {
            return false
        }
        try {
            return !!document.querySelector(editSelectorValue)
        } catch {
            return false
        }
    }, [editSelectorValue])

    return (
        <>
            <Button
                size="xsmall"
                icon={<IconPencil />}
                tooltip="Edit selector"
                onClick={(e) => {
                    e.stopPropagation()
                    setEditSelectorValue(selector ?? '')
                    setEditSelectorOpen(true)
                }}
            />
            <Modal
                isOpen={editSelectorOpen}
                onClose={() => setEditSelectorOpen(false)}
                title="Edit selector"
                footer={
                    <>
                        <Button onClick={() => setEditSelectorOpen(false)}>Cancel</Button>
                        <Button
                            type="primary"
                            onClick={() => {
                                setEditSelectorOpen(false)
                                inspectElementSelected(
                                    document.querySelector(editSelectorValue) as HTMLElement,
                                    variant,
                                    transformIndex,
                                    editSelectorValue
                                )
                            }}
                            disabledReason={
                                !isValidSelector
                                    ? 'Please enter a valid selector. Element not found on page.'
                                    : undefined
                            }
                        >
                            Save
                        </Button>
                    </>
                }
            >
                <Input value={editSelectorValue} onChange={(value) => setEditSelectorValue(value)} />
            </Modal>
        </>
    )
}
