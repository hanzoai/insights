import { BrowserContext, expect, Page, test } from '@playwright/test'

/**
 * Does a deployed insights actually work?
 *
 * Every scene here answers 200 to a plain HTTP request whether or not it renders,
 * because they all serve the same SPA shell -- so a status check proves nothing.
 * These tests assert the scene MOUNTED: React put something under #root, no error
 * boundary caught anything, and the server returned no 5xx while it loaded.
 */

const USERNAME = process.env.LOGIN_USERNAME || 'e2e@hanzo.ai'
const PASSWORD = process.env.LOGIN_PASSWORD || ''

/**
 * There is no password form to drive: /login redirects unconditionally to
 * hanzo.id, because OIDC is how people sign in here. The API still accepts the
 * e2e account, and APIRequestContext shares the browser context's cookie jar,
 * so signing in through it signs in every page the context opens.
 */
async function signIn(context: BrowserContext): Promise<void> {
    expect(PASSWORD, 'LOGIN_PASSWORD must be set -- in CI it comes from KMS').not.toBe('')
    const response = await context.request.post('/api/login', {
        data: { email: USERNAME, password: PASSWORD },
    })
    expect(response.status(), `sign-in failed for ${USERNAME}`).toBe(200)
}

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
    test.beforeEach(async ({ context }) => {
        await signIn(context)
    })

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
        await open(page, '/project/1/data-management/events')
        await expectHealthy(page, w, '/project/1/data-management/events')
        // A tenant with ingested events must list some. An empty table here means
        // the warehouse read path is broken, which every chart in the product needs.
        await expect
            .poll(async () => await page.locator('tbody tr').count(), {
                timeout: 60_000,
                message: 'no event definitions listed -- the warehouse read path is likely broken',
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
