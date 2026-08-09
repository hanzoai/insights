import { expect, test } from '@playwright/test'

/**
 * The API surface a signed-in user's session actually depends on.
 *
 * smoke.spec.ts opens scenes and catches anything that breaks while a scene
 * loads. That misses endpoints no scene calls on mount -- `POST /v1/projects/:id/fn/`
 * answered 500 in production for every request because of an unbound name, and
 * no amount of scene-mounting would have found it.
 *
 * Read-only, deliberately. This runs against a real tenant with real data, so a
 * write here would leave objects behind on every release; worse, a write that
 * only passes because it fails is a test that starts creating junk the day the
 * bug is fixed. Endpoints that only break under a write are covered by unit
 * tests, not here.
 *
 * The session arrives as storageState from auth.setup.ts, so `request` is already
 * signed in.
 */

// What this build carries. A 5xx is a fault anywhere; these must also not be 404,
// because a missing route here means a product surface lost its backend.
const CARRIED = [
    '/v1/users/@me/',
    '/v1/organizations/@current/',
    '/v1/projects/1/',
    '/v1/projects/1/event_definitions/?limit=5',
    '/v1/projects/1/property_definitions/?limit=5',
    '/v1/projects/1/insights/?limit=5',
    '/v1/projects/1/dashboards/?limit=5',
    '/v1/projects/1/feature_flags/?limit=5',
    '/v1/projects/1/cohorts/?limit=5',
    '/v1/projects/1/actions/?limit=5',
    '/v1/projects/1/annotations/?limit=5',
    '/v1/projects/1/surveys/?limit=5',
    '/v1/projects/1/notebooks/?limit=5',
    '/v1/projects/1/session_recordings/?limit=3',
]

// Implemented in upstream's separately-licensed ee/ tree, which this fork does not
// ship, so they have no viewset at all. Pinned as 404 rather than left unlisted:
// if one of these starts answering 500 it means something half-wired it back, and
// if one starts answering 200 the honest-state UI in capabilities.ts is now lying.
const NOT_CARRIED = ['/v1/projects/1/experiments/', '/v1/projects/1/groups_types/']

test.describe('the API a session depends on', () => {
    for (const path of CARRIED) {
        test(`GET ${path.split('?')[0]} works`, async ({ request }) => {
            const r = await request.get(path)
            expect(r.status(), `${path} -> ${r.status()}: ${(await r.text()).slice(0, 200)}`).toBeLessThan(400)
        })
    }

    for (const path of NOT_CARRIED) {
        test(`GET ${path} is absent, not broken`, async ({ request }) => {
            // 404 is the honest answer for a feature this build does not carry.
            // A 5xx would mean it is half-present and throwing.
            expect(await request.get(path).then((r) => r.status())).toBe(404)
        })
    }
})
