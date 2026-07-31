import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { router } from 'kea-router'
import insights from '@hanzo/insights'

import { IconCopy } from '@hanzo/icons'
import { Button, Checkbox, Input, TextArea } from '@hanzo/elements'

import { SharingModalContent } from 'lib/components/Sharing/SharingModal'
import { integrationsLogic } from 'lib/integrations/integrationsLogic'
import { Banner } from 'lib/elements/Banner'
import { Collapse } from 'lib/elements/Collapse'
import { Dialog } from 'lib/elements/Dialog'
import { Field } from 'lib/elements/Field'
import { copyToClipboard } from 'lib/utils/copyToClipboard'
import { urls } from 'scenes/urls'

import { SessionRecordingSidebarTab } from '~/types'

import { playerSidebarLogic } from '../sidebar/playerSidebarLogic'
import { PlayerShareLogicProps, playerShareLogic } from './playerShareLogic'

function TimestampForm(props: PlayerShareLogicProps): JSX.Element {
    const logic = playerShareLogic(props)

    const { privateLinkForm } = useValues(logic)
    const { setPrivateLinkFormValue } = useActions(logic)

    return (
        <Form logic={playerShareLogic} props={props} formKey="privateLinkForm">
            <div className="flex gap-2 items-center">
                <Field name="includeTime">
                    <Checkbox label="Start at" checked={privateLinkForm.includeTime} />
                </Field>
                <Field name="time" inline>
                    <Input
                        className={clsx('w-20', { 'opacity-50': !privateLinkForm.includeTime })}
                        placeholder="00:00"
                        onFocus={() => setPrivateLinkFormValue('includeTime', true)}
                        fullWidth={false}
                        size="small"
                    />
                </Field>
            </div>
        </Form>
    )
}

function PublicLink(props: PlayerShareLogicProps): JSX.Element {
    const logic = playerShareLogic(props)

    const { privateLinkUrlQueryParams } = useValues(logic)

    return (
        <>
            <p>
                You can share or embed the recording outside of Insights. Be aware that all the content of the recording
                will be accessible to anyone with the link.
            </p>

            <SharingModalContent
                recordingId={props.id}
                previewIframe
                additionalParams={privateLinkUrlQueryParams}
                recordingLinkTimeForm={<TimestampForm {...props} />}
            />
        </>
    )
}

function PrivateLink(props: PlayerShareLogicProps): JSX.Element {
    const logic = playerShareLogic(props)

    const { privateLinkUrl, privateLinkFormHasErrors } = useValues(logic)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <div>
                    <b>Click the button below</b> to copy a direct link to this recording.
                </div>
                <div>Make sure the person you share it with has access to this Insights project.</div>
            </div>
            <Button
                type="secondary"
                fullWidth
                center
                sideIcon={<IconCopy />}
                onClick={() =>
                    void copyToClipboard(privateLinkUrl, privateLinkUrl).catch((e) => insights.captureException(e))
                }
                title={privateLinkUrl}
                disabledReason={privateLinkFormHasErrors ? 'Fix all errors before continuing' : undefined}
            >
                <span className="break-all">{privateLinkUrl}</span>
            </Button>
            <TimestampForm {...props} />
        </div>
    )
}

