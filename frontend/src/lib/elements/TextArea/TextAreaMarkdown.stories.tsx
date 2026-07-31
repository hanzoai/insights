import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { useState } from 'react'

import {
    TextAreaMarkdown,
    TextAreaMarkdown as _TextMarkdown,
} from 'lib/elements/TextArea/TextAreaMarkdown'

type Story = StoryObj<typeof TextAreaMarkdown>
const meta: Meta<typeof TextAreaMarkdown> = {
    title: 'Elements/Text Area Markdown',
    component: TextAreaMarkdown,
    args: {
        value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    },
    tags: ['autodocs'],
}

export default meta

const Template: StoryFn<typeof TextAreaMarkdown> = (props) => {
    const [value, setValue] = useState(props.value)
    return <_TextMarkdown {...props} value={value} onChange={(newValue) => setValue(newValue)} />
}

export const EmptyTextMarkdown: Story = Template.bind({})
EmptyTextMarkdown.args = { value: '' }

export const TextMarkdownWithText: Story = Template.bind({})
TextMarkdownWithText.args = { value: '# Title\n\n**bold** _italic_' }

export const TextMarkdownWithMaxLength: Story = Template.bind({})
TextMarkdownWithMaxLength.args = { value: '# Title\n\n**bold** _italic_', maxLength: 12 }
