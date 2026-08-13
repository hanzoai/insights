import { expect, test as setup } from '@playwright/test'

/**
 * Sign in once for the whole run, through Hanzo IAM.
 *
 * There is no password form on insights and no endpoint that trades credentials
 * for a session: `/login` redirects to `/login/oidc/`, which hands off to
 * hanzo.id, and the session cookie is set when the IdP redirects back to
 * `/complete/oidc/`. So the setup drives that round trip in a browser rather
 * than posting credentials — the credentials belong to IAM, not to this app.
 *
 * LOGIN_USERNAME/LOGIN_PASSWORD are the IAM account; in CI the password comes
 * from KMS, never from a file or a repo variable.
 */

const USERNAME = process.env.LOGIN_USERNAME || 'e2e@hanzo.ai'
const PASSWORD = process.env.LOGIN_PASSWORD || ''

export const STATE = 'live/.auth/session.json'

setup('sign in through Hanzo IAM', async ({ page }) => {
    expect(PASSWORD, 'LOGIN_PASSWORD must be set -- in CI it comes from KMS').not.toBe('')

    await page.goto('/login')

    // The handshake leaves this origin. Landing anywhere else means the SSO gate
    // refused before the IdP was ever reached (`/login?error_code=...`).
    await page.waitForURL(/hanzo\.id\//, { timeout: 30_000 })

    await page.getByLabel(/email|username/i).fill(USERNAME)
    // The field, not the reveal button beside it. hanzo.id's sign-in carries a
    // <button aria-label="Show password">, so getByLabel(/password/i) matches
    // two elements and strict mode refuses the fill:
    //   strict mode violation: getByLabel(/password/i) resolved to 2 elements
    await page.locator('input[type="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /sign in|log in|continue/i }).click()

    // Back on the app with a session, not still on the IdP and not on the error scene.
    await page.waitForURL((url) => !/hanzo\.id/.test(url.host), { timeout: 60_000 })
    expect(page.url(), 'IAM sent us back to the login error scene').not.toContain('error_code')

    // Prove the session resolves to the account we meant, rather than trusting the URL.
    const me = await page.request.get('/v1/users/@me/')
    expect(me.status()).toBe(200)
    expect((await me.json()).email).toBe(USERNAME)

    await page.context().storageState({ path: STATE })
})
