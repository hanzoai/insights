import { defineConfig, devices } from '@playwright/test'

/**
 * The suite that runs against a DEPLOYED insights, not a dev instance.
 *
 * Separate from playwright.config.ts on purpose. That config's fixtures build a
 * workspace through /v1/setup_test/, which only exists in TEST mode -- pointing
 * it at production makes every test fail on a 404 that has nothing to do with the
 * thing under test. This suite touches no setup endpoint and creates no data; it
 * signs in as an existing account and reads.
 *
 * LIVE_URL selects the deployment. LOGIN_USERNAME/LOGIN_PASSWORD are the account;
 * in CI the password comes from KMS, never from a file or a repo variable.
 */
export default defineConfig({
    testDir: '.',
    timeout: 90 * 1000,
    expect: { timeout: 30 * 1000 },
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    // A deployed target is shared and can be slow under load; a flake here should
    // not read as a broken release. Retries are for the network, not for masking
    // a failure -- a test that only passes on retry still shows up in the report.
    retries: process.env.CI ? 2 : 0,
    // ONE worker. This drives a real deployment serving real users, not a test rig.
    // In parallel the suite was the load: scenes that render in ~2s serially missed
    // a 60s deadline at four workers and again at two, and the failures moved
    // between scenes each run -- the signature of contention, not of a broken
    // scene. A post-deploy check that stresses the thing it is checking reports on
    // the stress. Serial costs a couple of minutes and answers the actual question.
    workers: 1,
    reporter: process.env.CI ? [['list'], ['junit', { outputFile: 'live-results.xml' }]] : [['list']],
    use: {
        baseURL: process.env.LIVE_URL || 'https://insights.hanzo.ai',
        actionTimeout: 30 * 1000,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        testIdAttribute: 'data-attr',
    },
    projects: [
        { name: 'setup', testMatch: /auth\.setup\.ts/ },
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'], storageState: 'live/.auth/session.json' },
            dependencies: ['setup'],
        },
    ],
})
