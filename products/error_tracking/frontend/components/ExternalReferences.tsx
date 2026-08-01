import { useActions, useValues } from 'kea'
import insights from 'insights-js'

import { IconPlus } from '@hanzo/icons'
import { Dialog, Input, TextArea, Link } from '@hanzo/elements'

import { ErrorTrackingFingerprint } from 'lib/components/Errors/types'
import { GitHubRepositorySelectField } from 'lib/integrations/GitHubIntegrationHelpers'
import { integrationsLogic } from 'lib/integrations/integrationsLogic'
import { JiraProjectSelectField } from 'lib/integrations/JiraIntegrationHelpers'
import { LinearTeamSelectField } from 'lib/integrations/LinearIntegrationHelpers'
import { ICONS } from 'lib/integrations/utils'
import { Field } from 'lib/elements/Field'
import { ButtonPrimitive } from 'lib/ui/Button/ButtonPrimitives'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from 'lib/ui/DropdownMenu/DropdownMenu'
import { WrappingLoadingSkeleton } from 'lib/ui/WrappingLoadingSkeleton/WrappingLoadingSkeleton'
import { addProjectIdIfMissing } from 'lib/utils/kea-router'
import { urls } from 'scenes/urls'

import { ErrorTrackingExternalReference, ErrorTrackingRelationalIssue } from '~/queries/schema/schema-general'
import { IntegrationKind, IntegrationType } from '~/types'

import { errorTrackingIssueSceneLogic } from '../scenes/ErrorTrackingIssueScene/errorTrackingIssueSceneLogic'

const ERROR_TRACKING_INTEGRATIONS = ['linear', 'github', 'gitlab', 'jira'] as const satisfies readonly IntegrationKind[]

type onSubmitFormType = (integrationId: number, config: Record<string, string>) => void
type ErrorTrackingIntegrationKind = (typeof ERROR_TRACKING_INTEGRATIONS)[number]
type ErrorTrackingIntegration = IntegrationType & { kind: ErrorTrackingIntegrationKind }

const POSTFN_HTML_LINE_BREAKS = '\n<br/>\n<br/>\n'

const EXTERNAL_REFERENCE_FORM_BUILDERS: Record<
    ErrorTrackingIntegrationKind,
    (
        issue: ErrorTrackingRelationalIssue,
        issueUrl: string,
        integration: ErrorTrackingIntegration,
        onSubmit: onSubmitFormType
    ) => void
> = {
    github: createGitHubIssueForm,
    gitlab: createGitLabIssueForm,
    linear: createLinearIssueForm,
    jira: createJiraIssueForm,
}

