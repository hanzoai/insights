import { useWindowSize } from 'lib/hooks/useWindowSize'

import { SegmentedButton, SegmentedButtonProps } from '../SegmentedButton'
import { Select, SelectProps } from '../Select'

export type SegmentedSelectProps<T extends string | number> = SegmentedButtonProps<T> &
    SelectProps<T> & {
        shrinkOn?: number
    }

export function SegmentedSelect<T extends string | number>({
    shrinkOn,
    ...props
}: SegmentedSelectProps<T>): JSX.Element {
    const {
        windowSize: { width = 0 },
    } = useWindowSize()

    if ((shrinkOn != null && props.options.length >= shrinkOn) || width < props.options.length * 100) {
        return <Select {...props} />
    }

    return <SegmentedButton {...props} />
}
