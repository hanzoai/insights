import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Collapse, Input, Modal, Select, TextArea } from '@hanzo/elements'

import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { OrganizationMembershipLevel } from 'lib/constants'
import { Field } from 'lib/elements/Field'

import type { McpInstallationScope } from '../mcpStoreLogic'
import { mcpStoreLogic } from '../mcpStoreLogic'

const AUTH_TYPE_OPTIONS = [
    { value: 'api_key', label: 'API key' },
    { value: 'oauth', label: 'OAuth' },
]

const SCOPE_OPTIONS: { value: McpInstallationScope; label: string }[] = [
    { value: 'personal', label: 'Personal (only you)' },
    { value: 'shared', label: 'Shared (everyone in project)' },
]

export function AddCustomServerForm(): JSX.Element {
    const { addCustomServerModalVisible, customServerForm, isCustomServerFormSubmitting, customServerFormPrefilled } =
        useValues(mcpStoreLogic)
    const { setCustomServerFormValue, closeAddCustomServerModal } = useActions(mcpStoreLogic)

    // Shared servers expose the installer's credential to every project member and all
    // autonomous agents, so creating one is admin-only (enforced again on the backend).
    // Members see shared servers in the list but can only add personal ones.
    // Organization scope, not Project: on a project with no access controls
    // configured every member reports as effective project admin, which must
    // not open up shared-credential creation.
    const sharedRestrictionReason = useRestrictedArea({
        scope: RestrictionScope.Organization,
        minimumAccessLevel: OrganizationMembershipLevel.Admin,
    })
    const canAddShared = !sharedRestrictionReason

    const title = customServerFormPrefilled ? `Connect ${customServerForm.name}` : 'Add MCP server'
    const subtitle = customServerFormPrefilled
        ? 'This server is pre-configured by Insights. Just paste your credentials below.'
        : 'Connect any MCP server. Insights will register a client via Dynamic Client Registration when needed.'

    return (
        <Modal
            isOpen={addCustomServerModalVisible}
            onClose={closeAddCustomServerModal}
            overlayClassName="!items-center"
            title={title}
            description={subtitle}
            footer={
                <div className="flex items-center justify-end gap-2">
                    <Button type="secondary" onClick={closeAddCustomServerModal}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        form="mcp-add-custom-server-form"
                        loading={isCustomServerFormSubmitting}
                    >
                        {customServerFormPrefilled ? 'Connect' : 'Add server'}
                    </Button>
                </div>
            }
            width={560}
        >
            <Form
                logic={mcpStoreLogic}
                formKey="customServerForm"
                id="mcp-add-custom-server-form"
                enableFormOnSubmit
                className="deprecated-space-y-3"
            >
                <Field
                    name="scope"
                    label="Visibility"
                    help={
                        canAddShared
                            ? 'Shared servers are available to all project members and autonomous agents.'
                            : 'Only project admins can add shared servers.'
                    }
                >
                    <Select
                        onChange={(val) => setCustomServerFormValue('scope', val)}
                        options={canAddShared ? SCOPE_OPTIONS : [SCOPE_OPTIONS[0]]}
                        disabledReason={canAddShared ? undefined : sharedRestrictionReason}
                        fullWidth
                    />
                </Field>
                {!customServerFormPrefilled && (
                    <>
                        <Field name="name" label="Name">
                            <Input placeholder="My MCP server" fullWidth autoFocus />
                        </Field>
                        <Field name="url" label="Server URL">
                            <Input placeholder="https://mcp.example.com" className="font-mono" fullWidth />
                        </Field>
                        <Field name="description" label="Description">
                            <TextArea placeholder="What does this server do?" />
                        </Field>
                        <Field name="auth_type" label="Authentication">
                            <Select
                                onChange={(val) => setCustomServerFormValue('auth_type', val)}
                                options={AUTH_TYPE_OPTIONS}
                                fullWidth
                            />
                        </Field>
                    </>
                )}
                {customServerForm.auth_type === 'api_key' && (
                    <Field name="api_key" label="API key">
                        <Input placeholder="Enter API key" type="password" fullWidth />
                    </Field>
                )}
                {customServerForm.auth_type === 'oauth' && !customServerFormPrefilled && (
                    <Collapse
                        panels={[
                            {
                                key: 'advanced',
                                header: 'Advanced — bring your own OAuth client',
                                content: (
                                    <div className="deprecated-space-y-3">
                                        <Field
                                            name="client_id"
                                            label="OAuth client ID"
                                            help="Leave blank to let Insights register a client for you via Dynamic Client Registration."
                                        >
                                            <Input placeholder="Optional" fullWidth />
                                        </Field>
                                        <Field
                                            name="client_secret"
                                            label="OAuth client secret"
                                            help="Only needed for confidential clients. Ignored unless a client ID is set."
                                        >
                                            <Input placeholder="Optional" type="password" fullWidth />
                                        </Field>
                                    </div>
                                ),
                            },
                        ]}
                    />
                )}
            </Form>
        </Modal>
    )
}