function IntegrationNudgeBanner({
    kind,
    onCloseDialog,
}: {
    kind: 'linear' | 'github'
    onCloseDialog?: () => void
}): JSX.Element | null {
    const { getIntegrationsByKind, integrationsLoading } = useValues(integrationsLogic)
    const { setTab } = useActions(playerSidebarLogic)

    if (integrationsLoading) {
        return null
    }

    const hasIntegration = getIntegrationsByKind([kind]).length > 0
    const displayName = kind === 'linear' ? 'Linear' : 'GitHub'

    if (hasIntegration) {
        return (
            <Banner
                type="info"
                dismissKey={`share-integration-nudge-${kind}-configured`}
                action={{
                    children: <span className="w-full text-center">Use linked issues</span>,
                    onClick: () => {
                        insights.capture('session_replay_share_integration_nudge_clicked', {
                            kind,
                            has_integration: true,
                            action: 'switch_to_linked_issues',
                        })
                        setTab(SessionRecordingSidebarTab.LINKED_ISSUES)
                        onCloseDialog?.()
                    },
                }}
            >
                Your {displayName} integration is connected. Use the <strong>Linked issues</strong> tab in the sidebar
                to create tracked issues directly from Insights.
            </Banner>
        )
    }

    return (
        <Banner
            type="info"
            dismissKey={`share-integration-nudge-${kind}-not-configured`}
            action={{
                children: <span className="w-full text-center">Set up integration</span>,
                onClick: () => {
                    insights.capture('session_replay_share_integration_nudge_clicked', {
                        kind,
                        has_integration: false,
                        action: 'go_to_settings',
                    })
                    router.actions.push(urls.replaySettings('replay-integrations'))
                },
            }}
        >
            Set up a {displayName} integration to create issues that are tracked and linked to this recording.
        </Banner>
    )
}

