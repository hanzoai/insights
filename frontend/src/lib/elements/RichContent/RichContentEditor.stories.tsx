import type { Meta, StoryObj } from '@storybook/react'

import { RichContentEditor, RichContentEditorProps } from './RichContentEditor'

type Story = StoryObj<RichContentEditorProps>
const meta: Meta<RichContentEditorProps> = {
    title: 'Lemon UI/Lemon Rich Content Editor',
    component: RichContentEditor,
    tags: ['autodocs'],
}

export default meta

export const EmptyLemonRichContentEditor: Story = {
    args: { initialContent: undefined },
}
