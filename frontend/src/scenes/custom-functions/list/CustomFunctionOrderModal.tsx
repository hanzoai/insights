import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { useEffect, useState } from 'react'

import { LemonBadge, LemonButton, LemonModal } from '@posthog/lemon-ui'

import { CustomFunctionType } from '~/types'

import { customFunctionsListLogic } from './customFunctionsListLogic'

const MinimalTransformationView = ({
    customFunction,
    order,
}: {
    customFunction: CustomFunctionType
    order: number
}): JSX.Element => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: customFunction.id,
    })

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                'relative flex items-center gap-2 p-2 border rounded cursor-move bg-bg-light',
                isDragging && 'z-[999999]'
            )}
            // eslint-disable-next-line react/forbid-dom-props
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            {...attributes}
            {...listeners}
        >
            <LemonBadge.Number count={order + 1} maxDigits={3} status="muted" />
            <span className="font-semibold">{customFunction.name}</span>
        </div>
    )
}

export function CustomFunctionOrderModal(): JSX.Element {
    const { reorderModalOpen, enabledCustomFunctions, loading } = useValues(customFunctionsListLogic)
    const { setReorderModalOpen, saveCustomFunctionOrder } = useActions(customFunctionsListLogic)

    const [initialOrders, setInitialOrders] = useState<Record<string, number>>({})
    const [newOrders, setNewOrders] = useState<Record<string, number>>({})

    // Store initial orders when modal opens
    useEffect(() => {
        if (reorderModalOpen) {
            const orders = enabledCustomFunctions.reduce(
                (acc, customFunction) => {
                    acc[customFunction.id] = customFunction.execution_order || 0
                    return acc
                },
                {} as Record<string, number>
            )
            setInitialOrders(orders)
        } else {
            setInitialOrders({})
            setNewOrders({})
        }
    }, [reorderModalOpen, enabledCustomFunctions])

    // Sort transformations based on temporaryOrder if it exists
    const sortedCustomFunctions = [...enabledCustomFunctions]
    if (Object.keys(newOrders).length > 0) {
        sortedCustomFunctions.sort((a, b) => {
            // Use custom_function.id for sorting
            const orderA = newOrders[a.id] || 0
            const orderB = newOrders[b.id] || 0
            return orderA - orderB
        })
    }

    const handleDragEnd = ({ active, over }: DragEndEvent): void => {
        if (active.id && over && active.id !== over.id) {
            const from = sortedCustomFunctions.findIndex((d) => d.id === active.id)
            const to = sortedCustomFunctions.findIndex((d) => d.id === over.id)
            const newSortedCustomFunctions = arrayMove(sortedCustomFunctions, from, to)

            const newTemporaryOrder = newSortedCustomFunctions.reduce(
                (acc, customFunction, index) => {
                    if (customFunction.id) {
                        acc[customFunction.id] = index + 1
                    }
                    return acc
                },
                {} as Record<string, number>
            )

            setNewOrders(newTemporaryOrder)
        }
    }

    const handleSaveOrder = (): void => {
        // Compare and only include changed orders
        const changedOrders = Object.entries(newOrders).reduce(
            (acc, [id, newOrder]) => {
                const originalOrder = initialOrders[id]
                if (originalOrder !== newOrder) {
                    acc[id] = newOrder
                }
                return acc
            },
            {} as Record<string, number>
        )

        // Only send if there are changes
        if (Object.keys(changedOrders).length > 0) {
            saveCustomFunctionOrder(changedOrders)
        } else {
            setReorderModalOpen(false)
        }
    }

    return (
        <LemonModal
            onClose={() => setReorderModalOpen(false)}
            isOpen={reorderModalOpen}
            width={600}
            title="Reorder transformations"
            description={
                <p>
                    The order of transformations is important as they are processed sequentially. You can{' '}
                    <b>drag and drop the transformations below</b> to change their order.
                </p>
            }
            footer={
                <>
                    <LemonButton type="secondary" onClick={() => setReorderModalOpen(false)}>
                        Cancel
                    </LemonButton>
                    <LemonButton loading={loading} type="primary" onClick={handleSaveOrder}>
                        Save order
                    </LemonButton>
                </>
            }
        >
            <div className="flex flex-col gap-2">
                <DndContext modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={handleDragEnd}>
                    <SortableContext items={sortedCustomFunctions} strategy={verticalListSortingStrategy}>
                        {sortedCustomFunctions.map((customFunction, index) => (
                            <MinimalTransformationView key={customFunction.id} customFunction={customFunction} order={index} />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </LemonModal>
    )
}
