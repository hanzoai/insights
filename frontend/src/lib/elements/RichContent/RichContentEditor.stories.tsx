import type { Meta, StoryObj } from '@storybook/react'

import { RichContentEditor, RichContentEditorProps } from './RichContentEditor'

type Story = StoryObj<RichContentEditorProps>
const meta: Meta<RichContentEditorProps> = {
    title: 'Elements/Rich Content Editor',
    component: RichContentEditor,
    tags: ['autodocs'],
}

export default meta

export const EmptyRichContentEditor: Story = {
    args: { initialContent: undefined },
}
