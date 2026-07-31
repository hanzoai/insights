import { useValues } from 'kea'
import { cloneElement, useEffect, useState } from 'react'

import { ColorGlyph, Input, Label, Popover } from '@hanzo/elements'

import { DataColorToken } from 'lib/colors'
import { dataThemeLogic } from 'scenes/dataThemeLogic'

import { ColorButton } from './ColorButton'
import { ColorList } from './ColorList'

type ColorPickerBaseProps = {
    showCustomColor?: boolean
    hideDropdown?: boolean
    preventPopoverClose?: boolean
    customButton?: JSX.Element
    customColorValue?: string
}

type ColorPickerColorProps = ColorPickerBaseProps & {
    colors: string[]
    selectedColor?: string | null
    onSelectColor: (color: string) => void
    colorTokens?: never
    selectedColorToken?: never
    onSelectColorToken?: never
    themeId?: never
}

type ColorPickerTokenProps = ColorPickerBaseProps & {
    colorTokens?: DataColorToken[]
    selectedColorToken?: DataColorToken | null
    onSelectColorToken: (colorToken: DataColorToken) => void
    themeId?: number | null
    colors?: never
    selectedColor?: never
    onSelectColor?: never
}

type ColorPickerProps = ColorPickerColorProps | ColorPickerTokenProps

type ColorPickerOverlayProps = Omit<ColorPickerProps, 'hideDropdown'>

export const ColorPickerOverlay = ({
    themeId,
    colors,
    colorTokens,
    selectedColor,
    selectedColorToken,
    onSelectColor,
    onSelectColorToken,
    showCustomColor = false,
    preventPopoverClose = false,
    customColorValue,
}: ColorPickerOverlayProps): JSX.Element => {
    const [color, setColor] = useState<string | null>(customColorValue || selectedColor || null)
    const [lastValidColor, setLastValidColor] = useState<string | null>(selectedColor || null)
    const { getAvailableColorTokens } = useValues(dataThemeLogic)

    useEffect(() => {
        const newColor = customColorValue || selectedColor
        if (newColor) {
            setColor(newColor)
            setLastValidColor(newColor)
        }
    }, [customColorValue, selectedColor])

    return (
        <div
            className="w-52 flex flex-col p-2"
            // prevents native event bubbling, so that popovers don't close
            onMouseUp={(e) => {
                if (preventPopoverClose) {
                    e.nativeEvent.stopImmediatePropagation()
                }
            }}
            onTouchEnd={(e) => {
                if (preventPopoverClose) {
                    e.nativeEvent.stopImmediatePropagation()
                }
            }}
        >
            <Label className="mt-1 mb-0.5">Preset colors</Label>
            {colors ? (
                <ColorList colors={colors} selectedColor={selectedColor} onSelectColor={onSelectColor} />
            ) : (
                <ColorList
                    themeId={themeId}
                    colorTokens={colorTokens || getAvailableColorTokens(themeId) || []}
                    selectedColorToken={selectedColorToken}
                    onSelectColorToken={onSelectColorToken}
                />
            )}
            {showCustomColor && (
                <div>
                    <Label className="mt-2 mb-0.5">Custom color</Label>
                    <div className="flex items-center gap-2">
                        <ColorGlyph color={lastValidColor} className="ml-1.5" />
                        <Input
                            className="mt-1 font-mono"
                            size="small"
                            value={color || ''}
                            onChange={(color) => {
                                setColor(color)
                                if (color != null && color != selectedColor && /^#[0-9A-Fa-f]{6}$/.test(color)) {
                                    setLastValidColor(color)
                                    onSelectColor?.(color)
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export const ColorPicker = ({
    hideDropdown = false,
    customButton,
    ...props
}: ColorPickerProps): JSX.Element => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <Popover
            visible={isOpen}
            overlay={<ColorPickerOverlay {...props} />}
            onClickOutside={() => setIsOpen(false)}
        >
            <div className="relative">
                {customButton ? (
                    cloneElement(customButton, {
                        onClick: () => setIsOpen(!isOpen),
                    })
                ) : (
                    <ColorButton
                        type="secondary"
                        {...(props.selectedColor !== undefined
                            ? { color: props.selectedColor }
                            : { colorToken: props.selectedColorToken, themeId: props.themeId })}
                        onClick={() => setIsOpen(!isOpen)}
                        sideIcon={hideDropdown ? null : undefined}
                    />
                )}
            </div>
        </Popover>
    )
}
