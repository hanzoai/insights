import { Meta, StoryObj } from '@storybook/react'

import { IconFlag, IconInfo } from '@hanzo/icons'

import { Tag as TagComponent, TagProps, TagType } from './Tag'

const meta: Meta<TagProps> = {
    title: 'Lemon UI/Lemon Tag',
    component: TagComponent as any,
    tags: ['autodocs'],
}

export default meta
type Story = StoryObj<TagProps>

const SIZES: ('small' | 'medium')[] = ['small', 'medium']

const ALL_COLORS: TagType[] = [
    'primary',
    'option',
    'highlight',
    'warning',
    'danger',
    'success',
    'default',
    'muted',
    'completion',
    'caution',
    'none',
]

export const Tag: Story = {
    render: () => (
        <div className="space-y-2">
            {SIZES.map((size) => {
                return (
                    <div key={size}>
                        <h4 className="capitalize">{size}</h4>
                        <div className="flex gap-1 flex-wrap">
                            {ALL_COLORS.map((type) => (
                                <TagComponent key={type} type={type} size={size}>
                                    {type}
                                </TagComponent>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    ),
}

export const CloseOnClick: Story = {
    render: () => (
        <div className="space-y-4">
            <div>
                <h4>Close on Click Mode</h4>
                <p className="text-muted mb-2">
                    Hover to see the icon swap to close (X), click anywhere on the tag to close it
                </p>
                <div className="flex gap-2 flex-wrap">
                    <TagComponent
                        icon={<IconFlag />}
                        closeOnClick
                        onClose={() => alert('Tag closed!')}
                        type="primary"
                    >
                        Primary tag with icon
                    </TagComponent>
                    <TagComponent
                        icon={<IconInfo />}
                        closeOnClick
                        onClose={() => alert('Info tag closed!')}
                        type="highlight"
                    >
                        Info tag
                    </TagComponent>
                    <TagComponent
                        icon={<IconFlag />}
                        closeOnClick
                        onClose={() => alert('Warning tag closed!')}
                        type="warning"
                        size="small"
                    >
                        Small warning
                    </TagComponent>
                </div>
            </div>
            <div>
                <h4>Regular Closable Tags (for comparison)</h4>
                <div className="flex gap-2 flex-wrap">
                    <TagComponent
                        icon={<IconFlag />}
                        closable
                        onClose={() => alert('Regular tag closed!')}
                        type="primary"
                    >
                        Regular closable
                    </TagComponent>
                    <TagComponent closable onClose={() => alert('No icon tag closed!')} type="highlight">
                        No icon closable
                    </TagComponent>
                </div>
            </div>
        </div>
    ),
}
