import type { Meta, StoryObj } from '@storybook/react'
import clsx from 'clsx'

import { IconGear, IconInfo, IconPlus } from '@hanzo/icons'
import { Link } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { IconCalculate, IconLink } from 'lib/elements/icons'
import { Banner } from 'lib/elements/Banner'
import { Divider } from 'lib/elements/Divider'
import { range } from 'lib/utils/arrays'
import { capitalizeFirstLetter } from 'lib/utils/strings'
import { urls } from 'scenes/urls'

import { AccessControlLevel, AccessControlResourceType } from '~/types'

import {
    Button,
    ButtonProps,
    ButtonWithDropdown,
    ButtonWithDropdownProps,
    ButtonWithoutSideActionProps,
} from './Button'
import { More } from './More'

const statuses: ButtonProps['status'][] = ['default', 'alt', 'danger']
const types: ButtonProps['type'][] = ['primary', 'secondary', 'tertiary']

type Story = StoryObj<ButtonWithoutSideActionProps>
const meta: Meta<ButtonWithoutSideActionProps> = {
    title: 'Lemon UI/Lemon Button',
    component: Button as any,
    tags: ['autodocs'],
    argTypes: {
        icon: {
            type: 'function',
        },
    },
}
export default meta

export const Default: Story = {
    args: {
        icon: <IconCalculate />,
        children: 'Click me',
    },
}

const StatusesTemplate = ({
    noText,
    accommodateTooltip,
    ...props
}: ButtonProps & { noText?: boolean; accommodateTooltip?: boolean }): JSX.Element => {
    return (
        <div className={clsx('flex gap-2 border rounded-lg p-2 flex-wrap', accommodateTooltip && 'pt-12')}>
            {statuses.map((status, j) => (
                <Button key={j} status={status} icon={<IconCalculate />} {...props}>
                    {!noText ? capitalizeFirstLetter(status || 'default') : undefined}
                </Button>
            ))}
        </div>
    )
}

const TypesAndStatusesTemplate = (props: ButtonProps): JSX.Element => {
    return (
        <div className="deprecated-space-y-2">
            {types.map((type) => (
                <div key={type}>
                    <h5>type={capitalizeFirstLetter(type || '')}</h5>
                    <StatusesTemplate {...props} type={type} />
                </div>
            ))}
        </div>
    )
}

export const TypesAndStatuses: Story = {
    render: () => {
        return (
            <div className="deprecated-space-y-12">
                <div className="p-2 rounded-lg border">
                    <TypesAndStatusesTemplate />
                </div>
                <div className="p-2 bg-surface-primary rounded-lg border">
                    <TypesAndStatusesTemplate />
                </div>
            </div>
        )
    },
    args: { ...Default.args },
}

type PopoverStory = StoryObj<ButtonWithDropdownProps>

export const NoPadding: Story = {
    render: () => {
        return <StatusesTemplate noText noPadding />
    },
}

export const TextOnly: Story = {
    render: () => {
        return <StatusesTemplate type="secondary" icon={null} />
    },
}

export const Sizes: Story = {
    render: () => {
        const sizes: ButtonProps['size'][] = ['xxsmall', 'xsmall', 'small', 'medium', 'large']

        return (
            <div className="deprecated-space-y-2">
                {sizes.map((size) => (
                    <div key={size}>
                        <h5>size={size}</h5>
                        <StatusesTemplate size={size} type="secondary" />
                    </div>
                ))}
            </div>
        )
    },
}

export const SizesIconOnly: Story = {
    render: () => {
        const sizes: ButtonProps['size'][] = ['xxsmall', 'xsmall', 'small', 'medium', 'large']

        return (
            <div className="deprecated-space-y-2">
                {sizes.map((size) => (
                    <div key={size}>
                        <h5>size={size}</h5>
                        <StatusesTemplate size={size} type="secondary" noText />
                    </div>
                ))}
            </div>
        )
    },
}

export const DisabledWithReason: Story = {
    render: () => {
        return <StatusesTemplate disabledReason="You're not cool enough to click this." accommodateTooltip />
    },
}
// TODO: Add DisabledWithReason.play for a proper snapshot showcasing the tooltip

