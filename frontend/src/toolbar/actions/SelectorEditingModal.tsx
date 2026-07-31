import { useState } from 'react'

import { HTMLElementsDisplay } from 'lib/components/HTMLElementsDisplay/HTMLElementsDisplay'
import { Button } from 'lib/elements/Button'
import { Modal } from 'lib/elements/Modal'

import { ElementType } from '~/types'

export const SelectorEditingModal = ({
    isOpen,
    setIsOpen,
    activeElementChain,
    onChange,
    startingSelector,
}: {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    activeElementChain: ElementType[]
    onChange?: (selector: string | null) => void
    startingSelector?: string | null
}): JSX.Element => {
    const [chosenSelector, setChosenSelector] = useState<string | null>(null)

    return (
        <Modal
            forceAbovePopovers={true}
            description="Click on elements and their attributes to build a selector"
            footer={
                <>
                    <Button type="secondary" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={(e) => {
                            e.stopPropagation()
                            onChange?.(chosenSelector)
                            setIsOpen(false)
                        }}
                    >
                        Apply
                    </Button>
                </>
            }
            onClose={() => setIsOpen(false)}
            isOpen={isOpen}
            title="Edit the selector"
        >
            <HTMLElementsDisplay
                editable={true}
                highlight={false}
                elements={activeElementChain}
                checkUniqueness={true}
                onChange={setChosenSelector}
                startingSelector={startingSelector ?? undefined}
            />
        </Modal>
    )
}
