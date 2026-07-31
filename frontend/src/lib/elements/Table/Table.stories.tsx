import { Meta, StoryFn, StoryObj } from '@storybook/react'

import { IconTrash } from '@hanzo/icons'

import { useDelayedOnMountEffect } from 'lib/hooks/useOnMountEffect'

import { Button } from '../Button'
import { Divider } from '../Divider'
import { IconLink } from '../icons'
import { Table, TableProps } from './Table'
import { TableLink } from './TableLink'

type Story = StoryObj<typeof Table>
const meta: Meta<typeof Table> = {
    title: 'Elements/Table',
    component: Table,
    tags: ['autodocs'],
}
export default meta

interface MockPerson {
    name: string
    occupation: string
}

interface MockFunnelSeries {
    name: string
    stepResults: [[number, number], [number, number]]
}

// @ts-expect-error
const GroupedTemplate: StoryFn<typeof Table> = (props: TableProps<MockFunnelSeries>) => {
    return (
        <Table
            {...props}
            columns={[
                {
                    children: [
                        {
                            title: 'Breakdown',
                            dataIndex: 'name',
                        },
                    ],
                },
                {
                    title: '1. Pageview',
                    children: [
                        {
                            title: 'Completed',
                            render: (_, record) => record.stepResults[0][0],
                        },
                        {
                            title: 'Dropped off',
                            render: (_, record) => record.stepResults[0][1],
                        },
                    ],
                },
                {
                    title: '2. Signup',
                    children: [
                        {
                            title: 'Completed',
                            render: (_, record) => record.stepResults[1][0],
                        },
                        {
                            title: 'Dropped off',
                            render: (_, record) => record.stepResults[1][1],
                        },
                    ],
                },
            ]}
            dataSource={
                [
                    {
                        name: 'United States',
                        stepResults: [
                            [4325, 0],
                            [4324, 1],
                        ],
                    },
                    {
                        name: 'France',
                        stepResults: [
                            [53, 0],
                            [12, 41],
                        ],
                    },
                    {
                        name: 'Germany',
                        stepResults: [
                            [92, 0],
                            [1, 91],
                        ],
                    },
                ] as MockFunnelSeries[]
            }
        />
    )
}

// @ts-expect-error
const BasicTemplate: StoryFn<typeof Table> = (props: TableProps<MockPerson>) => {
    return (
        <Table
            {...props}
            columns={[
                {
                    title: 'Name',
                    dataIndex: 'name',
                    sorter: (a, b) => a.name.split(' ')[1].localeCompare(b.name.split(' ')[1]),
                },
                {
                    title: 'Occupation',
                    dataIndex: 'occupation',
                    tooltip: 'What they are primarily working on.',
                    sorter: (a, b) => a.occupation.localeCompare(b.occupation),
                },
            ]}
            dataSource={
                [
                    {
                        name: 'Werner C.',
                        occupation: 'Engineer',
                    },
                    {
                        name: 'Ursula Z.',
                        occupation: 'Retired',
                    },
                    {
                        name: 'Ludwig A.',
                        occupation: 'Painter',
                    },
                    {
                        name: 'Arnold S.',
                        occupation: 'Body-builder',
                    },
                    {
                        name: 'Franz B.',
                        occupation: 'Teacher',
                    },
                ] as MockPerson[]
            }
        />
    )
}

const EmptyTemplate: StoryFn<typeof Table> = (props: TableProps<Record<string, any>>) => {
    return (
        <Table
            {...props}
            columns={[
                { title: 'Name', dataIndex: 'name' },
                { title: 'Occupation', dataIndex: 'occupation' },
            ]}
            dataSource={[]}
        />
    )
}

export const Basic: Story = BasicTemplate.bind({})
Basic.args = {}

export const Grouped: Story = GroupedTemplate.bind({})
Grouped.args = {}

export const Empty: Story = EmptyTemplate.bind({})
Empty.args = {}

export const PaginatedAutomatically: Story = BasicTemplate.bind({})
PaginatedAutomatically.args = { nouns: ['person', 'people'], pagination: { pageSize: 3 } }

export const WithExpandableRows: Story = BasicTemplate.bind({})
WithExpandableRows.args = {
    expandable: {
        rowExpandable: (record) => record.occupation !== 'Retired',
        expandedRowRender: function RenderCow() {
            return <img src="https://c.tenor.com/WAFH6TX2VIYAAAAC/polish-cow.gif" alt="Dancing cow" />
        },
    },
}

