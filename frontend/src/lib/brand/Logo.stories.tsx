import { Meta, StoryObj } from '@storybook/react'

import { Logo, Logomark } from 'lib/brand'

const meta: Meta = {
    title: 'Components/Brand Logo',
    tags: ['test-skip'],
    parameters: {
        docs: {
            description: {
                component:
                    'The Insights logo. The mark fills with `currentColor`, so it takes the color of the text ' +
                    'around it and needs no per-theme variant. Size with the `size` token (`xs` | `sm` | `md` | ' +
                    '`lg` | `xl`) — it sets the height, width follows. `Logo` renders the mark beside the ' +
                    'product name; `Logomark` is the mark alone, and can `jumpOnClick`.',
            },
        },
    },
}
export default meta

function Row({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-xs text-muted uppercase tracking-wide">{label}</span>
            <div className="flex items-end gap-8 flex-wrap">{children}</div>
        </div>
    )
}

export const Sizes: StoryObj = {
    render: () => (
        <div className="flex flex-col gap-8 p-4">
            <Row label="logo">
                <Logo size="xs" />
                <Logo size="sm" />
                <Logo size="md" />
                <Logo size="lg" />
                <Logo size="xl" />
            </Row>
            <Row label="logomark">
                <Logomark size="xs" />
                <Logomark size="sm" />
                <Logomark size="md" />
                <Logomark size="lg" />
                <Logomark size="xl" />
            </Row>
        </div>
    ),
}

export const Color: StoryObj = {
    render: () => (
        <div className="flex flex-col gap-8 p-4">
            <Row label="inherits the surrounding text color">
                <span className="text-danger">
                    <Logo size="md" />
                </span>
                <span className="text-success">
                    <Logo size="md" />
                </span>
            </Row>
            <Row label="mark only">
                <Logo size="md" markOnly />
            </Row>
        </div>
    ),
}

export const Interactive: StoryObj = {
    render: () => (
        <div className="flex flex-col gap-8 p-4">
            <Row label="jumpOnClick — click the mark">
                <Logomark jumpOnClick size="xl" />
            </Row>
        </div>
    ),
}
