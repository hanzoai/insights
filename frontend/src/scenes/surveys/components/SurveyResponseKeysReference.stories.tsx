import { Meta, StoryObj } from '@storybook/react'

import { App } from 'scenes/App'
import { urls } from 'scenes/urls'

import { mswDecorator } from '~/mocks/browser'
import { PropertyFilterType, PropertyOperator, SurveyEventName, SurveyQuestionType } from '~/types'

const MOCK_SURVEY_ID = '019b0000-0000-0000-0000-000000000001'

const MOCK_SURVEY = {
    id: MOCK_SURVEY_ID,
    name: 'Product feedback survey',
    type: 'popover',
    questions: [
        {
            type: SurveyQuestionType.Rating,
            question: 'How likely are you to recommend us to a friend?',
            id: 'q-rating-1',
            display: 'number',
            scale: 10,
            lowerBoundLabel: 'Not likely',
            upperBoundLabel: 'Very likely',
        },
        {
            type: SurveyQuestionType.SingleChoice,
            question: 'What feature do you use the most?',
            id: 'q-single-1',
            choices: ['Dashboards', 'Insights', 'Experiments', 'Surveys'],
        },
        {
            type: SurveyQuestionType.Open,
            question: 'What could we improve?',
            id: 'q-open-1',
        },
        {
            type: SurveyQuestionType.Link,
            question: 'Visit our changelog',
            id: 'q-link-1',
            link: 'https://hanzo.ai/changelog',
        },
    ],
    created_at: '2024-01-01T00:00:00Z',
    start_date: '2024-01-01T00:00:00Z',
}

const surveyResponseFilters = {
    events: [
        {
            id: SurveyEventName.SENT,
            type: 'events',
            properties: [
                {
                    key: '$survey_response',
                    type: PropertyFilterType.Event,
                    value: 'is_set',
                    operator: PropertyOperator.IsSet,
                },
                {
                    key: '$survey_id',
                    type: PropertyFilterType.Event,
                    value: MOCK_SURVEY_ID,
                    operator: PropertyOperator.Exact,
                },
            ],
        },
    ],
}

function makeMockInsightsFunction(id: string, overrides: Record<string, unknown>): Record<string, unknown> {
    return {
        id,
        type: 'destination',
        kind: null,
        enabled: true,
        deleted: false,
        script: '',
        bytecode: [],
        inputs_schema: [],
        inputs: {},
        filters: surveyResponseFilters,
        icon_url: null,
        status: { state: 0, ratings: [], states: [] },
        created_at: '2024-01-01T00:00:00Z',
        created_by: {
            id: 1,
            uuid: 'user-001',
            distinct_id: 'user-001',
            first_name: 'Test',
            last_name: '',
            email: 'test@hanzo.ai',
            is_email_verified: true,
        },
        updated_at: '2024-01-15T00:00:00Z',
        configuration: {},
        ...overrides,
    }
}

const SLACK_ID = '019b0000-slack-0000-0000-000000000001'
const SLACK_FUNCTION = makeMockInsightsFunction(SLACK_ID, {
    name: 'Post to Slack on survey response',
    description: 'Posts a message to Slack when a user responds to a survey',
    template: { id: 'template-slack', name: 'Slack' },
    inputs_schema: [
        {
            key: 'slack_workspace',
            type: 'integration',
            label: 'Slack workspace',
            secret: false,
            required: true,
            integration: 'slack',
        },
        {
            key: 'channel',
            type: 'integration_field',
            label: 'Channel',
            secret: false,
            required: true,
            integration_field: { integration: 'slack', key: 'slack_channel' },
        },
        { key: 'blocks', type: 'json', label: 'Blocks', secret: false, required: false },
        { key: 'text', type: 'string', label: 'Text', secret: false, required: false },
    ],
    inputs: {
        blocks: {
            value: [
                {
                    text: {
                        text: '*{person.name}* responded to survey *{event.properties.$survey_name}*',
                        type: 'mrkdwn',
                    },
                    type: 'section',
                },
            ],
        },
        text: { value: '*{person.name}* responded to survey *{event.properties.$survey_name}*' },
    },
})

