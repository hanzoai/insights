import { ComponentType, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import * as packageIcons from '@hanzo/icons'

import { ELEMENTS, OBJECTS, TEAMS_AND_COMPANIES, TECHNOLOGY } from './categories'

type IconComponent = ComponentType<{ className?: string }>

const registry = packageIcons as unknown as Record<string, IconComponent>

const iconNames = (): string[] => Object.keys(packageIcons).filter((i) => !['BaseIcon', 'default'].includes(i))

describe('icons', () => {
    it('ensures all icons are categorised', async () => {
        const validPackageIcons = Object.keys(packageIcons).filter((i) => !['BaseIcon', 'default'].includes(i))
        const categories = { ...OBJECTS, ...TECHNOLOGY, ...ELEMENTS, ...TEAMS_AND_COMPANIES }
        const categorisedIcons = Object.values(categories)
            .map((category) => Object.values(category))
            .flat(2)

        expect(validPackageIcons.filter((i) => !categorisedIcons.includes(i))).toEqual([])
    })

    // icons.scss styles `.Icon`, and 17 further selectors qualify it — `.Input .Icon`,
    // `.Button__icon .Icon`, `.Switch > .Icon`, the filter buttons, the accordion
    // headers. The class the package emits is therefore load-bearing, and it is
    // decided in a dependency, not here. When it emitted `LemonIcon` only the base
    // rule matched: every qualified rule silently missed and inputs, switches and
    // sidebar chevrons rendered at container width. Nothing asserted the class, so
    // that drift reached production and was diagnosed from a running pod. This is
    // the assertion that was missing.
    it('renders the class the stylesheets select on', () => {
        const rendered = iconNames().map((name) => [name, renderToStaticMarkup(createElement(registry[name]))] as const)

        expect(rendered.length).toBeGreaterThan(0)
        expect(rendered.filter(([, html]) => !html.includes('class="Icon"')).map(([name]) => name)).toEqual([])
    })

    // A caller's className must compose onto the base class rather than replace it,
    // otherwise `<IconX className="text-danger" />` drops the sizing rule.
    it('composes a caller className onto the base class', () => {
        const [first] = iconNames()
        const html = renderToStaticMarkup(createElement(registry[first], { className: 'text-danger' }))

        expect(html).toContain('class="Icon text-danger"')
    })
})
