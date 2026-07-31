import { DataColorToken } from 'lib/colors'

import { ColorButton } from './ColorButton'

type ColorListColorProps = {
    colors: string[]
    selectedColor?: string | null
    onSelectColor?: (color: string) => void
    colorTokens?: never
    selectedColorToken?: never
    onSelectColorToken?: never
    themeId?: never
}

type ColorListTokenProps = {
    colorTokens: DataColorToken[]
    selectedColorToken?: DataColorToken | null
    onSelectColorToken?: (colorToken: DataColorToken) => void
    themeId?: number | null
    colors?: never
    selectedColor?: never
    onSelectColor?: never
}

type ColorListProps = ColorListColorProps | ColorListTokenProps

export function ColorList({
    colors,
    colorTokens,
    selectedColor,
    selectedColorToken,
    onSelectColor,
    onSelectColorToken,
    themeId,
}: ColorListProps): JSX.Element | null {
    if (colorTokens?.length) {
        return (
            <div className="flex flex-wrap gap-1">
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
