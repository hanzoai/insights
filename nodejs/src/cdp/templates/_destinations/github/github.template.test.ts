import { parseJSON } from '../../../../common/utils/json-parse'
import { TemplateTester } from '../../test/test-helpers'
import { template } from './github.template'

describe('github template', () => {
    const tester = new TemplateTester(template)

    beforeEach(async () => {
        await tester.beforeEach()
    })

    const baseInputs = {
        github_installation: { access_token: 'token', account: { name: 'Insights' } },
        repository: 'insights',
        title: 'TypeError',
        description: 'Something broke',
        insights_issue_id: 'issue-uuid',
    }

    it.each<[string, string | undefined, string]>([
        [
            'links via the fingerprint URL when insights_issue_url is provided',
            'https://us.hanzo.ai/project/1/error_tracking/fingerprint/fp%2F1',
            'https://us.hanzo.ai/project/1/error_tracking/fingerprint/fp%2F1',
        ],
        [
            'falls back to the issue-id URL for functions without insights_issue_url',
            undefined,
            '/error_tracking/issue-uuid',
        ],
    ])('%s', async (_name, insightsIssueUrl, expectedLinkPart) => {
        const response = await tester.invoke({ ...baseInputs, insights_issue_url: insightsIssueUrl })

        expect(response.error).toBeUndefined()
        const body = parseJSON((response.invocation.queueParameters as any).body)
        expect(body.body).toContain(`[View in Insights](`)
        expect(body.body).toContain(expectedLinkPart)
    })
})
