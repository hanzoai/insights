import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconRefresh, IconTrash } from '@hanzo/icons'
import { Button, Dialog, Switch, Tag, TextArea } from '@hanzo/elements'

import { CodeSnippet } from 'lib/components/CodeSnippet'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { FEATURE_FLAGS, TeamMembershipLevel } from 'lib/constants'
import { Banner } from 'lib/elements/Banner'
import { Field } from 'lib/elements/Field'
import { Link } from 'lib/elements/Link'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

import { featureFlagConfirmationSettingsLogic } from './featureFlagConfirmationSettingsLogic'

export function FlagPersistenceSettings(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <Switch
            data-attr="default-flag-persistence-switch"
            onChange={(checked) => {
                updateCurrentTeam({
                    flags_persistence_default: checked,
                })
            }}
            label="Enable flag persistence by default"
            bordered
            checked={!!currentTeam?.flags_persistence_default}
            disabledReason={restrictedReason}
        />
    )
}

export function FlagChangeConfirmationSettings(): JSX.Element {
    const { updateCurrentTeam } = useActions(teamLogic)
    const { currentTeam } = useValues(teamLogic)
    const { confirmationMessageLoading } = useValues(featureFlagConfirmationSettingsLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    return (
        <div className="space-y-2">
            <Switch
                data-attr="feature-flag-confirmation-switch"
                onChange={(checked) => {
                    updateCurrentTeam({
                        feature_flag_confirmation_enabled: checked,
                    })
                }}
                label="Require confirmation for feature flag changes"
                bordered
                checked={!!currentTeam?.feature_flag_confirmation_enabled}
                disabledReason={restrictedReason}
            />

            {currentTeam?.feature_flag_confirmation_enabled && (
                <div className="mt-4">
                    <Form
                        logic={featureFlagConfirmationSettingsLogic}
                        formKey="confirmationMessageForm"
                        enableFormOnSubmit
                        className="w-full"
                    >
                        <Field name="message" label="Custom confirmation message">
                            <TextArea
                                placeholder="Optional custom message. Default: '⚠️ These changes will immediately affect users matching the release conditions. Please ensure you understand the consequences before proceeding.'"
                                maxLength={500}
                                maxRows={3}
                                disabled={!!restrictedReason}
                            />
                        </Field>
                        <Button
                            type="primary"
                            htmlType="submit"
                            disabledReason={!currentTeam ? 'Loading team...' : restrictedReason}
                            loading={confirmationMessageLoading}
                        >
                            Save message
                        </Button>
                    </Form>
                </div>
            )}
        </div>
    )
}

export function FlagsSecureApiKeys(): JSX.Element {
    const { currentTeam, isTeamTokenResetAvailable } = useValues(teamLogic)
    const { featureFlags } = useValues(featureFlagLogic)
    const { deleteSecretTokenBackup, rotateSecretToken } = useActions(teamLogic)

    const projectSecretApiKeysEnabled = !!featureFlags[FEATURE_FLAGS.PROJECT_SECRET_API_KEYS]
    const hasLegacyKey = !!(currentTeam?.secret_api_token || currentTeam?.secret_api_token_backup)

    const openResetDialog = (): void => {
        const verb = currentTeam?.secret_api_token ? 'Rotate' : 'Generate'
        const description =
            'This will generate a new Feature Flags secure API key' +
            (currentTeam?.secret_api_token
                ? ' and move the existing one to backup. The old key will remain active until you delete it.'
                : '')

        Dialog.open({
            title: `${verb} Flag Definitions API key?`,
            description: description,
            primaryButton: {
                children: verb,
                type: 'primary',
                onClick: rotateSecretToken,
            },
            secondaryButton: {
                children: 'Cancel',
                type: 'secondary',
            },
        })
    }

    const openDeleteBackupDialog = (): void => {
        Dialog.open({
            title: 'Delete Backup API key?',
            description: 'This will permanently delete the previous key. Make sure your systems are using the new key.',
            primaryButton: {
                children: 'Delete',
                type: 'primary',
                status: 'danger',
                onClick: deleteSecretTokenBackup,
            },
            secondaryButton: {
                children: 'Cancel',
                type: 'secondary',
            },
        })
    }

    // Teams without a legacy key shouldn't be offered to create a deprecated credential
    if (projectSecretApiKeysEnabled && !hasLegacyKey) {
        return (
            <Banner type="warning">
                <p className="mb-1">
                    The feature flags secure API key is deprecated. Create a <strong>project secret API key</strong>{' '}
                    with the <strong>feature_flag:read</strong> scope (the "Local feature flag evaluation" preset)
                    instead. It's hashed at rest, scoped, and rotatable.
                </p>
                <Link to={urls.settings('environment-secret-api-keys')}>Create a project secret API key</Link>
            </Banner>
        )
    }

    return (
        <div className="space-y-2">
            {projectSecretApiKeysEnabled && (
                <Banner type="warning">
                    <p className="mb-1">
                        This feature flags secure API key is deprecated. Create a{' '}
                        <strong>project secret API key</strong> with the <strong>feature_flag:read</strong> scope (the
                        "Local feature flag evaluation" preset) instead. It's hashed at rest, scoped, and rotatable
                        without affecting your primary key.
                    </p>
                    <Link to={urls.settings('environment-secret-api-keys')}>Create a project secret API key</Link>
                </Banner>
            )}
            <h3
                className={`${
                    projectSecretApiKeysEnabled ? 'mt-4' : 'mt-0'
                } mb-1 text-sm font-semibold text-muted flex items-center gap-2`}
            >
                Primary Key <span className="text-green-700 text-xs">(Active)</span>
                {projectSecretApiKeysEnabled && <Tag type="warning">Deprecated</Tag>}
            </h3>
            <CodeSnippet
                actions={
                    <Button
                        icon={<IconRefresh />}
                        noPadding
                        onClick={openResetDialog}
                        disabledReason={
                            !isTeamTokenResetAvailable ? 'You do not have permission to rotate this key' : undefined
                        }
                        tooltip={currentTeam?.secret_api_token ? 'Rotate key' : 'Generate key'}
                    />
                }
                className={currentTeam?.secret_api_token ? '' : 'text-muted'}
                thing="Primary Feature Flags Secure API key"
            >
                {currentTeam?.secret_api_token || 'Click the rotate button on the right to generate a new key.'}
            </CodeSnippet>

            {currentTeam?.secret_api_token_backup ? (
                <>
                    <h3 className="mt-4 mb-1 text-sm font-semibold text-muted">
                        Backup Key <span className="text-orange-600 text-xs ml-2">(Pending deletion)</span>
                    </h3>
                    <CodeSnippet
                        actions={
                            <Button
                                icon={<IconTrash />}
                                noPadding
                                status="danger"
                                onClick={openDeleteBackupDialog}
                                tooltip="Delete backup key"
                            />
                        }
                        thing="Backup Feature Flags Secure API key"
                    >
                        {currentTeam.secret_api_token_backup}
                    </CodeSnippet>
                    <p className="text-xs text-muted mt-1">
                        This key is still active to support deployments using the previous key. Delete it once you've
                        fully migrated.
                    </p>
                </>
            ) : (
                <p className="text-xs text-muted mt-2 mb-0">
                    Rotating the key will move this primary key to backup so you can migrate safely.
                </p>
            )}
        </div>
    )
}

export function FeatureFlagSettings(): JSX.Element {
    return (
        <div className="space-y-8">
            <FlagPersistenceSettings />
            <FlagChangeConfirmationSettings />
        </div>
    )
}

export function openFeatureFlagSettingsDialog(): void {
    Dialog.open({
        title: 'Feature flag settings',
        content: <FeatureFlagSettings />,
        width: 600,
        primaryButton: {
            children: 'Done',
        },
    })
}