const WEBHOOK_ID = '019b0000-hook-0000-0000-000000000001'
const WEBHOOK_FUNCTION = makeMockInsightsFunction(WEBHOOK_ID, {
    name: 'HTTP Webhook on survey response',
    description: 'Send a webhook when a survey response is submitted',
    template: { id: 'template-webhook', name: 'HTTP Webhook' },
    inputs_schema: [
        { key: 'url', type: 'string', label: 'Webhook URL', secret: false, required: true },
        { key: 'method', type: 'choice', label: 'Method', secret: false, required: false, default: 'POST' },
        { key: 'headers', type: 'dictionary', label: 'Headers', secret: false, required: false },
        { key: 'body', type: 'json', label: 'Body', secret: false, required: false },
    ],
    inputs: {
        url: { value: 'https://example.com/webhook' },
        method: { value: 'POST' },
    },
})

const DISCORD_ID = '019b0000-disc-0000-0000-000000000001'
const DISCORD_FUNCTION = makeMockInsightsFunction(DISCORD_ID, {
    name: 'Post to Discord on survey response',
    description: 'Posts a message to Discord when a user responds to a survey',
    template: { id: 'template-discord', name: 'Discord' },
    inputs_schema: [
        { key: 'url', type: 'string', label: 'Discord webhook URL', secret: false, required: true },
        { key: 'content', type: 'string', label: 'Content', secret: false, required: false },
    ],
    inputs: {
        url: { value: 'https://discord.com/api/webhooks/123/abc' },
        content: { value: '**{person.name}** responded to survey **{event.properties.$survey_name}**' },
    },
})

const TEAMS_ID = '019b0000-team-0000-0000-000000000001'
const TEAMS_FUNCTION = makeMockInsightsFunction(TEAMS_ID, {
    name: 'Post to Microsoft Teams on survey response',
    description: 'Posts a message to Microsoft Teams when a user responds to a survey',
    template: { id: 'template-microsoft-teams', name: 'Microsoft Teams' },
    inputs_schema: [
        { key: 'url', type: 'string', label: 'Teams webhook URL', secret: false, required: true },
        { key: 'text', type: 'string', label: 'Text', secret: false, required: false },
    ],
    inputs: {
        url: { value: 'https://outlook.office.com/webhook/123' },
        text: { value: '**{person.name}** responded to survey **{event.properties.$survey_name}**' },
    },
})

function makeMocks(
    insightsFunctionId: string,
    insightsFunction: Record<string, unknown>
): Record<string, Record<string, unknown>> {
    return {
        get: {
            [`/api/environments/:team_id/insights_functions/${insightsFunctionId}/`]: insightsFunction,
            '/api/environments/:team_id/insights_functions/': { count: 1, results: [insightsFunction], next: null },
            [`/api/projects/:team_id/surveys/${MOCK_SURVEY_ID}/`]: MOCK_SURVEY,
        },
    }
}

const meta: Meta = {
    component: App,
    title: 'Scenes-App/Surveys/SurveyResponseKeysReference',
    parameters: {
        layout: 'fullscreen',
        viewMode: 'story',
        mockDate: '2024-01-15',
    },
}
export default meta

type Story = StoryObj<{}>

export const Slack: Story = {
    parameters: { pageUrl: urls.insightsFunction(SLACK_ID) },
    decorators: [mswDecorator(makeMocks(SLACK_ID, SLACK_FUNCTION))],
}

export const Webhook: Story = {
    parameters: { pageUrl: urls.insightsFunction(WEBHOOK_ID) },
    decorators: [mswDecorator(makeMocks(WEBHOOK_ID, WEBHOOK_FUNCTION))],
}

export const Discord: Story = {
    parameters: { pageUrl: urls.insightsFunction(DISCORD_ID) },
    decorators: [mswDecorator(makeMocks(DISCORD_ID, DISCORD_FUNCTION))],
}

export const MicrosoftTeams: Story = {
    parameters: { pageUrl: urls.insightsFunction(TEAMS_ID) },
    decorators: [mswDecorator(makeMocks(TEAMS_ID, TEAMS_FUNCTION))],
}
