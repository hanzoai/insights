import { Meta, StoryFn, StoryObj } from '@storybook/react'

import { RichContentEditor, RichContentEditorProps } from './RichContentEditor'

type Story = StoryObj<typeof RichContentEditor>
const meta: Meta<typeof RichContentEditor> = {
    title: 'Elements/Rich Content Editor',
    component: RichContentEditor,
    tags: ['autodocs'],
}

export default meta

const Template: StoryFn<typeof RichContentEditor> = (props: RichContentEditorProps) => {
    return <RichContentEditor {...props} />
}

export const EmptyRichContentEditor: Story = Template.bind({})
EmptyRichContentEditor.args = { initialContent: undefined }
