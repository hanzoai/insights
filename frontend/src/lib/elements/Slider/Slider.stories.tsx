import { Meta } from '@storybook/react'
import { useState } from 'react'

import { Slider, SliderProps } from './Slider'

const meta: Meta<SliderProps> = {
    title: 'Lemon UI/Lemon Slider',
    component: Slider,
    tags: ['autodocs'],
}
export default meta

export function Basic(): JSX.Element {
    const [value, setValue] = useState(42)

    return (
        <>
            <Slider value={value} min={0} max={100} step={1} onChange={setValue} />
            <Slider value={NaN} min={0} max={100} step={1} onChange={setValue} />
            {/* Values outside the min,max range are clamped */}
            <Slider value={3000} min={0} max={100} step={1} onChange={setValue} />
            <Slider value={-3000} min={0} max={100} step={1} onChange={setValue} />
        </>
    )
}

export function Disabled(): JSX.Element {
    const [value, setValue] = useState(42)

    return (
        <Slider
            value={value}
            min={0}
            max={100}
            step={1}
            onChange={setValue}
            disabledReason="You don't have permission to change this value"
        />
    )
}
