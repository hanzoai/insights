import { useValues } from 'kea'

import { themeLogic } from '~/layout/navigation-3000/themeLogic'

export interface ChartColors {
    TICK_TEXT_COLOR: string
    BOUNDARY_LINES: string
    ZERO_LINE: string
    BAR_NEGATIVE: string
    BAR_POSITIVE: string
    BAR_DEFAULT: string
    BAR_CONTROL: string
    BAR_MIDDLE_POINT: string
    BAR_MIDDLE_POINT_CONTROL: string
    EXPOSURES_AXIS_LINES: string
}

export function useChartColors(): ChartColors {
    const { isDarkModeOn } = useValues(themeLogic)

    return {
        TICK_TEXT_COLOR: 'var(--color-text-tertiary)',
        BOUNDARY_LINES: 'var(--color-border-primary)',
        ZERO_LINE: isDarkModeOn ? 'rgba(255, 255, 255, 0.6)' : 'var(--border-bold)',
        BAR_NEGATIVE: 'var(--danger)',
        BAR_POSITIVE: 'var(--success)',
        BAR_DEFAULT: isDarkModeOn ? 'rgb(121 121 121)' : 'rgb(217 217 217)',
        BAR_CONTROL: isDarkModeOn ? 'rgba(217, 217, 217, 0.2)' : 'rgba(217, 217, 217, 0.4)',
        BAR_MIDDLE_POINT: 'black',
        BAR_MIDDLE_POINT_CONTROL: 'rgba(0, 0, 0, 0.4)',
        EXPOSURES_AXIS_LINES: isDarkModeOn ? 'rgba(217, 217, 217, 0.2)' : 'rgba(217, 217, 217, 0.4)',
    }
}

// Default colors for imports that don't need the hook
export const COLORS: ChartColors = {
    TICK_TEXT_COLOR: 'var(--color-text-tertiary)',
    BOUNDARY_LINES: 'var(--color-border-primary)',
    ZERO_LINE: 'var(--border-bold)',
    BAR_NEGATIVE: 'var(--danger)',
    BAR_POSITIVE: 'var(--success)',
    BAR_DEFAULT: 'rgb(217 217 217)',
    BAR_CONTROL: 'rgba(217, 217, 217, 0.4)',
    BAR_MIDDLE_POINT: 'black',
    BAR_MIDDLE_POINT_CONTROL: 'rgba(0, 0, 0, 0.4)',
    EXPOSURES_AXIS_LINES: 'rgba(217, 217, 217, 0.4)',
}
