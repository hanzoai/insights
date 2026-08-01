import { ActivityLogItem, userNameForLogItem } from 'lib/components/ActivityLog/humanizeActivity'

import { ActivityScope } from '~/types'

describe('userNameForLogItem', () => {
    const makeLogItem = (overrides: Partial<ActivityLogItem>): ActivityLogItem => ({
        activity: 'updated',
        created_at: '2026-06-04T00:00:00Z',
        scope: ActivityScope.FEATURE_FLAG,
        detail: { merge: null, trigger: null, changes: null, name: 'my-flag' },
        ...overrides,
    })

    it.each([
        [
            'uses the full name when set',
            { user: { first_name: 'Ada', last_name: 'Lovelace', email: 'ada@hanzo.ai' } },
            'Ada Lovelace',
        ],
        [
            'falls back to email when the name is blank',
            { user: { first_name: '', last_name: '', email: 'ada@hanzo.ai' } },
            'ada@hanzo.ai',
        ],
        [
            'falls back to the placeholder when name and email are both blank',
            { user: { first_name: '', last_name: '', email: '' } },
            'A user',
        ],
        ['falls back to the placeholder when there is no user', {}, 'A user'],
        ['renders system activity as Insights', { is_system: true }, 'Insights'],
        [
            'falls back to email for impersonated actors with a blank name',
            { was_impersonated: true, user: { first_name: '', last_name: '', email: 'ada@hanzo.ai' } },
            'Insights Support (as ada@hanzo.ai)',
        ],
    ])('%s', (_name, overrides: Partial<ActivityLogItem>, expected: string) => {
        expect(userNameForLogItem(makeLogItem(overrides))).toEqual(expected)
    })
})
