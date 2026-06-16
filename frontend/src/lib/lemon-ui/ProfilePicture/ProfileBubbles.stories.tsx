import { Meta } from '@storybook/react'

import { alphabet, range } from 'lib/utils'

import { ProfileBubbles as ProfileBubblesComponent, ProfileBubblesProps } from './ProfileBubbles'

const DUMMIES: ProfileBubblesProps['people'] = [
    { email: 'michael@hanzo.ai', name: 'Michael' },
    { email: 'lottie@hanzo.ai', name: 'Lottie' },
    { email: 'paul@hanzo.ai', name: 'Paul' },
    { email: 'joe@hanzo.ai', name: 'Joe' },
]

const meta: Meta<typeof ProfileBubblesComponent> = {
    title: 'Lemon UI/Profile Bubbles',
    component: ProfileBubblesComponent,
    parameters: {
        testOptions: {
            waitForLoadersToDisappear: true,
        },
    },
    args: {
        people: DUMMIES,
    },
    tags: ['autodocs'],
}
export default meta

export function OneBubble(props: any): JSX.Element {
    return <ProfileBubblesComponent {...props} people={DUMMIES.slice(0, 1)} />
}

export function MultipleBubblesWithTooltip(props: any): JSX.Element {
    return (
        <div className="flex flex-start">
            <ProfileBubblesComponent {...props} tooltip="Cool people." />
        </div>
    )
}

export function MultipleBubblesWithNoImages(props: any): JSX.Element {
    return (
        <ProfileBubblesComponent
            {...props}
            people={range(20).map((x) => ({
                name: alphabet[x],
                email: 'not-real-at-all@hanzo.ai',
            }))}
        />
    )
}

export function MultipleBubblesAtLimit(props: any): JSX.Element {
    return <ProfileBubblesComponent {...props} limit={4} />
}

export function MultipleBubblesOverflowingByOne(props: any): JSX.Element {
    return <ProfileBubblesComponent {...props} limit={3} />
}

export function MultipleBubblesOverflowingByTwo(props: any): JSX.Element {
    return <ProfileBubblesComponent {...props} limit={2} />
}
