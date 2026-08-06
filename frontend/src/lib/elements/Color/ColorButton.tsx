import './ColorButton.scss'

import { useValues } from 'kea'

import { DataColorToken } from 'lib/colors'
import { dataThemeLogic } from 'lib/logic/dataThemeLogic'
import { cn } from 'lib/utils/css-classes'

import { Button, ButtonWithoutSideActionProps } from '../Button'
import { ColorGlyph } from './ColorGlyph'
import { colorDescription } from './utils'

type ColorButtonBaseProps = ButtonWithoutSideActionProps & {
    hideColorDescription?: boolean
}

type ColorButtonColorProps = ColorButtonBaseProps & {
    color?: string | null
    colorToken?: never
    themeId?: never
}

type ColorButtonTokenProps = ColorButtonBaseProps & {
    colorToken?: DataColorToken | null
    themeId?: number | null
    color?: never
}

export type ColorButtonProps = ColorButtonColorProps | ColorButtonTokenProps

export function ColorButton({
    type = 'secondary',
    className,
    color,
    colorToken,
    themeId,
    tooltip,
    hideColorDescription = false,
    size,
    ...rest
}: ColorButtonProps): JSX.Element {
    const { getColorFromToken } = useValues(dataThemeLogic)

    // we need to derive the color here as well for the tooltip
    const effectiveColor = colorToken ? getColorFromToken(themeId, colorToken) : color
    const derivedTooltip = hideColorDescription || !effectiveColor ? undefined : colorDescription(effectiveColor)
    const effectiveTooltip = tooltip ?? derivedTooltip

    return (
        <Button
            type={type}
            size={size}
            className={cn('ColorButton', className)}
            tooltip={effectiveTooltip}
            {...rest}
        >
            {colorToken ? (
                <ColorGlyph colorToken={colorToken} size={size} themeId={themeId} />
            ) : (
                <ColorGlyph color={color} size={size} />
            )}
        </Button>
    )
}