export const Loading: Story = {
    render: () => {
        return <TypesAndStatusesTemplate loading />
    },
    parameters: {
        testOptions: {
            waitForLoadersToDisappear: false,
        },
    },
}

export const Active: Story = {
    render: () => {
        return (
            <div className="deprecated-space-y-2">
                <p>
                    Sometimes you may need to keep the Button in it's active state e.g. the hover state. This can
                    be done by setting the <code>active</code> property
                </p>
                <div className="flex items-center gap-2">
                    <Button>I am not active</Button>
                    <Button active>I am active</Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="primary">I am not active</Button>
                    <Button type="primary" active>
                        I am active
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="primary" status="alt">
                        I am not active
                    </Button>
                    <Button type="primary" status="alt" active>
                        I am active
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="secondary">I am not active</Button>
                    <Button type="secondary" active>
                        I am active
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="secondary" status="alt">
                        I am not active
                    </Button>
                    <Button type="secondary" status="alt" active>
                        I am active
                    </Button>
                </div>
            </div>
        )
    },
}

export const MenuButtons: Story = {
    render: () => {
        return (
            <div className="deprecated-space-y-2">
                <div className="border rounded-lg flex flex-col p-2 deprecated-space-y-1">
                    <Button active>Active item</Button>
                    <Button>Item 1</Button>
                    <Button>Item 2</Button>
                </div>
            </div>
        )
    },
}

export const WithSideIcon: Story = {
    render: () => {
        return <StatusesTemplate sideIcon={<IconInfo />} />
    },
}

export const FullWidth: Story = {
    render: () => {
        return (
            <div className="deprecated-space-y-2">
                <Button fullWidth>Full Width</Button>
                <Button type="primary" fullWidth>
                    Full Width
                </Button>

                <Button type="primary" fullWidth center icon={<IconPlus />}>
                    Full Width centered with icon
                </Button>

                <Button
                    type="secondary"
                    fullWidth
                    icon={<IconCalculate />}
                    sideAction={{
                        icon: <IconPlus />,
                        tooltip: 'Create new',
                        onClick: () => alert('Side action!'),
                    }}
                >
                    Full Width with side action
                </Button>
            </div>
        )
    },
}

