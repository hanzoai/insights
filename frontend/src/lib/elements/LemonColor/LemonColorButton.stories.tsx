import { Meta, StoryObj } from '@storybook/react'

import { ColorButton, ColorButtonProps } from './ColorButton'

type Story = StoryObj<ColorButtonProps>
const meta: Meta<ColorButtonProps> = {
    title: 'Lemon UI/Lemon Color/Lemon Color Button',
    component: ColorButton,
    tags: ['autodocs'],
}
export default meta

export const Default: Story = {
    render: () => <ColorButton colorToken="preset-1" />,
}

export const Tertiary: Story = {
    render: () => <ColorButton type="tertiary" colorToken="preset-1" />,
}

export const Small: Story = {
    render: () => <ColorButton size="small" colorToken="preset-1" />,
}

export const CustomColor: Story = {
    render: () => <ColorButton color="#ff0000" />,
}

export const UnsetColor: Story = {
    render: () => <ColorButton color={null} />,
}

export const CustomTheme: Story = {
    render: () => <ColorButton colorToken="preset-1" themeId={2} />,
}

export const HiddenColorDescription: Story = {
    render: () => <ColorButton colorToken="preset-1" hideColorDescription />,
}
