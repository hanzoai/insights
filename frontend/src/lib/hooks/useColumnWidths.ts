import { useCallback, useEffect, useRef, useState } from 'react'

import { DEFAULT_COLUMN_WIDTH } from '../elements/Table/columnUtils'
import { determineColumnKey } from '../elements/Table/columnUtils'
import { TableColumn } from '../elements/Table/types'

interface UseColumnWidthsProps {
    columnKeys?: string[]
    columns: TableColumn<any, any>[]
}

/**
 * Hook to measure the width of columns in a table.
 * @param columnKeys - The keys of the columns to measure.
 * @param columns - The columns to measure.
 * @returns The width of the columns and the table reference.
 */
export function useColumnWidths({ columnKeys, columns }: UseColumnWidthsProps): {
    columnWidths: number[]
    tableRef: React.RefObject<HTMLTableElement>
} {
    const [columnWidths, setColumnWidths] = useState<number[]>([])
    const tableRef = useRef<HTMLTableElement>(null)

    const measureColumnWidths = useCallback(() => {
        if (!columnKeys || columnKeys.length === 0 || !tableRef.current) {
            return
        }

        const widths: number[] = []
        const headerRow = tableRef.current.querySelector('thead tr')
        if (headerRow) {
            for (const columnKey of columnKeys) {
                // Find the column in the flattened columns array
                const columnIndexInTable = columns.findIndex(
                    (col) => determineColumnKey(col, 'width measurement') === columnKey
                )
                let width = DEFAULT_COLUMN_WIDTH
                if (columnIndexInTable !== -1) {
                    const headerCell = headerRow.children[columnIndexInTable] as HTMLElement
                    if (headerCell) {
                        width = Math.ceil(headerCell.offsetWidth)
                    }
                }
                widths.push(width)
            }
            setColumnWidths(widths)
        }
    }, [columnKeys, columns])

    // Measure column widths after table renders, using rAF to ensure DOM is ready
    useEffect(() => {
        if (columnKeys && columnKeys.length > 0) {
            const id = requestAnimationFrame(() => {
                measureColumnWidths()
            })
            return () => cancelAnimationFrame(id)
        }
    }, [measureColumnWidths, columnKeys])

    return {
        columnWidths,
        tableRef,
    }
}
