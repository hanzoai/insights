import '@testing-library/jest-dom'

import { act, render, screen } from '@testing-library/react'
import { expectLogic } from 'kea-test-utils'

import { initKeaTests } from '~/test/init'
import { toolbarConfigLogic } from '~/toolbar/toolbarConfigLogic'

import { webVitalsToolbarLogic } from './webVitalsToolbarLogic'
import { WebVitalsToolbarMenu } from './WebVitalsToolbarMenu'

describe('WebVitalsToolbarMenu', () => {
    beforeEach(() => {
        initKeaTests()
        toolbarConfigLogic
            .build({
                insights: {
                    config: { ui_host: 'https://us.hanzo.ai/' },
                    webVitalsAutocapture: { isEnabled: false },
                } as any,
            } as any)
            .mount()
    })

    it('uses the Insights ui host for the settings link', async () => {
        render(<WebVitalsToolbarMenu />)

        const settingsLink = screen.getByText('settings page').closest('a')
        expect(settingsLink).toHaveAttribute('href', 'https://us.hanzo.ai/settings/project')
        expect(settingsLink).toHaveAttribute('target', '_blank')

        // Rendering mounts webVitalsToolbarLogic, whose mount-time load updates state
        // asynchronously — settle it inside act so React doesn't warn
        await act(async () => {
            await expectLogic(webVitalsToolbarLogic).toFinishAllListeners()
        })
    })
})