export const Small: Story = BasicTemplate.bind({})
Small.args = { size: 'small' }

export const Embedded: Story = BasicTemplate.bind({})
Embedded.args = { embedded: true }

export const Stealth: Story = BasicTemplate.bind({})
Stealth.args = { stealth: true }

export const Loading: Story = BasicTemplate.bind({})
Loading.args = { loading: true }
Loading.parameters = {
    testOptions: {
        waitForLoadersToDisappear: false,
        waitForSelector: '.TableLoader',
    },
}

export const EmptyLoading: Story = EmptyTemplate.bind({})
EmptyLoading.args = { loading: true }
EmptyLoading.parameters = {
    testOptions: {
        waitForLoadersToDisappear: false,
        waitForSelector: '.TableLoader',
    },
}

export const EmptyLoadingWithManySkeletonRows: Story = EmptyTemplate.bind({})
EmptyLoadingWithManySkeletonRows.args = { loading: true, loadingSkeletonRows: 10 }
EmptyLoadingWithManySkeletonRows.parameters = {
    testOptions: {
        waitForLoadersToDisappear: false,
        waitForSelector: '.TableLoader',
    },
}

export const WithoutHeader: Story = BasicTemplate.bind({})
WithoutHeader.args = { showHeader: false }

export const WithoutUppercasingInHeader: Story = BasicTemplate.bind({})
WithoutUppercasingInHeader.args = { uppercaseHeader: false }

export const WithFooter: Story = BasicTemplate.bind({})
WithFooter.args = {
    footer: (
        <>
            <div className="flex items-center m-2">
                <Button center fullWidth>
                    Load more rows
                </Button>
            </div>
        </>
    ),
}

export const WithColorCodedRows: Story = BasicTemplate.bind({})
WithColorCodedRows.args = {
    rowRibbonColor: ({ occupation }) =>
        occupation === 'Engineer'
            ? 'var(--success)'
            : occupation === 'Retired'
              ? 'var(--warning)'
              : occupation === 'Body-builder'
                ? 'var(--danger)'
                : null,
}

export const WithHighlightedRows: Story = BasicTemplate.bind({})
WithHighlightedRows.args = {
    rowStatus: ({ occupation }) => (['Retired', 'Body-builder'].includes(occupation) ? 'highlighted' : null),
}

export const WithMandatorySorting: Story = BasicTemplate.bind({})
WithMandatorySorting.args = { defaultSorting: { columnKey: 'name', order: 1 }, noSortingCancellation: true }

export const WithStickyFirstColumn = (): JSX.Element => {
    useDelayedOnMountEffect(() => {
        const scrollableInner = document.querySelector(
            '#story--elements-table--with-sticky-first-column .scrollable__inner'
        )
        if (scrollableInner) {
            scrollableInner.scrollLeft = 20
        }
    })

    return (
        <Table
            className="max-w-100"
            firstColumnSticky
            columns={[
                {
                    title: 'Name',
                    dataIndex: 'name',
                    sorter: (a, b) => a.name.split(' ')[1].localeCompare(b.name.split(' ')[1]),
                },
                {
                    title: 'Occupation',
                    dataIndex: 'occupation',
                    tooltip: 'What they are primarily working on.',
                    sorter: (a, b) => a.occupation.localeCompare(b.occupation),
                },
                {
                    title: 'Age',
                    key: 'age',
                    render: (_, person) => `${person.name.length * 12} years`,
                },
                {
                    title: 'Zodiac sign',
                    key: 'zodiac',
                    render: () => 'Gemini',
                },
                {
                    title: 'Favorite color',
                    key: 'color',
                    render: (_, person) => (person.occupation === 'Engineer' ? 'Blue' : 'Red'),
                },
            ]}
            dataSource={
                [
                    {
                        name: 'Werner C.',
                        occupation: 'Engineer',
                    },
                    {
                        name: 'Ursula Z.',
                        occupation: 'Retired',
                    },
                    {
                        name: 'Ludwig A.',
                        occupation: 'Painter',
                    },
                    {
                        name: 'Arnold S.',
                        occupation: 'Body-builder',
                    },
                    {
                        name: 'Franz B.',
                        occupation: 'Teacher',
                    },
                ] as MockPerson[]
            }
        />
    )
}

