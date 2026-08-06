import { IconChevronDown, IconX } from '@hanzo/icons'
import { SideAction } from '@hanzo/elements'

export function clearFilterButtonProps(
    onClear: (() => void) | null,
    tooltip: string
): { sideAction: SideAction; sideIcon?: undefined } | { sideIcon: JSX.Element; sideAction?: undefined } {
    return onClear
        ? {
              sideAction: {
                  icon: <IconX />,
                  tooltip,
                  onClick: (e) => {
                      e.stopPropagation()
                      onClear()
                  },
              },
          }
        : { sideIcon: <IconChevronDown /> }
}
