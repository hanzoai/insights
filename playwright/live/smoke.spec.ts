import { expect, Page, test } from '@playwright/test'

/**
 * Does a deployed insights actually work?
 *
 * Every scene here answers 200 to a plain HTTP request whether or not it renders,
 * because they all serve the same SPA shell -- so a status check proves nothing.
 * These tests assert the scene MOUNTED: React put something under #root, no error
 * boundary caught anything, and the server returned no 5xx while it loaded.
 */

type Watch = { serverErrors: string[]; pageErrors: string[] }

function watch(page: Page): Watch {
    const w: Watch = { serverErrors: [], pageErrors: [] }
    page.on('response', (r) => {
        if (r.status() >= 500) {
            w.serverErrors.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`)
        }
    })
    page.on('pageerror', (e) => w.pageErrors.push(String(e).slice(0, 300)))
    return w
}

async function open(page: Page, path: string): Promise<void> {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    // The shell paints before the scene does. Wait for React to put something
    // under #root rather than for a fixed delay, which is either flaky or slow.
    await expect
        .poll(async () => await page.evaluate(() => document.getElementById('root')?.children.length ?? 0), {
            timeout: 60_000,
            message: `nothing rendered under #root at ${path}`,
        })
        .toBeGreaterThan(0)
}

async function expectHealthy(page: Page, w: Watch, path: string): Promise<void> {
    // The boundary renders <div class="ErrorBoundary"><h2>An error has occurred</h2>.
    // Its presence means the scene threw, which a mounted-and-blank check misses.
    await expect(page.locator('.ErrorBoundary'), `error boundary caught a throw at ${path}`).toHaveCount(0)
    expect(w.serverErrors, `server errored while loading ${path}`).toEqual([])
    expect(w.pageErrors, `uncaught exception at ${path}`).toEqual([])
}

// Every scene a signed-in user can reach from the nav. If one is added to the
// product it belongs here -- an unlisted scene is an untested one.
const SCENES: { name: string; path: string }[] = [
    { name: 'dashboards', path: '/project/1/dashboard' },
    { name: 'saved insights', path: '/project/1/insights' },
    { name: 'web analytics', path: '/project/1/web-analytics' },
    { name: 'session replay', path: '/project/1/replay/recent' },
    { name: 'users', path: '/project/1/persons' },
    { name: 'cohorts', path: '/project/1/cohorts' },
    { name: 'actions', path: '/project/1/data-management/actions' },
    { name: 'event definitions', path: '/project/1/data-management/events' },
    { name: 'properties', path: '/project/1/data-management/properties' },
    { name: 'annotations', path: '/project/1/data-management/annotations' },
    { name: 'data warehouse', path: '/project/1/data-warehouse' },
    { name: 'sql editor', path: '/project/1/sql' },
    { name: 'feature flags', path: '/project/1/feature_flags' },
    { name: 'experiments', path: '/project/1/experiments' },
    { name: 'surveys', path: '/project/1/surveys' },
    { name: 'notebooks', path: '/project/1/notebooks' },
    { name: 'data pipelines', path: '/project/1/pipeline' },
    { name: 'activity', path: '/project/1/activity/explore' },
    { name: 'project settings', path: '/settings/project' },
    { name: 'organization settings', path: '/settings/organization' },
    { name: 'user settings', path: '/settings/user' },
]

test.describe('a deployed insights', () => {
    test('signs in and renders the app', async ({ page }) => {
        const w = watch(page)
        await open(page, '/')
        await expectHealthy(page, w, '/')
        await expect(page).toHaveTitle(/Insights/)
    })

    for (const scene of SCENES) {
        test(`${scene.name} mounts`, async ({ page }) => {
            const w = watch(page)
            await open(page, scene.path)
            await expectHealthy(page, w, scene.path)
        })
    }

    test('shows this org real data, not an empty state', async ({ page }) => {
        const w = watch(page)
        await open(page, '/project/1/insights')
        await expectHealthy(page, w, '/project/1/insights')
        // Rows, not just a mounted shell. A scene that renders its empty state is
        // indistinguishable from a working one until you count what is in it.
        //
        // Saved insights rather than data-management/events, deliberately: event and
        // property DEFINITIONS are empty in this deployment and asserting on them
        // would be asserting a known gap. Ingest writes events to the datastore
        // warehouse through the native path, which never populates Django's
        // definition tables -- /api/projects/1/events/ returns rows while
        // /api/projects/1/event_definitions/ returns count 0. Saved insights read
        // the same warehouse and do have rows, so this still fails if the read path
        // breaks, without encoding a defect as the expectation.
        await expect
            .poll(async () => await page.locator('tbody tr').count(), {
                timeout: 60_000,
                message: 'no saved insights listed -- the warehouse read path is likely broken',
            })
            .toBeGreaterThan(0)
    })

    test('carries no upstream branding', async ({ page }) => {
        await open(page, '/')
        // This is a Hanzo product. A visible PostHog string is a debrand miss.
        const body = await page.locator('body').innerText()
        expect(body).not.toMatch(/PostHog/i)
    })
})
