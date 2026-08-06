import { Meta, StoryObj } from '@storybook/react'

import { FEATURE_FLAGS } from 'lib/constants'
import { App } from 'scenes/App'
import { urls } from 'scenes/urls'

import { mswDecorator } from '~/mocks/browser'

import type { FlakyTestListApi, GitHubSourceApi, QuarantineFileApi } from '../generated/api.schemas'

const FLAKY_TESTS: FlakyTestListApi = {
    items: [
        {
            runner: 'pytest',
            nodeid: 'insights/api/test/test_decide/TestDecide::test_flag_rollout_consistency',
            selector: 'insights/api/test/test_decide.py::TestDecide::test_flag_rollout_consistency',
            classification: 'confirmed_flake',
            same_commit_recovery_run_count: 6,
            failed_run_count: 8,
            failed_pr_count: 3,
            master_failed_run_count: 2,
            quarantined_failed_run_count: 0,
            last_signal_at: '2026-07-01T18:30:00Z',
        },
        {
            runner: 'pytest',
            nodeid: 'insights/tasks/test/test_usage_report/TestUsageReport::test_full_report',
            selector: 'insights/tasks/test/test_usage_report.py::TestUsageReport::test_full_report',
            classification: 'suspected_regression',
            same_commit_recovery_run_count: 0,
            failed_run_count: 9,
            failed_pr_count: 4,
            master_failed_run_count: 5,
            quarantined_failed_run_count: 0,
            last_signal_at: '2026-07-01T09:12:00Z',
        },
        {
            runner: 'pytest',
            nodeid: 'insights/insightsql/test/test_resolver/TestResolver::test_asterisk_expander',
            selector: 'insights/insightsql/test/test_resolver.py::TestResolver::test_asterisk_expander',
            classification: 'quarantined',
            same_commit_recovery_run_count: 0,
            failed_run_count: 1,
            failed_pr_count: 1,
            master_failed_run_count: 0,
            quarantined_failed_run_count: 3,
            last_signal_at: '2026-06-30T22:45:00Z',
        },
        {
            runner: 'pytest',
            nodeid: 'insights/temporal/tests/batch_exports/test_backfill::test_workflow_timeout',
            selector: 'insights/temporal/tests/batch_exports/test_backfill.py::test_workflow_timeout',
            classification: 'confirmed_flake',
            same_commit_recovery_run_count: 1,
            failed_run_count: 1,
            failed_pr_count: 1,
            master_failed_run_count: 0,
            quarantined_failed_run_count: 0,
            last_signal_at: '2026-06-29T14:00:00Z',
        },
    ],
    truncated: false,
    limit: 50,
}

const QUARANTINE: QuarantineFileApi = {
    available: true,
    entries: [
        {
            id: 'insights/insightsql/test/test_resolver.py::TestResolver::test_asterisk_expander',
            runner: 'pytest',
            reason: 'Nondeterministic ordering or data',
            owner: '@Insights/team-insightsql',
            issue: 'https://github.com/Insights/insights/issues/1',
            added: '2026-06-24',
            expires: '2026-07-08',
            mode: 'run',
            lifecycle: 'active',
            days_until_expiry: 6,
            selector_kind: 'test',
        },
    ],
    parse_errors: [],
    parse_warnings: [],
    repo: { provider: 'github', owner: 'Insights', name: 'insights' },
    source_url: 'https://github.com/Insights/insights/blob/HEAD/.test_quarantine.json',
    generated_at: '2026-07-02T12:00:00Z',
}

const SOURCES: GitHubSourceApi[] = [{ id: 'src-1', repo: 'Insights/insights', prefix: '' }]

const meta: Meta = {
    component: App,
    title: 'Scenes-App/Engineering Analytics/Test Health',
    parameters: {
        layout: 'fullscreen',
        viewMode: 'story',
        mockDate: '2026-07-02',
        featureFlags: [FEATURE_FLAGS.ENGINEERING_ANALYTICS],
        testOptions: {
            // A per-row quarantine button only renders once the queue has data rows.
            waitForSelector: '[data-attr="eng-analytics-flaky-quarantine"]',
        },
    },
    decorators: [
        mswDecorator({
            get: {
                'api/projects/:team_id/engineering_analytics/flaky_tests/': FLAKY_TESTS,
                'api/projects/:team_id/engineering_analytics/quarantine/': QUARANTINE,
                'api/projects/:team_id/engineering_analytics/sources/': SOURCES,
                'api/projects/:team_id/engineering_analytics/ci_cards/': {
                    open_prs: 18,
                    repos: 1,
                    stuck: 3,
                    failing_ci: 4,
                },
                'api/projects/:team_id/engineering_analytics/pull_requests/': {
                    items: [],
                    truncated: false,
                    limit: 1000,
                },
                'api/projects/:team_id/engineering_analytics/workflow_health/': [],
            },
        }),
    ],
}
export default meta

type Story = StoryObj<typeof meta>

export const FlakyTestLeaderboard: Story = {
    render: () => <App />,
    parameters: { pageUrl: urls.engineeringAnalyticsTestHealth() },
}
