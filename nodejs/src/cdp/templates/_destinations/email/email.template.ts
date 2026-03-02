import { CustomFunctionTemplate } from '~/cdp/types'

export const template: CustomFunctionTemplate = {
    free: false,
    status: 'hidden',
    type: 'destination',
    id: 'template-email',
    name: 'Email',
    description: 'Sends an email via Insights email service',
    icon_url: '/static/insights-icon.svg',
    category: ['Custom'],
    code: `
    let res := sendEmail(inputs.email)

    if (not res.success) {
        throw Error(f'Email failed to send: {res.error}')
    }
    `,
    code_language: 'custom_script',

    inputs_schema: [
        {
            type: 'native_email',
            key: 'email',
            label: 'Email message',
            integration: 'email',
            required: true,
            default: {
                to: {
                    email: '{{ person.properties.email }}',
                    name: '',
                },
                from: {
                    email: '',
                    name: '',
                },
                replyTo: '',
                subject: '',
                preheader: '',
                text: 'Hello from Insights!',
                html: '<div>Hi {{ person.properties.name }}, this email was sent from Insights!</div>',
            },
            secret: false,
            description: 'The email message to send. Configure the recipient, sender, subject, and content.',
            templating: 'liquid',
        },
    ],
}
