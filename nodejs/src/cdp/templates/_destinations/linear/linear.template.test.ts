import { TemplateTester } from '../../test/test-helpers'
import { template } from './linear.template'

describe('linear template', () => {
    const tester = new TemplateTester(template)

    beforeEach(async () => {
        await tester.beforeEach()
    })

    const baseInputs = {
        linear_workspace: { access_token: 'token' },
        team: 'linear-team-id',
        title: 'TypeError',
        description: 'Something broke',
        insights_issue_id: 'issue-uuid',
    }

    it.each<[string, string | undefined, string]>([
        [
            'attaches the fingerprint URL when insights_issue_url is provided',
            'https://us.hanzo.ai/project/1/error_tracking/fingerprint/fp%2F1',
            'https://us.hanzo.ai/project/1/error_tracking/fingerprint/fp%2F1',
        ],
        [
            'falls back to the issue-id URL for functions without insights_issue_url',
            undefined,
            '/error_tracking/issue-uuid',
        ],
    ])('%s', async (_name, insightsIssueUrl, expectedLinkPart) => {
        const createResponse = await tester.invoke({ ...baseInputs, insights_issue_url: insightsIssueUrl })
        expect(createResponse.error).toBeUndefined()

        const attachmentResponse = await tester.invokeFetchResponse(createResponse.invocation, {
            status: 200,
            body: { data: { issueCreate: { success: true, issue: { identifier: 'LIN-1' } } } },
        })

        expect(attachmentResponse.error).toBeUndefined()
        const attachmentBody = (attachmentResponse.invocation.queueParameters as any).body
        expect(attachmentBody).toContain('attachmentCreate')
        expect(attachmentBody).toContain(expectedLinkPart)
    })
})
