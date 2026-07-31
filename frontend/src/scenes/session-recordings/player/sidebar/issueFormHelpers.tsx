import { Dialog, Input, TextArea } from '@hanzo/elements'

import { GitHubRepositorySelectField } from 'lib/integrations/GitHubIntegrationHelpers'
import { JiraProjectSelectField } from 'lib/integrations/JiraIntegrationHelpers'
import { LinearTeamSelectField } from 'lib/integrations/LinearIntegrationHelpers'
import { Field } from 'lib/elements/Field'

import { IntegrationType } from '~/types'

type IssueConfig = Record<string, string>

export const createLinearIssueForm = (
    sessionRecordingId: string,
    integration: IntegrationType,
    onSubmit: (integrationId: number, config: IssueConfig) => void
): void => {
    Dialog.openForm({
        title: 'Create Linear issue',
        shouldAwaitSubmit: true,
        initialValues: {
            title: `Issue from Session Replay ${sessionRecordingId.slice(0, 8)}`,
            description: '',
            integrationId: integration.id,
            teamIds: [],
        },
        content: (
            <div className="flex flex-col gap-y-2">
                <LinearTeamSelectField integrationId={integration.id} />
                <Field name="title" label="Title">
                    <Input data-attr="linear-issue-title" placeholder="Issue title" size="small" />
                </Field>
                <Field name="description" label="Description">
                    <TextArea data-attr="linear-issue-description" placeholder="Start typing..." />
                </Field>
            </div>
        ),
        errors: {
            title: (title) => (!title ? 'You must enter a title' : undefined),
            teamIds: (teamIds) => (!teamIds || teamIds.length === 0 ? 'You must choose a team' : undefined),
        },
        onSubmit: ({ title, description, teamIds }) => {
            onSubmit(integration.id, { team_id: teamIds[0], title, description })
        },
    })
}

export const createGitHubIssueForm = (
    sessionRecordingId: string,
    integration: IntegrationType,
    onSubmit: (integrationId: number, config: IssueConfig) => void
): void => {
    Dialog.openForm({
        title: 'Create GitHub issue',
        shouldAwaitSubmit: true,
        initialValues: {
            title: `Issue from Session Replay ${sessionRecordingId.slice(0, 8)}`,
            body: '',
            integrationId: integration.id,
            repositories: [],
        },
        content: (
            <div className="flex flex-col gap-y-2">
                <GitHubRepositorySelectField integrationId={integration.id} />
                <Field name="title" label="Title">
                    <Input data-attr="github-issue-title" placeholder="Issue title" size="small" />
                </Field>
                <Field name="body" label="Body">
                    <TextArea data-attr="github-issue-body" placeholder="Start typing..." />
                </Field>
            </div>
        ),
        errors: {
            title: (title) => (!title ? 'You must enter a title' : undefined),
            repositories: (repositories) =>
                !repositories || repositories.length === 0 ? 'You must choose a repository' : undefined,
        },
        onSubmit: ({ title, body, repositories }) => {
            onSubmit(integration.id, { repository: repositories[0], title, body })
        },
    })
}

export const createGitLabIssueForm = (
    sessionRecordingId: string,
    integration: IntegrationType,
    onSubmit: (integrationId: number, config: IssueConfig) => void
): void => {
    Dialog.openForm({
        title: 'Create GitLab issue',
        shouldAwaitSubmit: true,
        initialValues: {
            title: `Issue from Session Replay ${sessionRecordingId.slice(0, 8)}`,
            body: '',
            integrationId: integration.id,
        },
        content: (
            <div className="flex flex-col gap-y-2">
                <Field name="title" label="Title">
                    <Input data-attr="gitlab-issue-title" placeholder="Issue title" size="small" />
                </Field>
                <Field name="body" label="Body">
                    <TextArea data-attr="gitlab-issue-body" placeholder="Start typing..." />
                </Field>
            </div>
        ),
        errors: {
            title: (title) => (!title ? 'You must enter a title' : undefined),
        },
        onSubmit: ({ title, body }) => {
            onSubmit(integration.id, { title, body })
        },
    })
}

export const createJiraIssueForm = (
    sessionRecordingId: string,
    integration: IntegrationType,
    onSubmit: (integrationId: number, config: IssueConfig) => void
): void => {
    Dialog.openForm({
        title: 'Create Jira issue',
        shouldAwaitSubmit: true,
        initialValues: {
            title: `Issue from Session Replay ${sessionRecordingId.slice(0, 8)}`,
            description: '',
            integrationId: integration.id,
            projectKeys: [],
        },
        content: (
            <div className="flex flex-col gap-y-2">
                <JiraProjectSelectField integrationId={integration.id} />
                <Field name="title" label="Summary">
                    <Input data-attr="jira-issue-title" placeholder="Issue summary" size="small" />
                </Field>
                <Field name="description" label="Description">
                    <TextArea data-attr="jira-issue-description" placeholder="Start typing..." />
                </Field>
            </div>
        ),
        errors: {
            title: (title) => (!title ? 'You must enter a summary' : undefined),
            projectKeys: (projectKeys) =>
                !projectKeys || projectKeys.length === 0 ? 'You must choose a project' : undefined,
        },
        onSubmit: ({ title, description, projectKeys }) => {
            onSubmit(integration.id, { project_key: projectKeys[0], title, description })
        },
    })
}
