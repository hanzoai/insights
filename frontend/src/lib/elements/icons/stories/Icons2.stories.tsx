import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'

import { Button } from 'lib/elements/Button'
import { Checkbox } from 'lib/elements/Checkbox'
import { Table } from 'lib/elements/Table'

import * as icons from '../icons'

const meta: Meta = {
    title: 'Lemon UI/Icons2',
    parameters: {
        docs: {
            description: {
                component: `

[Related Figma area](https://www.figma.com/file/Y9G24U4r04nEjIDGIEGuKI/Insights-Design-System-One?node-id=3139%3A1388)

Lemon Icons are generally [Material Icons](https://fonts.google.com/icons) with some matching in-house additions.
All should be based on a 24px (1.5rem) square viewbox, with icon contents fitting into a 20px (1.25rem) or smaller square.

When adding new icons from Figma please make sure to:
- [ ] Export the item as an SVG using the 24x24 frame surrounding it
- [ ] Follow the existing \`IconFoo\` naming convention and use the \`<SvgIcon>\` component instead of \`<svg>\`
- [ ] Ensure all colors in the SVG are set to \`currentColor\` so that themes can be applied
`,
            },
        },
    },
    tags: ['autodocs'],
}
export default meta

interface IconDefinition {
    name: string
    // ElementType also admits forwardRef-wrapped icons (e.g. IconUnverifiedEvent)
    icon: React.ElementType
}

const allIcons: IconDefinition[] = Object.entries(icons)
    .filter(([key]) => key !== 'IconWithCount' && key !== 'IconWithBadge')
    .map(([key, Icon]) => ({ name: key, icon: Icon }))
    .sort((a, b) => a.name.localeCompare(b.name))

type LibraryType = StoryObj<{ letter?: string | null }>
const renderLibrary = ({ letter }: { letter?: string | null }): JSX.Element => {
    const [showBorder, setShowBorder] = React.useState(true)
    const filteredIcons =
        letter === undefined
            ? allIcons
            : letter !== null
              ? allIcons.filter((icon) => icon.name.replace('Icon', '').toLowerCase().startsWith(letter))
              : allIcons.filter((icon) => !icon.name.replace('Icon', '').toLowerCase().match(/[a-z]/))

    return (
        <div className="deprecated-space-y-2">
            <Checkbox bordered checked={showBorder} onChange={setShowBorder} label="Show border" />
            <Table
                dataSource={filteredIcons}
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
                        title: 'Icon',
                        key: 'icon',
                        dataIndex: 'icon',
                        render: function RenderIcon(Icon) {
                            Icon = Icon as IconDefinition['icon']
                            return (
                                <Icon
                                    style={{
                                        fontSize: '1.5rem',
                                        boxShadow: showBorder ? '0px 0px 1px 1px red' : null,
                                    }}
                                />
                            )
                        },
                    },

                    {
                        title: 'In Button',
                        key: 'button-icon',
                        dataIndex: 'icon',
                        render: function RenderButton(Icon) {
                            Icon = Icon as IconDefinition['icon']
                            return (
                                <Button type="secondary" icon={<Icon />}>
                                    Button
                                </Button>
                            )
                        },
                    },
                ]}
                emptyState={letter ? `No icons start with the letter ${letter.toUpperCase()}` : 'No icons'}
            />
        </div>
    )
}

export const ShelfJ: LibraryType = {
    render: renderLibrary,
    args: { letter: 'j' },
    parameters: { testOptions: { snapshotTargetSelector: '.Table tbody' } },
}
export const ShelfK: LibraryType = {
    render: renderLibrary,
    args: { letter: 'k' },
    parameters: { testOptions: { snapshotTargetSelector: '.Table tbody' } },
}
export const ShelfL: LibraryType = {
    render: renderLibrary,
    args: { letter: 'l' },
    parameters: { testOptions: { snapshotTargetSelector: '.Table tbody' } },
}
export const ShelfM: LibraryType = {
    render: renderLibrary,
    args: { letter: 'm' },
    parameters: { testOptions: { snapshotTargetSelector: '.Table tbody' } },
}
export const ShelfN: LibraryType = {
    render: renderLibrary,
    args: { letter: 'n' },
    parameters: { testOptions: { snapshotTargetSelector: '.Table tbody' } },
}
export const ShelfO: LibraryType = {
    render: renderLibrary,
    args: { letter: 'o' },
    parameters: { testOptions: { snapshotTargetSelector: '.Table tbody' } },
}
export const ShelfP: LibraryType = {
    render: renderLibrary,
    args: { letter: 'p' },
    parameters: { testOptions: { snapshotTargetSelector: '.Table tbody' } },
}
export const ShelfQ: LibraryType = {
    render: renderLibrary,
    args: { letter: 'q' },
    parameters: { testOptions: { snapshotTargetSelector: '.Table tbody' } },
}
export const ShelfR: LibraryType = {
    render: renderLibrary,
    args: { letter: 'r' },
    parameters: { testOptions: { snapshotTargetSelector: '.Table tbody' } },
}
