import { Meta, StoryFn, StoryObj } from '@storybook/react'

import { Splotch, SplotchColor } from '../Splotch'
import {
    MenuItems,
    MenuOverlay as MenuOverlayComponent,
    MenuOverlayProps,
    MenuSection,
} from './Menu'

type Story = StoryObj<typeof MenuOverlayComponent>
const meta: Meta<typeof MenuOverlayComponent> = {
    title: 'Elements/Menu',
    component: MenuOverlayComponent,
    parameters: {
        docs: {
            description: {
                component: `
Implement all sorts of menus easily with \`Menu\`.
                
Note: These stories render \`MenuOverlay\` instead of \`Menu\` so that the contents are is shown outright.
This enables intuitive preview of the component, along with snapshotting, but in code always use \`Menu\`.`,
            },
        },
    },
    args: {
        items: [
            { label: 'Alert', onClick: () => alert('Hello there.') },
            { label: 'Do nothing' },
            { label: 'Do nothing, with a highlight', active: true },
        ] as MenuItems,
    },
    tags: ['autodocs'],
}
export default meta

const Template: StoryFn<typeof MenuOverlayComponent> = (props: MenuOverlayProps) => {
    return (
        <div className="rounded border p-1 bg-surface-primary">
            <MenuOverlayComponent {...props} />
        </div>
    )
}

export const Flat: Story = Template.bind({})
Flat.args = {}

export const SectionedItems: Story = Template.bind({})
SectionedItems.args = {
    items: [
        {
            title: 'Reptiles',
            items: [
                { label: 'Cobra', onClick: () => alert('Sssss') },
                { label: 'Boa', onClick: () => alert('Rrrrr') },
            ],
        },
        {
            title: 'Mammals',
            items: [
                { label: 'Dog', onClick: () => alert('Woof') },
                { label: 'Cat', onClick: () => alert('Meow') },
            ],
        },
        {
            title: 'Birds',
            items: [
                { label: 'Eagle', onClick: () => alert('Screech') },
                { label: 'Owl', onClick: () => alert('Hoot') },
            ],
        },
    ] as MenuSection[],
}

export const NestedMenu: Story = Template.bind({})
NestedMenu.args = {
    items: [
        {
            items: [
                { label: 'Refresh' },
                {
                    label: 'Set color',
                    items: [
                        { icon: <Splotch color={SplotchColor.Purple} />, label: 'Purple' },
                        { icon: <Splotch color={SplotchColor.Blue} />, label: 'Blue' },
                        { icon: <Splotch color={SplotchColor.Green} />, label: 'Green', active: true },
                    ],
                },
                {
                    label: 'Open matryoshka',
                    items: [
                        {
                            label: 'Open matryoshka',
                            items: [
                                {
                                    label: 'Baby matryoshka!',
                                },
                            ],
                        },
                    ],
                },
            ],
            footer: (
                <div className="flex items-center h-10 px-2 rounded bg-primary text-secondary">
                    I am a custom footer!
                </div>
            ),
        },
        {
            items: [
                {
                    label: 'Detonate charges',
                    onClick: () => alert('Twrmzlzktdzuntqniuqpmodxmokjwolbbf'),
                    status: 'danger',
                },
            ],
        },
    ] as MenuSection[],
}
