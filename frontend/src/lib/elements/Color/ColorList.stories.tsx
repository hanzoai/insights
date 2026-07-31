import { Meta, StoryObj } from '@storybook/react'

import { DataColorToken } from 'lib/colors'

import { ColorList } from './ColorList'

type Story = StoryObj<typeof ColorList>
const meta: Meta<typeof ColorList> = {
    title: 'Elements/Color/Color List',
    component: ColorList,
    tags: ['autodocs'],
}
export default meta

const colorTokens: DataColorToken[] = Array.from({ length: 15 }, (_, i) => `preset-${i + 1}` as DataColorToken)

export const Default: Story = {
    render: () => {
        return (
            <ColorList
                colorTokens={colorTokens}
                selectedColorToken={colorTokens[3]}
                onSelectColorToken={(colorToken) => {
                    alert(colorToken)
                }}
            />
        )
    },
}

export const CustomColors: Story = {
    render: () => (
        <ColorList
            colors={['#ff0000', '#00ff00', '#0000ff']}
            selectedColor="#00ff00"
            onSelectColor={(color) => {
                alert(color)
            }}
        />
    ),
}

export const CustomTheme: Story = {
    render: () => (
        <ColorList
            colorTokens={colorTokens}
            selectedColorToken={colorTokens[3]}
            themeId={2}
            onSelectColorToken={(colorToken) => {
                alert(colorToken)
            }}
        />
    ),
}