export const WithLink = (): JSX.Element => {
    return (
        <Table
            columns={[
                {
                    title: 'Name',
                    dataIndex: 'name',
                    sorter: (a, b) => a.name.split(' ')[1].localeCompare(b.name.split(' ')[1]),
                    render: (_, item) => (
                        <TableLink
                            title={item.name}
                            to="/test"
                            description={`${item.name} is a ${item.occupation.toLowerCase()} who is ${
                                item.name.length * 12
                            } years old.`}
                        />
                    ),
                },
                {
                    title: 'Occupation',
                    dataIndex: 'occupation',
                    tooltip: 'What they are primarily working on.',
                    sorter: (a, b) => a.occupation.localeCompare(b.occupation),
                },
                {
                    title: 'Age',
                    key: 'age',
                    render: (_, person) => `${person.name.length * 12} years`,
                },
                {
                    title: 'Zodiac sign',
                    key: 'zodiac',
                    render: () => 'Gemini',
                },
                {
                    title: 'Favorite color',
                    key: 'color',
                    render: (_, person) => (person.occupation === 'Engineer' ? 'Blue' : 'Red'),
                },
            ]}
            dataSource={
                [
                    {
                        name: 'Werner C.',
                        occupation: 'Engineer',
                    },
                    {
                        name: 'Ursula Z.',
                        occupation: 'Retired',
                    },
                    {
                        name: 'Ludwig A.',
                        occupation: 'Painter',
                    },
                    {
                        name: 'Arnold S.',
                        occupation: 'Body-builder',
                    },
                    {
                        name: 'Franz B.',
                        occupation: 'Teacher',
                    },
                ] as MockPerson[]
            }
        />
    )
}

export const WithCellActions = (): JSX.Element => {
    return (
        <Table
            columns={[
                {
                    title: 'Name',
                    dataIndex: 'name',
                    cellActions: (value) => (
                        <>
                            <Button
                                fullWidth
                                size="small"
                                icon={<IconLink />}
                                onClick={() => alert(`Viewing profile for ${value}`)}
                            >
                                View profile
                            </Button>
                            <Button fullWidth size="small" onClick={() => alert(`Copying ${value}`)}>
                                Copy name
                            </Button>
                        </>
                    ),
                },
                {
                    title: 'Occupation',
                    dataIndex: 'occupation',
                    cellActions: (value, record) => (
                        <>
                            <Button fullWidth size="small" onClick={() => alert(`Filtering to ${value}`)}>
                                Filter to {value}
                            </Button>
                            <Divider />
                            <Button
                                fullWidth
                                size="small"
                                status="danger"
                                icon={<IconTrash />}
                                onClick={() => alert(`Removing ${record.name}`)}
                            >
                                Remove person
                            </Button>
                        </>
                    ),
                },
                {
                    title: 'Age',
                    key: 'age',
                    render: (_, person) => `${person.name.length * 12} years`,
                },
            ]}
            dataSource={
                [
                    { name: 'Werner C.', occupation: 'Engineer' },
                    { name: 'Ursula Z.', occupation: 'Retired' },
                    { name: 'Ludwig A.', occupation: 'Painter' },
                    { name: 'Arnold S.', occupation: 'Body-builder' },
                    { name: 'Franz B.', occupation: 'Teacher' },
                ] as MockPerson[]
            }
        />
    )
}

export const WithRowActions = (): JSX.Element => {
    return (
        <Table
            columns={[
                {
                    title: 'Name',
                    dataIndex: 'name',
                },
                {
                    title: 'Occupation',
                    dataIndex: 'occupation',
                },
                {
                    title: 'Age',
                    key: 'age',
                    render: (_, person) => `${person.name.length * 12} years`,
                },
            ]}
            rowActions={(record) => (
                <>
                    <Button
                        fullWidth
                        size="small"
                        icon={<IconLink />}
                        onClick={() => alert(`Viewing ${record.name}'s profile`)}
                    >
                        View profile
                    </Button>
                    <Button fullWidth size="small" onClick={() => alert(`Editing ${record.name}`)}>
                        Edit
                    </Button>
                    <Divider />
                    <Button
                        fullWidth
                        size="small"
                        status="danger"
                        icon={<IconTrash />}
                        onClick={() => alert(`Deleting ${record.name}`)}
                    >
                        Delete
                    </Button>
                </>
            )}
            dataSource={
                [
                    { name: 'Werner C.', occupation: 'Engineer' },
                    { name: 'Ursula Z.', occupation: 'Retired' },
                    { name: 'Ludwig A.', occupation: 'Painter' },
                    { name: 'Arnold S.', occupation: 'Body-builder' },
                    { name: 'Franz B.', occupation: 'Teacher' },
                ] as MockPerson[]
            }
        />
    )
}
