import { expect, test } from '../utils/playwright-test-base'

test.describe('Event Definitions', () => {
    test('See recordings action', async ({ page }) => {
        await page.goToMenuItem('datamanagement')
        await page.goToMenuItem('event-definitions')

        // default tab is events
        await page.waitForSelector('tbody tr:has-text("Loading… Loading… Loading…")', { state: 'detached' })

        await expect(page.locator('tbody tr .Button').first()).toBeVisible()
        await expect(page.locator('[data-attr=events-definition-table]')).toBeVisible()

        const eventName = await page.locator('tbody tr .PropertyKeyInfo__text').first().innerText()

        await expect(page.locator('[data-attr=event-definitions-table-view-recordings]').first()).toBeVisible()
        await page.locator('[data-attr=event-definitions-table-view-recordings]').first().click()
        expect(page.url()).toMatch(/replay/)

        await page.locator('.Button--has-icon .Button__content').filter({ hasText: 'Filters' }).click()

        await expect(page.locator('.UniversalFilterButton').first()).toContainText(eventName, { ignoreCase: true })
    })
})
