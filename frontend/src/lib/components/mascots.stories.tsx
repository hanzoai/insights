import { Meta } from '@storybook/react'
import React from 'react'

import { Table } from '@hanzo/elements'

import * as mascots from './mascots'

interface MascotDefinition {
    name: string
    mascot: React.ComponentType<Record<string, unknown>>
}

const allMascots: MascotDefinition[] = Object.entries(mascots).map(([key, Mascot]) => ({
    name: key,
    mascot: Mascot,
}))

const meta: Meta = {
    title: 'Lemon UI/Script illustrations',
    tags: ['test-skip', 'autodocs'], // Not valuable to take snapshots of these mascots
    parameters: {
        docs: {
            description: {
                component: `

[Related Figma area](https://www.figma.com/file/Y9G24U4r04nEjIDGIEGuKI/Insights-Design-System-One?node-id=3775%3A2092)

Our mascot has many professions so it’s vital you choose the correct one for whatever project
or page you are working on.s

Singular mascot illustrations should be kept in a 200x200px frame
and scaled up or down accordingly. Wider mascot frames containing one or more will keep the
same height of 200px but the width may change dependant on the illustration.

As we continue to
grow more and more mascots of different professions and positions will appear, but if you have
a specific idea in mind, please submit new mascot requests to Lottie our Graphic Designer and
she will get to it dependant on work load.
`,
            },
        },
    },
}
export default meta
export function Library(): JSX.Element {
    return (
        <div className="deprecated-space-y-2">
            <Table
                dataSource={allMascots}
                columns={[
                    {
                        title: 'Name',
                        key: 'name',
                        dataIndex: 'name',
                        render: function RenderName(name) {
                            return <code>{`<${name as string} />`}</code>
                        },
                    },
                    {
                        title: 'Mascot',
                        key: 'mascot',
                        dataIndex: 'mascot',
                        render: function RenderMascot(Mascot) {
                            Mascot = Mascot as MascotDefinition['mascot']
                            return (
                                <div className="h-40">
                                    <Mascot className="max-h-full w-auto object-contain" />
                                </div>
                            )
                        },
                    },
                ]}
            />
        </div>
    )
}
