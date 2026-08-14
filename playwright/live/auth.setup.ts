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
 *
 * Everything below the fill is about ONE property: when this fails, the run
 * should say why. It is the gate for the other 41 tests, so a setup that dies
 * without a reason reports "1 failed, 41 did not run" and names no cause.
 */

const USERNAME = process.env.LOGIN_USERNAME || 'e2e@hanzo.ai'
const PASSWORD = process.env.LOGIN_PASSWORD || ''

export const STATE = 'live/.auth/session.json'

/** The IdP's answer to a sign-in attempt: `{status, msg}`, error or not. */
type IdpAnswer = { status?: string; msg?: string }

setup('sign in through Hanzo IAM', async ({ page }) => {
    expect(PASSWORD, 'LOGIN_PASSWORD must be set -- in CI it comes from KMS').not.toBe('')

    await page.goto('/login')

    // The handshake leaves this origin. Landing anywhere else means the SSO gate
    // refused before the IdP was ever reached (`/login?error_code=...`).
    await page.waitForURL(/hanzo\.id\//, { timeout: 30_000 })

    // hanzo.id renders its sign-in from the application config it fetches after
    // the document loads, so the form exists before the page is ready to be
    // filled. Wait for the control that submits it, not for the inputs.
    //
    // The submit button is addressed by TYPE. The four federated choices beside
    // it (Google, GitHub, Wallet, Phone) are all `type="button"` and all read
    // "Continue with ...", so a by-name lookup for /sign in|log in|continue/i
    // resolves to five elements and strict mode refuses the click. Type is the
    // property that distinguishes them and does not change when a provider is
    // added or renamed.
    const submit = page.locator('button[type="submit"]')
    await submit.waitFor({ state: 'visible', timeout: 60_000 })
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})

    const username = page.getByLabel(/email|username/i)
    // The field, not the reveal button beside it. hanzo.id's sign-in carries a
    // <button aria-label="Show password">, so getByLabel(/password/i) matches
    // two elements and strict mode refuses the fill:
    //   strict mode violation: getByLabel(/password/i) resolved to 2 elements
    const password = page.locator('input[type="password"]')

    // Fill, then read back. The form is controlled by the IdP's own state, and a
    // render that lands between the fill and the click resets both inputs — the
    // submit then carries nothing and IAM answers "organization, username and
    // password are required", which is a true statement about an empty form and
    // says nothing about the account. Reading the values back is the only way to
    // know the form holds what we typed at the moment we submit it.
    for (let attempt = 1; ; attempt++) {
        await username.fill(USERNAME)
        await password.fill(PASSWORD)
        await page.waitForTimeout(1_500)
        if ((await username.inputValue()) === USERNAME && (await password.inputValue()) !== '') {
            break
        }
        expect(attempt, 'the hanzo.id sign-in form kept resetting; it never held the credentials long enough to submit').toBeLessThan(3)
    }

    // Subscribe BEFORE the click: this is the IdP's verdict, and it is the only
    // place the reason for a refusal is stated. Without it a rejected sign-in is
    // indistinguishable from a slow one — the page simply stays put and the wait
    // below burns its full timeout.
    const verdict = page
        .waitForResponse((r) => r.request().method() === 'POST' && /\/v1\/iam\/login(\?|$)/.test(r.url()), {
            timeout: 60_000,
        })
        .then(async (r): Promise<IdpAnswer> => ((await r.json().catch(() => ({}))) as IdpAnswer))
        .catch((): IdpAnswer => ({}))

    await submit.click()

    // Only an explicit error is treated as one. An unrecognised shape falls
    // through to the navigation wait, so this can name a failure but never
    // invent one.
    const answer = await verdict
    expect(answer.status, `hanzo.id refused the sign-in for ${USERNAME}: ${answer.msg ?? 'no reason given'}`).not.toBe(
        'error'
    )

    // Back on the app with a session, not still on the IdP and not on the error scene.
    await page.waitForURL((url) => !/hanzo\.id/.test(url.host), { timeout: 60_000 })
    expect(page.url(), 'IAM sent us back to the login error scene').not.toContain('error_code')

    // Prove the session resolves to the account we meant, rather than trusting the URL.
    const me = await page.request.get('/v1/users/@me/')
    expect(me.status()).toBe(200)
    expect((await me.json()).email).toBe(USERNAME)

    await page.context().storageState({ path: STATE })
})