function LinearLink({ onCloseDialog, ...props }: PlayerShareLogicProps & { onCloseDialog?: () => void }): JSX.Element {
    const logic = playerShareLogic(props)

    const { linearLinkForm, linearUrl, linearLinkFormHasErrors } = useValues(logic)
    const { setLinearLinkFormValue } = useActions(logic)

    return (
        <>
            <IntegrationNudgeBanner kind="linear" onCloseDialog={onCloseDialog} />
            <p className="mt-2">Add an issue to your Linear workspace with a link to this recording.</p>

            <Form logic={playerShareLogic} props={props} formKey="linearLinkForm" className="flex flex-col gap-2">
                <Field className="gap-1" name="issueTitle" label="Issue title">
                    <Input fullWidth />
                </Field>
                <Field
                    className="gap-1"
                    name="issueDescription"
                    label="Issue description"
                    help={<span>We'll include a link to the recording in the description.</span>}
                >
                    <TextArea />
                </Field>
                <div className="flex gap-1 items-center">
                    <Field name="includeTime">
                        <Checkbox label="Start at" checked={linearLinkForm.includeTime} />
                    </Field>
                    <Field name="time" inline>
                        <Input
                            className={clsx('w-20', { 'opacity-50': !linearLinkForm.includeTime })}
                            onFocus={() => setLinearLinkFormValue('includeTime', true)}
                            placeholder="00:00"
                            fullWidth={false}
                            size="small"
                        />
                    </Field>
                </div>
                <Collapse
                    panels={[
                        {
                            key: 'more-options',
                            header: 'More options',
                            content: (
                                <div className="flex flex-col gap-2">
                                    <Field
                                        className="gap-1"
                                        name="assignee"
                                        label="Assignee"
                                        help={<span>Linear username or 'me' to assign to yourself</span>}
                                    >
                                        <Input
                                            fullWidth
                                            placeholder="username or me"
                                            data-attr="linear-share-assignee"
                                        />
                                    </Field>
                                    <Field className="gap-1" name="labels" label="Label">
                                        <Input
                                            fullWidth
                                            placeholder="bug or feature"
                                            data-attr="linear-share-labels"
                                        />
                                    </Field>
                                </div>
                            ),
                        },
                    ]}
                    defaultActiveKey={props.expandMoreOptions ? 'more-options' : undefined}
                />
                <div className="flex justify-end">
                    <Button
                        type="primary"
                        to={linearUrl}
                        targetBlank={true}
                        disabledReason={linearLinkFormHasErrors ? 'Fix all errors before continuing' : undefined}
                    >
                        Create issue
                    </Button>
                </div>
            </Form>
        </>
    )
}

function GithubIssueLink({
    onCloseDialog,
    ...props
}: PlayerShareLogicProps & { onCloseDialog?: () => void }): JSX.Element {
    const logic = playerShareLogic(props)

    const { githubLinkForm, githubUrl, githubLinkFormHasErrors } = useValues(logic)
    const { setGithubLinkFormValue } = useActions(logic)

    return (
        <>
            <IntegrationNudgeBanner kind="github" onCloseDialog={onCloseDialog} />
            <p className="mt-2">Add an issue to your Github repository with a link to this recording.</p>

            <Form logic={playerShareLogic} props={props} formKey="githubLinkForm" className="flex flex-col gap-2">
                <Field className="gap-1" name="githubUsername" label="Username or Organization Name">
                    <Input fullWidth data-attr="github-share-username" />
                </Field>
                <Field className="gap-1" name="githubRepoName" label="Repository Name">
                    <Input fullWidth data-attr="github-share-repo-name" />
                </Field>
                <Field className="gap-1" name="githubIssueTitle" label="Issue Title">
                    <Input fullWidth data-attr="github-share-issue-title" />
                </Field>
                <Field
                    className="gap-1"
                    name="githubIssueDescription"
                    label="Issue description"
                    help={<span>We'll include a link to the recording in the description.</span>}
                >
                    <TextArea />
                </Field>
                <div className="flex gap-1 items-center">
                    <Field name="includeTime">
                        <Checkbox label="Start at" checked={githubLinkForm.includeTime} />
                    </Field>
                    <Field name="time" inline>
                        <Input
                            className={clsx('w-20', { 'opacity-50': !githubLinkForm.includeTime })}
                            onFocus={() => setGithubLinkFormValue('includeTime', true)}
                            placeholder="00:00"
                            fullWidth={false}
                            size="small"
                        />
                    </Field>
                </div>
                <Collapse
                    panels={[
                        {
                            key: 'more-options',
                            header: 'More options',
                            content: (
                                <div className="flex flex-col gap-2">
                                    <Field
                                        className="gap-1"
                                        name="githubAssignees"
                                        label="Assignees"
                                        help={<span>Comma-separated GitHub usernames to assign</span>}
                                    >
                                        <Input
                                            fullWidth
                                            placeholder="user1, user2"
                                            data-attr="github-share-assignees"
                                        />
                                    </Field>
                                    <Field
                                        className="gap-1"
                                        name="githubLabels"
                                        label="Labels"
                                        help={<span>Comma-separated labels to add to the issue</span>}
                                    >
                                        <Input
                                            fullWidth
                                            placeholder="bug, enhancement"
                                            data-attr="github-share-labels"
                                        />
                                    </Field>
                                </div>
                            ),
                        },
                    ]}
                />
                <div className="flex justify-end">
                    <Button
                        type="primary"
                        to={githubUrl}
                        targetBlank={true}
                        disabledReason={
                            !githubUrl
                                ? 'Please fill in Username or Organization Name and Repository Name'
                                : githubLinkFormHasErrors
                                  ? 'Fix all errors before continuing'
                                  : undefined
                        }
                    >
                        Create issue
                    </Button>
                </div>
            </Form>
        </>
    )
}

export function PlayerShareRecording({
    onCloseDialog,
    ...props
}: PlayerShareLogicProps & { onCloseDialog?: () => void }): JSX.Element {
    return (
        <div className="gap-y-2">
            {props.shareType === 'private' && <PrivateLink {...props} />}

            {props.shareType === 'public' && <PublicLink {...props} />}

            {props.shareType === 'linear' && <LinearLink {...props} onCloseDialog={onCloseDialog} />}

            {props.shareType === 'github' && <GithubIssueLink {...props} onCloseDialog={onCloseDialog} />}
        </div>
    )
}

const shareTitleMapping = {
    private: 'Share private link',
    public: 'Share public link',
    linear: 'Share to Linear',
    github: 'Share to Github Issues',
}

export function openPlayerShareDialog(props: PlayerShareLogicProps): void {
    Dialog.open({
        title: props.shareType ? shareTitleMapping[props.shareType] : '',
        content: (closeDialog) => <PlayerShareRecording {...props} onCloseDialog={closeDialog} />,
        maxWidth: '85vw',
        zIndex: '1162',
        primaryButton: null,
    })
}
