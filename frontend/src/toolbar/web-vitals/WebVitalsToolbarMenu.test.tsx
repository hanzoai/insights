import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { initKeaTests } from '~/test/init'
import { toolbarConfigLogic } from '~/toolbar/toolbarConfigLogic'

import { WebVitalsToolbarMenu } from './WebVitalsToolbarMenu'

describe('WebVitalsToolbarMenu', () => {
    beforeEach(() => {
        initKeaTests()
        toolbarConfigLogic
            .build({
                insights: {
                    config: { ui_host: 'https://insights.hanzo.ai/' },
                    webVitalsAutocapture: { isEnabled: false },
                } as any,
            } as any)
            .mount()
    })

    it('uses the Insights ui host for the settings link', () => {
        render(<WebVitalsToolbarMenu />)

        const settingsLink = screen.getByRole('link', { name: 'settings page' })
        expect(settingsLink).toHaveAttribute('href', 'https://insights.hanzo.ai/settings/project')
        expect(settingsLink).toHaveAttribute('target', '_blank')
    })
})
