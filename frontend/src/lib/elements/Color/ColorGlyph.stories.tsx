import { Meta, StoryObj } from '@storybook/react'

import { ColorGlyph } from './ColorGlyph'

type Story = StoryObj<typeof ColorGlyph>
const meta: Meta<typeof ColorGlyph> = {
    title: 'Elements/Color/Color Glyph',
    component: ColorGlyph,
    tags: ['autodocs'],
}
export default meta

export const Default: Story = {
    render: () => <ColorGlyph colorToken="preset-1" />,
}

export const Small: Story = {
    render: () => <ColorGlyph size="small" colorToken="preset-1" />,
}

export const CustomColor: Story = {
    render: () => <ColorGlyph color="#ff0000" />,
}

export const UnsetColor: Story = {
    render: () => <ColorGlyph color={null} />,
}

export const CustomTheme: Story = {
    render: () => <ColorGlyph colorToken="preset-1" themeId={2} />,
}
