import { DataColorToken } from 'lib/colors'

import { ColorButton } from './ColorButton'

type ColorListColorProps = {
    colors: string[]
    selectedColor?: string | null
    onSelectColor?: (color: string) => void
    onClearColor?: () => void
    colorTokens?: never
    selectedColorToken?: never
    onSelectColorToken?: never
    onClearColorToken?: never
    themeId?: never
}

type ColorListTokenProps = {
    colorTokens: DataColorToken[]
    selectedColorToken?: DataColorToken | null
    onSelectColorToken?: (colorToken: DataColorToken) => void
    onClearColorToken?: () => void
    themeId?: number | null
    colors?: never
    selectedColor?: never
    onSelectColor?: never
    onClearColor?: never
}

export type ColorListProps = ColorListColorProps | ColorListTokenProps

export function ColorList({
    colors,
    colorTokens,
    selectedColor,
    selectedColorToken,
    onSelectColor,
    onSelectColorToken,
    onClearColor,
    onClearColorToken,
    themeId,
}: ColorListProps): JSX.Element | null {
    if (colorTokens?.length) {
        return (
            <div className="flex flex-wrap gap-1">
                {onClearColorToken && (
                    <ColorButton
                        color={null}
                        type={selectedColorToken === null ? 'secondary' : 'tertiary'}
                        tooltip="No color"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()

                            onClearColorToken()
                        }}
                    />
                )}
                {colorTokens.map((colorToken) => (
                    <ColorButton
                        key={colorToken}
                        colorToken={colorToken}
                        type={selectedColorToken === colorToken ? 'secondary' : 'tertiary'}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()

                            onSelectColorToken?.(colorToken)
                        }}
                        themeId={themeId}
                    />
                ))}
            </div>
        )
    }

    if (colors?.length) {
        return (
            <div className="flex flex-wrap gap-1">
                {onClearColor && (
                    <ColorButton
                        color={null}
                        type={selectedColor === null ? 'secondary' : 'tertiary'}
                        tooltip="No color"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()

                            onClearColor()
                        }}
                    />
                )}
                {colors.map((color) => (
                    <ColorButton
                        key={color}
                        color={color}
                        type={selectedColor === color ? 'secondary' : 'tertiary'}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()

                            onSelectColor?.(color)
                        }}
                    />
                ))}
            </div>
        )
    }

    return null
}
