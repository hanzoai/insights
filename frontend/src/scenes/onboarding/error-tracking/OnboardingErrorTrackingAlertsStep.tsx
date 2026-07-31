import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, ButtonProps, Input, Select, Table, Link } from '@hanzo/elements'

import api from 'lib/api'
import { SlackChannelPicker } from 'lib/integrations/SlackIntegrationHelpers'
import { Field } from 'lib/elements/Field'
import { InsightsFunctionIcon } from 'scenes/insights-functions/configuration/InsightsFunctionIcon'

import { IntegrationType, OnboardingStepKey } from '~/types'

import { OnboardingStep } from '../OnboardingStep'
import { OnboardingStepComponentType } from '../onboardingLogic'
import {
    ErrorTrackingAlertIntegrationType,
    onboardingErrorTrackingAlertsLogic,
} from './onboardingErrorTrackingAlertsLogic'

export const OnboardingErrorTrackingAlertsStep: OnboardingStepComponentType = () => {
    const { integration, slackIntegrations, slackAvailable, connectionConfig, isConnectionConfigSubmitting } =
        useValues(onboardingErrorTrackingAlertsLogic)
    const { setIntegration } = useActions(onboardingErrorTrackingAlertsLogic)

    const selectedSlackIntegration = (slackIntegrations || []).find((i) => i.id === connectionConfig.slackWorkspaceId)

    const dataSource = [
        {
            key: 'microsoft-teams',
            name: 'Microsoft Teams',
            icon: '/static/services/microsoft-teams.png',
            action: <ConnectButton onClick={() => setIntegration('microsoft-teams')} />,
        },
        {
            key: 'discord',
            name: 'Discord',
            icon: '/static/services/discord.png',
            action: <ConnectButton onClick={() => setIntegration('discord')} />,
        },
    ]

    if (slackAvailable) {
        dataSource.unshift({
            key: 'slack',
            name: 'Slack',
            icon: '/static/services/slack.png',
            action:
                slackIntegrations && slackIntegrations.length > 0 ? (
                    <ConnectButton onClick={() => setIntegration('slack')} />
                ) : (
                    <ConnectButton
                        to={api.integrations.authorizeUrl({
                            kind: 'slack',
                            next: '/onboarding/error_tracking?step=alerts&kind=slack_callback',
                        })}
                    />
                ),
        })
    }

    return (
        <OnboardingStep
            title="Configure alerts"
            stepKey={OnboardingStepKey.ALERTS}
            showContinue={false}
            showSkip={!integration}
        >
            <p>Get notified when a new issue occurs. Don't worry this can always be reconfigured later.</p>
            {integration === null ? (
                <Table
                    showHeader={false}
                    columns={[
                        {
                            key: 'name',
                            dataIndex: 'name',
                            render: (_, record) => {
                                return (
                                    <div className="flex gap-2 font-bold items-center">
                                        <InsightsFunctionIcon size="small" src={record.icon} />
                                        {record.name}
                                    </div>
                                )
                            },
                        },
                        {
                            key: 'actions',
                            width: 0,
                            render: (_, record) => record.action,
                        },
                    ]}
                    dataSource={dataSource}
                />
            ) : (
                <Form
                    enableFormOnSubmit
                    logic={onboardingErrorTrackingAlertsLogic}
                    formKey="connectionConfig"
                    className="flex flex-col gap-2"
                >
                    <FormFields
                        integration={integration}
                        slackIntegrations={slackIntegrations}
                        selectedSlackIntegration={selectedSlackIntegration}
                    />
                    <div className="flex justify-end gap-2">
                        <Button center type="secondary" onClick={() => setIntegration(null)}>
                            Back
                        </Button>
                        <Button type="primary" center htmlType="submit" loading={isConnectionConfigSubmitting}>
                            Next
                        </Button>
                    </div>
                </Form>
            )}
        </OnboardingStep>
    )
}

OnboardingErrorTrackingAlertsStep.stepKey = OnboardingStepKey.ALERTS

const FormFields = ({
    integration,
    slackIntegrations,
    selectedSlackIntegration,
}: {
    integration: ErrorTrackingAlertIntegrationType
    slackIntegrations?: IntegrationType[]
    selectedSlackIntegration?: IntegrationType
}): JSX.Element | null => {
    return integration === 'discord' ? (
        <Field
            name="discordWebhookUrl"
            label="Webhook URL"
            help={
                <p className="text-secondary text-xs">
                    See this page on how to generate a Webhook URL:{' '}
                    <Link to="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks">
                        https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks
                    </Link>
                </p>
            }
        >
            <Input />
        </Field>
    ) : integration === 'microsoft-teams' ? (
        <Field
            name="microsoftTeamsWebhookUrl"
            label="Webhook URL"
            help={
                <p className="text-secondary text-xs">
                    See this page on how to generate a Webhook URL:{' '}
                    <Link to="https://support.microsoft.com/en-us/office/create-incoming-webhooks-with-workflows-for-microsoft-teams-8ae491c7-0394-4861-ba59-055e33f75498">
                        https://support.microsoft.com/en-us/office/create-incoming-webhooks-with-workflows-for-microsoft-teams-8ae491c7-0394-4861-ba59-055e33f75498
                    </Link>
                </p>
            }
        >
            <Input />
        </Field>
    ) : integration === 'slack' && slackIntegrations ? (
        <>
            <Field name="slackWorkspaceId" label="Workspace">
                <Select
                    options={slackIntegrations.map((integration) => ({
                        label: integration.display_name,
                        value: integration.id,
                    }))}
                />
            </Field>
            {selectedSlackIntegration && (
                <Field name="slackChannelId" label="Channel">
                    {({ value, onChange }) => (
                        <SlackChannelPicker value={value} onChange={onChange} integration={selectedSlackIntegration} />
                    )}
                </Field>
            )}
        </>
    ) : null
}

const ConnectButton = (buttonProps: Pick<ButtonProps, 'onClick' | 'to'>): JSX.Element => (
    <Button {...buttonProps} className="py-1" fullWidth type="primary" size="small">
        Connect
    </Button>
)
