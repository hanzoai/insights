import { DateTime } from 'luxon'

import { TemplateTester } from '../../test/test-helpers'
import { template } from './email.template'

describe('email template', () => {
    const tester = new TemplateTester(template)

    beforeEach(async () => {
        await tester.beforeEach()
        const fixedTime = DateTime.fromISO('2025-01-01T00:00:00Z').toJSDate()
        jest.spyOn(Date, 'now').mockReturnValue(fixedTime.getTime())
    })

    it('should invoke the function', async () => {
        const response = await tester.invoke(
            {
                email: {
                    to: {
                        email: '{{ person.properties.email }}',
                        name: '{{ person.name }}',
                    },
                    from: {
                        integrationId: 1,
                        email: 'test@hanzo.ai',
                        name: 'Test User',
                    },
                    subject: 'Insights Notification',
                    text: '',
                    html: '',
                },
                debug: false,
            },
            {
                event: {
                    properties: {
                        $lib_version: '1.0.0',
                    },
                },
            }
        )

        expect(response.error).toBeUndefined()
        expect(response.finished).toEqual(false)
        expect(response.invocation.queueParameters).toMatchInlineSnapshot(`
            {
              "from": {
                "email": "test@hanzo.ai",
                "integrationId": 1,
                "name": "Test User",
              },
              "html": "",
              "subject": "Insights Notification",
              "text": "",
              "to": {
                "email": "example@hanzo.ai",
                "name": "person-name",
              },
              "type": "email",
            }
        `)
    })
})