export const WithSideAction: Story = {
    render: () => {
        return (
            <div className="deprecated-space-y-2">
                {types.map((type) => (
                    <div key={type}>
                        <h5>type={capitalizeFirstLetter(type || '')}</h5>
                        <div className="flex items-center gap-2">
                            {statuses.map((status, i) => (
                                <Button
                                    key={i}
                                    type={type}
                                    sideAction={{
                                        icon: <IconPlus />,
                                        tooltip: 'Create new',
                                        onClick: () => alert('Side action!'),
                                    }}
                                    status={status}
                                >
                                    {capitalizeFirstLetter(status || 'Default')}
                                </Button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    },
}

export const WithButtonWrapper: Story = {
    render: () => {
        return (
            <div className="flex flex-col gap-2">
                <div className="border rounded-lg flex flex-col p-2 space-y-1">
                    <Button
                        buttonWrapper={(button) => <div className="opacity-50">{button}</div>}
                        sideAction={{
                            icon: <IconPlus />,
                            tooltip: 'No wrapper around side action',
                            onClick: () => alert('Side action!'),
                        }}
                        active
                    >
                        wrapped with opacity 50
                    </Button>
                    <Button
                        buttonWrapper={(button) => <div className="opacity-20">{button}</div>}
                        sideAction={{
                            icon: <IconPlus />,
                            tooltip: 'No wrapper around side action',
                            onClick: () => alert('Side action!'),
                        }}
                    >
                        wrapped with opacity 20
                    </Button>
                </div>
            </div>
        )
    },
}

export const AsLinks: Story = {
    render: () => {
        return (
            <div className="deprecated-space-y-2">
                <Banner type="info">
                    <b>Reminder</b> - if you just want a link, use the{' '}
                    <Link to="/?path=/docs/elements-link" disableClientSideRouting>
                        Link component
                    </Link>
                </Banner>

                <p>
                    Buttons can act as links via the <b>to</b> prop. If this is an internal endpoint it will be routed
                    client-side
                </p>
                <Button to={urls.projectHomepage()}>Internal link with "to"</Button>

                <p>External links will be automatically detected and routed to normally</p>
                <Button to="https://hanzo.ai">External link</Button>

                <p>
                    The <code>targetBlank</code> prop will open the link in a new window/tab, setting the appropriate
                    attributed like <code>rel="noopener"</code>
                </p>
                <Button to="https://hanzo.ai" targetBlank>
                    External link with "targetBlank"
                </Button>
            </div>
        )
    },
}

export const WithDropdownToTheRight: PopoverStory = {
    render: (props) => <ButtonWithDropdown {...props} />,
    args: {
        ...Default.args,
        dropdown: {
            overlay: (
                <>
                    <Button fullWidth>Kakapo</Button>
                    <Button fullWidth>Kangaroo</Button>
                    <Button fullWidth>Kingfisher</Button>
                    <Button fullWidth>Koala</Button>
                </>
            ),
            placement: 'right-start',
        },
    },
}

export const WithDropdownToTheBottom: PopoverStory = {
    render: (props) => <ButtonWithDropdown {...props} />,
    args: {
        ...Default.args,
        dropdown: {
            overlay: (
                <>
                    <Button fullWidth>Kakapo</Button>
                    <Button fullWidth>Kangaroo</Button>
                    <Button fullWidth>Kingfisher</Button>
                    <Button fullWidth>Koala</Button>
                </>
            ),
            placement: 'bottom',
            matchWidth: true,
        },
    },
}

export const WithVeryLongPopoverToTheBottom: PopoverStory = {
    render: (props) => <ButtonWithDropdown {...props} />,
    args: {
        ...Default.args,
        dropdown: {
            overlay: (
                <>
                    {range(200).map((n) => (
                        <Button key={n} fullWidth>
                            {n.toString()}
                        </Button>
                    ))}
                </>
            ),
            placement: 'bottom',
            matchWidth: true,
        },
    },
}

export const WithTooltip: Story = {
    args: {
        ...Default.args,
        tooltip: (
            <>
                This is example with a link: <Link to="https://hanzo.ai">Go home</Link>
            </>
        ),
    },
}

export const WithTooltipPlacementAndArrowOffset: Story = {
    args: {
        ...Default.args,
        tooltip: (
            <>
                This is example with a link: <Link to="https://hanzo.ai">Go home</Link>
            </>
        ),
        tooltipPlacement: 'top-start',
        tooltipArrowOffset: 30,
    },
}

export const More_: Story = {
    render: () => {
        return (
            <More
                overlay={
                    <>
                        <Button fullWidth>View</Button>
                        <Button fullWidth>Edit</Button>
                        <Divider />
                        <Button status="danger" fullWidth>
                            Delete
                        </Button>
                    </>
                }
            />
        )
    },
}

export const WithOverflowingContent: Story = {
    render: () => {
        const longText = 'long text that will overflow the button by at least a little!'

        return (
            <div className="w-200 border p-2 rounded flex items-center gap-2 overflow-hidden">
                <Button type="secondary">No shrink</Button>
                <Button type="secondary" icon={<IconLink />}>
                    Small button
                </Button>
                <Button type="secondary" icon={<IconGear />} sideIcon={<IconLink />} truncate>
                    Truncating {longText}
                </Button>
                <Button type="secondary">{longText}</Button>
            </div>
        )
    },
}

export const WithAccessControl: Story = {
    render: () => {
        return (
            <div className="flex gap-2">
                <AccessControlAction
                    resourceType={AccessControlResourceType.Project}
                    minAccessLevel={AccessControlLevel.Admin}
                    userAccessLevel={AccessControlLevel.Admin}
                >
                    <Button type="primary">Enabled (admin ≥ admin)</Button>
                </AccessControlAction>
                <AccessControlAction
                    resourceType={AccessControlResourceType.Project}
                    minAccessLevel={AccessControlLevel.Admin}
                    userAccessLevel={AccessControlLevel.Viewer}
                >
                    <Button type="primary">Disabled (viewer {'<'} admin)</Button>
                </AccessControlAction>
            </div>
        )
    },
}
