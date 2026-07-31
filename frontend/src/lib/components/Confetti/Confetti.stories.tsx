import { Meta } from '@storybook/react'

import { Banner, Button } from '@hanzo/elements'

import { useConfetti } from './Confetti'

const meta: Meta = {
    title: 'Components/Confetti',
}
export default meta

export function Confetti(): JSX.Element {
    const { trigger, ConfettiComponent } = useConfetti()

    const handleClick = (): void => {
        trigger()
    }

    return (
        <>
            <ConfettiComponent />
            <Button type="secondary" onClick={handleClick}>
                Trigger Confetti
            </Button>
            <Banner type="warning" className="mt-4">
                The rendering in Storybook is not the same as in the app so it may appear laggy here but it should be
                working as expected in the app.
            </Banner>
        </>
    )
}
