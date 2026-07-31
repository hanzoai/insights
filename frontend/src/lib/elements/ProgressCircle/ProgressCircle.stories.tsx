import { Meta, StoryFn, StoryObj } from '@storybook/react'
import { useEffect, useState } from 'react'

import { IconGear } from '@hanzo/icons'

import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { ProgressCircle, ProgressCircleProps } from './ProgressCircle'

type Story = StoryObj<typeof ProgressCircle>
const meta: Meta<typeof ProgressCircle> = {
    title: 'Elements/Progress Circle',
    component: ProgressCircle,
    parameters: {
        docs: {
            description: {
                component: `

[Related Figma area](https://www.figma.com/file/Y9G24U4r04nEjIDGIEGuKI/Insights-Design-System-One?node-id=3139%3A1388)

Labels provide common styling and options for labeling form elements. They can be used directly but most commonly should be used via the \`Field\` component.

`,
            },
        },
    },
    args: {
        progress: 0.3,
    },
    tags: ['autodocs'],
}
export default meta

export const Template: StoryFn<typeof ProgressCircle> = (props: ProgressCircleProps) => {
    return <ProgressCircle {...props} />
}

export const Basic: Story = Template.bind({})
Basic.args = {
    progress: 0.3,
}

export const Overview = (): JSX.Element => {
    const [progress, setProgress] = useState(0.2)
    const [animate, setAnimate] = useState(false)

    useEffect(() => {
        if (!animate) {
            return
        }
        const interval = setInterval(() => {
            setProgress((progress) => {
                const newProgress = progress + 0.1
                return newProgress > 1 ? newProgress - 1 : newProgress
            })
        }, 500)
        return () => clearInterval(interval)
    }, [animate])

    return (
        <div className="flex flex-col gap-2">
            <Checkbox checked={animate} onChange={setAnimate} bordered label="Animate" />
            <ProgressCircle progress={progress} />
            <ProgressCircle progress={progress} strokePercentage={0.5} size={30} />

            <span className="flex items-center gap-2">
                <Button
                    icon={<ProgressCircle progress={progress} />}
                    sideIcon={<IconGear />}
                    type="secondary"
                    size="small"
                >
                    In a button!
                </Button>

                <Button
                    icon={<ProgressCircle progress={progress} size={20} />}
                    sideIcon={<IconGear />}
                    type="secondary"
                >
                    In a button!
                </Button>

                <Button
                    icon={<ProgressCircle progress={progress} size={24} />}
                    sideIcon={<IconGear />}
                    type="secondary"
                    size="large"
                >
                    In a button!
                </Button>
            </span>

            <ProgressCircle progress={progress} size={40}>
                <span className="font-semibold text-sm">{(100 * progress).toFixed(0)}</span>
            </ProgressCircle>

            <span>
                Here is one inline <ProgressCircle progress={progress} /> with some text...
            </span>
        </div>
    )
}
