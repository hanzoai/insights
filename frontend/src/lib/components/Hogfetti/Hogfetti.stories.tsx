import { Meta } from '@storybook/react'

import { Banner, Button } from '@hanzo/elements'

import { useHogfetti } from './Hogfetti'

const meta: Meta = {
    title: 'Components/Hogfetti',
}
export default meta

export function Hogfetti(): JSX.Element {
    const { trigger, HogfettiComponent } = useHogfetti()

    const handleClick = (): void => {
        trigger()
    }

    return (
        <>
            <HogfettiComponent />
            <Button type="secondary" onClick={handleClick}>
                Trigger Hogfetti
            </Button>
            <Banner type="warning" className="mt-4">
                The rendering in Storybook is not the same as in the app so it may appear laggy here but it should be
                working as expected in the app.
            </Banner>
        </>
    )
}