export const ExternalReferences = (): JSX.Element | null => {
    const { issue, issueLoading, issueFingerprints } = useValues(errorTrackingIssueSceneLogic)
    const { createExternalReference } = useActions(errorTrackingIssueSceneLogic)
    const { getIntegrationsByKind, integrationsLoading } = useValues(integrationsLogic)

    if (!issue || integrationsLoading) {
        return (
            <WrappingLoadingSkeleton fullWidth>
                <ButtonPrimitive menuItem aria-hidden>
                    Loading
                </ButtonPrimitive>
            </WrappingLoadingSkeleton>
        )
    }

    const errorTrackingIntegrations = getIntegrationsByKind([...ERROR_TRACKING_INTEGRATIONS])
    const externalReferences = issue.external_issues ?? []
    const creatingIssue = issue && issueLoading

    const onClickCreateIssue = (integration: IntegrationType): void => {
        const buildForm = EXTERNAL_REFERENCE_FORM_BUILDERS[integration.kind as ErrorTrackingIntegrationKind]

        if (buildForm) {
            buildForm(
                issue,
                getIssueUrl(issueFingerprints),
                integration as ErrorTrackingIntegration,
                createExternalReference
            )
        }
    }

    return (
        <div>
            {externalReferences.map((reference: ErrorTrackingExternalReference) => (
                <Link
                    key={reference.id}
                    to={reference.external_url}
                    target="_blank"
                    onClick={() => {
                        insights.capture('error_tracking_external_issue_clicked', {
                            issue_id: issue.id,
                            integration_kind: reference.integration.kind,
                        })
                    }}
                >
                    <ButtonPrimitive fullWidth disabled={issueLoading}>
                        <IntegrationIcon kind={reference.integration.kind} />
                        {reference.integration.display_name}
                    </ButtonPrimitive>
                </Link>
            ))}
            {errorTrackingIntegrations.length === 0 ? (
                <SetupIntegrationsButton />
            ) : errorTrackingIntegrations.length > 1 ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <ButtonPrimitive fullWidth disabled={creatingIssue}>
                            <IconPlus />
                            {creatingIssue ? 'Creating issue...' : 'Create issue'}
                        </ButtonPrimitive>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent loop matchTriggerWidth>
                        <DropdownMenuGroup>
                            {errorTrackingIntegrations.map((integration: IntegrationType) => (
                                <DropdownMenuItem key={integration.id} asChild>
                                    <ButtonPrimitive menuItem onClick={() => onClickCreateIssue(integration)}>
                                        <IntegrationIcon kind={integration.kind} />
                                        {integration.display_name}
                                    </ButtonPrimitive>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <ButtonPrimitive
                    fullWidth
                    onClick={() => onClickCreateIssue(errorTrackingIntegrations[0])}
                    disabled={issueLoading}
                >
                    <IntegrationIcon kind={errorTrackingIntegrations[0].kind} />
                    {creatingIssue ? 'Creating issue...' : 'Create issue'}
                </ButtonPrimitive>
            )}
        </div>
    )
}

function SetupIntegrationsButton(): JSX.Element {
    return (
        <Link
            to={urls.settings('environment-error-tracking', 'error-tracking-integrations')}
            buttonProps={{ variant: 'panel', fullWidth: true, menuItem: true }}
            tooltip="Go to integrations configuration"
            target="_blank"
        >
            Set up integrations
        </Link>
    )
}

// Link through the fingerprint redirect page when possible — it resolves to whatever issue the
// fingerprint belongs to at click time, so external issue links survive merges. Fingerprints are
// listed oldest-first; the oldest one is the stable, canonical one for an issue.
function getIssueUrl(fingerprints: ErrorTrackingFingerprint[]): string {
    const canonicalFingerprint = fingerprints[0]?.fingerprint
    if (canonicalFingerprint) {
        return `${window.location.origin}${addProjectIdIfMissing(urls.errorTrackingFingerprint(canonicalFingerprint))}`
    }
    return `${window.location.origin}${window.location.pathname}`
}

function getIssueMarkdownBody(issue: ErrorTrackingRelationalIssue, issueUrl: string): string {
    return `${issue.description ?? ''}${POSTFN_HTML_LINE_BREAKS}**Insights issue:** ${issueUrl}`
}

function getIssuePlaintextBody(issue: ErrorTrackingRelationalIssue, issueUrl: string): string {
    return `${issue.description ?? ''}\n\nInsights issue: ${issueUrl}`
}

function createGitHubIssueForm(
    issue: ErrorTrackingRelationalIssue,
    issueUrl: string,
    integration: ErrorTrackingIntegration,
    onSubmit: onSubmitFormType
): void {
    Dialog.openForm({
        title: 'Create GitHub issue',
        shouldAwaitSubmit: true,
        initialValues: {
            title: issue.name,
            body: getIssueMarkdownBody(issue, issueUrl),
            integrationId: integration.id,
            repositories: [],
        },
        content: (
            <div className="flex flex-col gap-y-2">
                <GitHubRepositorySelectField integrationId={integration.id} />
                <Field name="title" label="Title">
                    <Input data-attr="issue-title" placeholder="Issue title" size="small" />
                </Field>
                <Field name="body" label="Body">
                    <TextArea data-attr="issue-body" placeholder="Start typing..." />
                </Field>
            </div>
        ),
        errors: {
            title: (title) => (!title ? 'You must enter a title' : undefined),
            repositories: (repositories) =>
                repositories && repositories.length === 0 ? 'You must choose a repository' : undefined,
        },
        onSubmit: ({ title, body, repositories }) => {
            onSubmit(integration.id, { repository: repositories[0], title, body })
        },
    })
}

function createGitLabIssueForm(
    issue: ErrorTrackingRelationalIssue,
    issueUrl: string,
    integration: ErrorTrackingIntegration,
    onSubmit: onSubmitFormType
): void {
    Dialog.openForm({
        title: 'Create GitLab issue',
        shouldAwaitSubmit: true,
        initialValues: {
            title: issue.name,
            body: getIssueMarkdownBody(issue, issueUrl),
            integrationId: integration.id,
        },
        content: (
            <div className="flex flex-col gap-y-2">
                <Field name="title" label="Title">
                    <Input data-attr="issue-title" placeholder="Issue title" size="small" />
                </Field>
                <Field name="body" label="Body">
                    <TextArea data-attr="issue-body" placeholder="Start typing..." />
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

function createLinearIssueForm(
    issue: ErrorTrackingRelationalIssue,
    _issueUrl: string,
    integration: ErrorTrackingIntegration,
    onSubmit: onSubmitFormType
): void {
    Dialog.openForm({
        title: 'Create Linear issue',
        shouldAwaitSubmit: true,
        initialValues: {
            title: issue.name,
            description: issue.description,
            integrationId: integration.id,
            teamIds: [],
        },
        content: (
            <div className="flex flex-col gap-y-2">
                <LinearTeamSelectField integrationId={integration.id} />
                <Field name="title" label="Title">
                    <Input data-attr="issue-title" placeholder="Issue title" size="small" />
                </Field>
                <Field name="description" label="Description">
                    <TextArea data-attr="issue-description" placeholder="Start typing..." />
                </Field>
            </div>
        ),
        errors: {
            title: (title) => (!title ? 'You must enter a title' : undefined),
            teamIds: (teamIds) => (teamIds && teamIds.length === 0 ? 'You must choose a team' : undefined),
        },
        onSubmit: ({ title, description, teamIds }) => {
            onSubmit(integration.id, { team_id: teamIds[0], title, description })
        },
    })
}

function createJiraIssueForm(
    issue: ErrorTrackingRelationalIssue,
    issueUrl: string,
    integration: ErrorTrackingIntegration,
    onSubmit: onSubmitFormType
): void {
    Dialog.openForm({
        title: 'Create Jira issue',
        shouldAwaitSubmit: true,
        initialValues: {
            title: issue.name,
            description: getIssuePlaintextBody(issue, issueUrl),
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
                projectKeys && projectKeys.length === 0 ? 'You must choose a project' : undefined,
        },
        onSubmit: ({ title, description, projectKeys }) => {
            onSubmit(integration.id, { project_key: projectKeys[0], title, description })
        },
    })
}

const IntegrationIcon = ({ kind }: { kind: IntegrationKind }): JSX.Element => {
    return <img src={ICONS[kind]} className="w-5 h-5 rounded-sm" />
}
