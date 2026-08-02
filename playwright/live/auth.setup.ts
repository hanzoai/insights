import { expect, test as setup } from '@playwright/test'

/**
 * Sign in once for the whole run.
 *
 * Every test used to sign in for itself, which put a login in front of each of
 * forty tests and, with four workers loading a heavy SPA at once, pushed three
 * of them past the render deadline against a two-pod deployment. The session is
 * the same session either way -- there is no reason to mint it forty times.
 *
 * There is no password form to drive: /login redirects unconditionally to
 * hanzo.id, because OIDC is how people sign in here. The API accepts the e2e
 * account, and the cookie it sets is what the browser needs.
 */

const USERNAME = process.env.LOGIN_USERNAME || 'e2e@hanzo.ai'
const PASSWORD = process.env.LOGIN_PASSWORD || ''

export const STATE = 'live/.auth/session.json'

setup('sign in', async ({ request }) => {
    expect(PASSWORD, 'LOGIN_PASSWORD must be set -- in CI it comes from KMS').not.toBe('')
    const response = await request.post('/api/login', { data: { email: USERNAME, password: PASSWORD } })
    expect(response.status(), `sign-in failed for ${USERNAME}`).toBe(200)

    // Prove the session resolves to the account we meant, not just that the POST
    // returned 200 -- a redirect to a login page is also a 200.
    const me = await request.get('/api/users/@me/')
    expect(me.status()).toBe(200)
    expect((await me.json()).email).toBe(USERNAME)

    await request.storageState({ path: STATE })
})
