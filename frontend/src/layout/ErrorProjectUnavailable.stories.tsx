import { Meta, StoryObj } from '@storybook/react'
import { useActions } from 'kea'
import { useEffect } from 'react'

import { App } from 'scenes/App'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

import { mswDecorator, useStorybookMocks } from '~/mocks/browser'

import preflightJson from '../mocks/fixtures/_preflight.json'

const meta: Meta = {
    title: 'Scenes-App/Error Project Unavailable',
    decorators: [
        mswDecorator({
            get: {
                '/_preflight': {
                    ...preflightJson,
                    cloud: true,
                    region: 'EU',
                    realm: 'cloud',
                    can_create_org: true,
                    available_social_auth_providers: { oidc: true, saml: false },
                },
                '/v1/environments/@current/': () => [
                    403,
                    {
                        code: 'project_unavailable',
                        type: 'authentication_error',
                        detail: 'You do not have access to this project',
                    },
                ],
            },
        }),
    ],
    parameters: {
        layout: 'fullscreen',
        viewMode: 'story',
        mockDate: '2023-02-01',
        pageUrl: urls.projectRoot(),
        testOptions: {
            waitForLoadersToDisappear: true,
        },
    },
}
export default meta

type Story = StoryObj<{}>

export const AccessRevoked: Story = {
    render: () => {
        const { loadCurrentTeamSuccess } = useActions(teamLogic)

        useStorybookMocks({
            get: {
                '/v1/users/@me/': () => [
                    200,
                    {
                        email: 'test@hanzo.ai',
                        first_name: 'Test Insights',
                        organization: {
                            name: 'Test org',
                            teams: [],
                            projects: [],
                        },
                        team: {
                            id: 1,
                            name: 'Test team',
                        },
                    },
                ],
                'v1/organizations/@current/': () => [
                    200,
                    {
                        membership_level: 15,
                        name: 'Test org',
                        teams: [],
                        projects: [],
                    },
                ],
            },
        })

        useEffect(() => {
            loadCurrentTeamSuccess(null)
        }, [loadCurrentTeamSuccess])

        return <App />
    },
}

export const NoSelectableProjects: Story = {
    render: () => {
        const { loadCurrentTeamSuccess } = useActions(teamLogic)

        useStorybookMocks({
            get: {
                '/v1/users/@me/': () => [
                    200,
                    {
                        email: 'test@hanzo.ai',
                        first_name: 'Test Insights',
                        organization: {
                            name: 'Test org',
                            teams: [],
                            projects: [],
                        },
                        team: null,
                    },
                ],
                'v1/organizations/@current/': () => [
                    200,
                    {
                        membership_level: 1,
                        name: 'Test org',
                        teams: [],
                        projects: [],
                    },
                ],
            },
        })

        useEffect(() => {
            loadCurrentTeamSuccess(null)
        }, [loadCurrentTeamSuccess])

        return <App />
    },
}
