import { Meta, StoryFn } from '@storybook/react'
import { useState } from 'react'

import { Button } from 'lib/elements/Button'

import { Modal, ModalProps } from './Modal'

const meta: Meta<typeof Modal> = {
    title: 'Elements/Modal',
    component: Modal,
    tags: ['autodocs'],
}
export default meta

export const _Modal: StoryFn<typeof Modal> = (props: ModalProps) => {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <>
            <Button type="primary" onClick={() => setIsOpen(true)}>
                Show control panel
            </Button>
            <Modal
                {...props}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="My Amazing Modal"
                description="Helpful description content here"
                footer={
                    <>
                        <div className="flex-1">
                            <Button type="secondary">Tertiary action</Button>
                        </div>
                        <Button type="secondary">Secondary</Button>
                        <Button type="primary">Primary</Button>
                    </>
                }
            >
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                    culpa qui officia deserunt mollit anim id est laborum.
                </p>

                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                    culpa qui officia deserunt mollit anim id est laborum.
                </p>

                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                    culpa qui officia deserunt mollit anim id est laborum.
                </p>
            </Modal>
        </>
    )
}

export const WithoutContent: StoryFn<typeof Modal> = (props: ModalProps) => {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <>
            <Button type="primary" onClick={() => setIsOpen(true)}>
                Show control panel
            </Button>
            <Modal
                {...props}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="I don't have content"
                description="But thats okay"
                footer={
                    <>
                        <div className="flex-1">
                            <Button type="secondary">Tertiary action</Button>
                        </div>
                        <Button type="secondary">Secondary</Button>
                        <Button type="primary">Primary</Button>
                    </>
                }
            />
        </>
    )
}

export const Inline: StoryFn<typeof Modal> = () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <div className="bg-default p-4">
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Inline Modals"
                description="You can display modal inline (i.e. just the content, no actual modal. This is mostly useful for creating Storybooks of modals"
                inline
                footer={
                    <>
                        <Button type="secondary">Amazing</Button>
                    </>
                }
            >
                If you use this pattern in a Story for a modal, it is recommended to wrap it in a div with a dark
                background (like this example)
            </Modal>
        </div>
    )
}

export const WithCustomContent: StoryFn<typeof Modal> = () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <div className="bg-default p-4">
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Inline Modals"
                description="You can display modal inline (i.e. just the content, no actual modal. This is mostly useful for creating Storybooks of modals"
                inline
                simple
            >
                <div className="rounded">
                    <Modal.Header>
                        <h3>I am a custom header</h3>
                    </Modal.Header>
                    <Modal.Content>
                        In some situations it may be necessary to have greater control over the modal contents. The most
                        common use case is <b>Forms with submit buttons in the footer</b>. Using the <code>simple</code>{' '}
                        property on the modal you can implement the Header, Footer and Content components yourself. See
                        this story's code for the example
                    </Modal.Content>
                    <Modal.Footer>
                        <p>I am a custom footer</p>
                    </Modal.Footer>
                </div>
            </Modal>
        </div>
    )
}
