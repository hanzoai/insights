import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { type TextAreaProps } from 'lib/elements/TextArea/TextArea'
import {
    TextAreaMarkdown,
    TextAreaMarkdown as _LemonTextMarkdown,
} from 'lib/elements/TextArea/TextAreaMarkdown'

type Story = StoryObj<TextAreaProps>
const meta: Meta<TextAreaProps> = {
    title: 'Lemon UI/Lemon Text Area Markdown',
    component: TextAreaMarkdown as any,
    args: {
        value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    },
    tags: ['autodocs'],
    render: (props) => {
        const [value, setValue] = useState(props.value)
        return <_LemonTextMarkdown {...props} value={value} onChange={(newValue) => setValue(newValue)} />
    },
}

export default meta

export const EmptyLemonTextMarkdown: Story = {
    args: { value: '' },
}

export const TextMarkdownWithText: Story = {
    args: { value: '# Title\n\n**bold** _italic_' },
}

export const TextMarkdownWithMaxLength: Story = {
    args: { value: '# Title\n\n**bold** _italic_', maxLength: 12 },
}
