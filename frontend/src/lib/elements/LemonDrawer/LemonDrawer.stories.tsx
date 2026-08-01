import { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Button } from 'lib/elements/Button'

import { Drawer, DrawerProps } from './Drawer'

// Storybook stories for Drawer
const meta: Meta<DrawerProps> = {
    title: 'Lemon UI/Lemon Drawer',
    component: Drawer,
    tags: ['autodocs'],
}
export default meta

type Story = StoryObj<DrawerProps>

export const _LemonDrawer: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false)
        return (
            <>
                <Button type="primary" onClick={() => setIsOpen(true)}>
                    Open drawer
                </Button>
                <Drawer
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Drawer title"
                    description="Helpful description content here"
                    footer={
                        <>
                            <Button type="secondary">Cancel</Button>
                            <Button type="primary">Save</Button>
                        </>
                    }
                >
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                        laboris nisi ut aliquip ex ea commodo consequat.
                    </p>
                    <p>
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
                        mollit anim id est laborum.
                    </p>
                </Drawer>
            </>
        )
    },
}

export const TransparentOverlay: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false)
        return (
            <>
                <Button type="primary" onClick={() => setIsOpen(true)}>
                    Open drawer (transparent overlay)
                </Button>
                <Drawer
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Transparent overlay"
                    description="The content behind the drawer remains fully visible"
                    overlayTransparent
                >
                    <p>This drawer has no backdrop blur or darkening.</p>
                </Drawer>
            </>
        )
    },
}

export const CustomWidth: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false)
        return (
            <>
                <Button type="primary" onClick={() => setIsOpen(true)}>
                    Open wide drawer
                </Button>
                <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Wide drawer" width="60vw">
                    <p>This drawer uses a custom width of 60vw.</p>
                </Drawer>
            </>
        )
    },
}

export const Resizable: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false)
        return (
            <>
                <Button type="primary" onClick={() => setIsOpen(true)}>
                    Open resizable drawer
                </Button>
                <Drawer
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Resizable drawer"
                    description="Drag the left edge to resize"
                    resizable
                    width="40rem"
                    footer={
                        <>
                            <Button type="secondary" onClick={() => setIsOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="primary">Save</Button>
                        </>
                    }
                >
                    <p>
                        This drawer can be resized by dragging the left edge. You can also use the arrow keys when the
                        resize handle is focused.
                    </p>
                </Drawer>
            </>
        )
    },
}

export const WithCustomContent: Story = {
    render: () => {
        const [isOpen, setIsOpen] = useState(false)
        return (
            <>
                <Button type="primary" onClick={() => setIsOpen(true)}>
                    Open custom drawer
                </Button>
                <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} simple aria-label="Custom drawer">
                    <Drawer.Header>
                        <h3>Custom header</h3>
                    </Drawer.Header>
                    <Drawer.Content>
                        Using the <code>simple</code> prop, you can compose the drawer layout yourself with{' '}
                        <code>Drawer.Header</code>, <code>Drawer.Content</code>, and{' '}
                        <code>Drawer.Footer</code>.
                    </Drawer.Content>
                    <Drawer.Footer>
                        <Button type="secondary" onClick={() => setIsOpen(false)}>
                            Close
                        </Button>
                    </Drawer.Footer>
                </Drawer>
            </>
        )
    },
}
