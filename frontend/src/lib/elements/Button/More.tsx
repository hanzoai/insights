import { ButtonWithDropdown } from '.'
import { forwardRef } from 'react'

import { IconEllipsis } from '@hanzo/icons'

import { PopoverProps } from '../Popover/Popover'
import { ButtonDropdown, ButtonProps } from './Button'

export type MoreProps = Partial<Pick<PopoverProps, 'overlay' | 'placement'>> &
    ButtonProps & { dropdown?: Partial<ButtonDropdown> }

export const More = forwardRef<HTMLButtonElement, MoreProps>(
    ({ overlay, dropdown, 'data-attr': dataAttr, placement = 'bottom-end', ...buttonProps }, ref) => {
        return (
            <ButtonWithDropdown
                aria-label="more"
                data-attr={dataAttr ?? 'more-button'}
                icon={<IconEllipsis />}
                dropdown={
                    {
                        placement: placement,
                        actionable: true,
                        ...dropdown,
                        overlay,
                    } as ButtonDropdown
                }
                size="small"
                {...buttonProps}
                disabled={!overlay}
                ref={ref}
            />
        )
    }
)
More.displayName = 'More'
