import '@testing-library/jest-dom'

import { cleanup, render, screen } from '@testing-library/react'
import { Provider } from 'kea'

import { initKeaTests } from '~/test/init'
import { ActionFilter } from '~/types'

import { InsightLabel } from './index'

const INSIGHTSQL_EXPRESSION = 'avg(properties.usd_amount)'

function insightsqlAction(overrides: Partial<ActionFilter> = {}): ActionFilter {
    return {
        id: '$pageview',
        name: '$pageview',
        type: 'events',
        order: 0,
        math: 'insightsql',
        math_insightsql: INSIGHTSQL_EXPRESSION,
        ...overrides,
    } as ActionFilter
}

describe('InsightLabel — hideInsightsQLTagWhenCustomName', () => {
    beforeEach(() => {
        initKeaTests()
    })

    afterEach(() => {
        cleanup()
    })

    function renderLabel(props: Parameters<typeof InsightLabel>[0]): void {
        render(
            <Provider>
                <InsightLabel {...props} />
            </Provider>
        )
    }

    it('hides the SQL expression tag when the flag is on, the series is named, and math is insightsql', () => {
        renderLabel({ action: insightsqlAction({ custom_name: 'Revenue' }), hideInsightsQLTagWhenCustomName: true })

        expect(screen.queryByText(INSIGHTSQL_EXPRESSION)).not.toBeInTheDocument()
    })

    it('keeps the SQL expression tag by default (opt-in), even with a custom name', () => {
        renderLabel({ action: insightsqlAction({ custom_name: 'Revenue' }) })

        expect(screen.getByText(INSIGHTSQL_EXPRESSION)).toBeInTheDocument()
    })

    it('keeps the SQL expression tag when the flag is on but the series has no custom name', () => {
        renderLabel({ action: insightsqlAction(), hideInsightsQLTagWhenCustomName: true })

        expect(screen.getByText(INSIGHTSQL_EXPRESSION)).toBeInTheDocument()
    })

    it('does not affect non-insightsql math tags — a named sum series still shows its tag', () => {
        renderLabel({
            action: insightsqlAction({ custom_name: 'Revenue', math: 'sum', math_property: 'usd_amount' }),
            hideInsightsQLTagWhenCustomName: true,
        })

        expect(screen.getByText('Sum')).toBeInTheDocument()
    })
})
