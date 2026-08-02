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
                Trigger confetti
            </Button>
            <Banner type="info" className="mt-4">
                The celebration draws nothing today. Its particles were upstream mascot illustrations, which this
                product does not ship.
            </Banner>
        </>
    )
}
