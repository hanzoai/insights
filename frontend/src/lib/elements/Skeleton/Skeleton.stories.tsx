import { Meta } from '@storybook/react'

import { Label } from 'lib/elements/Label/Label'
import { Modal } from 'lib/elements/Modal'

import { Skeleton, SkeletonProps } from './Skeleton'

const meta: Meta<SkeletonProps> = {
    title: 'Lemon UI/Lemon Skeleton',
    component: Skeleton,
    parameters: {
        docs: {
            description: {
                component: `
[Related Figma area](https://www.figma.com/file/Y9G24U4r04nEjIDGIEGuKI/Insights-Design-System-One?node-id=2028%3A841)

Skeleton screens are used to indicate that a screen is loading, are perceived as being shorter in duration when compared against a blank screen (our control) and a spinner — but not by much`,
            },
        },
        testOptions: {
            waitForLoadersToDisappear: false,
        },
    },
    tags: ['autodocs'],
}
export default meta

export function Default(): JSX.Element {
    return <Skeleton />
}

export function Presets(): JSX.Element {
    return (
        <div className="deprecated-space-y-2">
            <p>Skeletons have a bunch of presets to help with simulating other UI Components</p>

            <div className="flex items-center gap-2">
                <Skeleton.Circle />
                <Skeleton />
                <Skeleton.Button />
            </div>

            <p>Here is an example of "skeletoning" a Modal</p>

            <Modal
                isOpen
                onClose={() => {}}
                inline
                title="Loading..."
                footer={
                    <>
                        <Skeleton.Button />
                        <Skeleton.Button />
                    </>
                }
            >
                <div className="deprecated-space-y-2">
                    <Skeleton className="w-1/2 h-4" />
                    <Skeleton.Row repeat={3} />
                </div>
            </Modal>
        </div>
    )
}

export function Customisation(): JSX.Element {
    return (
        <div className="deprecated-space-y-2 mb-2">
            <p>Skeletons are most easily styled with utility classNames</p>

            <Label>Default</Label>
            <Skeleton />
            <Label>Custom classNames</Label>
            <Skeleton className="h-10 rounded-lg w-1/3" />
        </div>
    )
}

export function Repeat(): JSX.Element {
    return (
        <div className="deprecated-space-y-2 p-2 rounded">
            <p>
                Skeletons can be easily repeated multiple times using the <b>repeat</b> property
            </p>

            <Skeleton repeat={5} />

            <p>
                Add the <b>fade</b> property to progressively fade out the repeated skeletons
            </p>

            <Skeleton repeat={5} fade />
        </div>
    )
}
