import { useActions, useValues } from 'kea'

import {
    Button,
    Checkbox,
    Collapse,
    Input,
    Modal,
    Select,
    Switch,
} from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { InstallCustomAuthTypeEnumApi } from '../generated/api.schemas'
import { isValidMcpUrl } from './gatewayAddServer'
import { mcpGatewayLogic } from './mcpGatewayLogic'

const AUTH_TYPE_OPTIONS = [
    { value: 'oauth' as const, label: 'OAuth' },
    { value: 'api_key' as const, label: 'API key' },
]

export function GatewayAddServerModal(): JSX.Element | null {
    const {
        addServerForm,
        addServerModalOpen,
        addServerSubmitDisabledReason,
        addingServer,
        canManageAgentAccess,
        isAdmin,
        serviceAccounts,
        serviceAccountsLoading,
    } = useValues(mcpGatewayLogic)
    const { closeAddServerModal, setAddServerFormValue, submitAddServer } = useActions(mcpGatewayLogic)

    if (!addServerModalOpen) {
        return null
    }

    const closeModal = (): void => {
        if (!addingServer) {
            closeAddServerModal()
        }
    }
    const setAgentSelected = (accountId: string, selected: boolean): void => {
        setAddServerFormValue(
            'agentIds',
            selected
                ? [...addServerForm.agentIds, accountId]
                : addServerForm.agentIds.filter((candidate) => candidate !== accountId)
        )
    }
    const urlError =
        addServerForm.url.trim() && !isValidMcpUrl(addServerForm.url)
            ? 'Enter a full URL, like https://mcp.example.com/mcp.'
            : undefined

    return (
        <Modal
            isOpen
            onClose={closeModal}
            title="Add MCP server"
            description="Connect a remote MCP server, then choose who and which agents can use it."
            width={640}
            footer={
                <div className="flex items-center justify-end gap-2">
                    <Button
                        type="secondary"
                        onClick={closeModal}
                        disabledReason={addingServer ? 'Adding server' : undefined}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        form="mcp-gateway-add-server-form"
                        loading={addingServer}
                        disabledReason={addServerSubmitDisabledReason ?? undefined}
                    >
                        Add server
                    </Button>
                </div>
            }
        >
            <form
                id="mcp-gateway-add-server-form"
                className="flex flex-col gap-4"
                onSubmit={(event) => {
                    event.preventDefault()
                    if (!addServerSubmitDisabledReason) {
                        submitAddServer()
                    }
                }}
            >
                <Field.Pure label="Name" htmlFor="mcp-gateway-server-name">
                    <Input
                        id="mcp-gateway-server-name"
                        value={addServerForm.name}
                        onChange={(name) => setAddServerFormValue('name', name)}
                        placeholder="Linear"
                        maxLength={200}
                        autoFocus
                        fullWidth
                    />
                </Field.Pure>

                <Field.Pure
                    label="Server URL"
                    help="Use the full HTTP or HTTPS URL exposed by the server."
                    htmlFor="mcp-gateway-server-url"
                    error={urlError}
                >
                    <Input
                        id="mcp-gateway-server-url"
                        type="url"
                        value={addServerForm.url}
                        onChange={(url) => setAddServerFormValue('url', url)}
                        placeholder="https://mcp.example.com/mcp"
                        maxLength={2048}
                        aria-invalid={Boolean(urlError)}
                        fullWidth
                    />
                </Field.Pure>

                <Field.Pure label="Description (optional)" htmlFor="mcp-gateway-server-description">
                    <Input
                        id="mcp-gateway-server-description"
                        value={addServerForm.description}
                        onChange={(description) => setAddServerFormValue('description', description)}
                        placeholder="What this server helps with"
                        fullWidth
                    />
                </Field.Pure>

                <Field.Pure label="Authentication" htmlFor="mcp-gateway-server-authentication">
                    <Select<InstallCustomAuthTypeEnumApi>
                        id="mcp-gateway-server-authentication"
                        value={addServerForm.authType}
                        onChange={(authType) => setAddServerFormValue('authType', authType)}
                        options={AUTH_TYPE_OPTIONS}
                        fullWidth
                    />
                </Field.Pure>

                {addServerForm.authType === 'api_key' ? (
                    <Field.Pure
                        label="API key (optional)"
                        help="Leave this blank if the server does not require authentication."
                        htmlFor="mcp-gateway-server-api-key"
                    >
                        <Input
                            id="mcp-gateway-server-api-key"
                            type="password"
                            value={addServerForm.apiKey}
                            onChange={(apiKey) => setAddServerFormValue('apiKey', apiKey)}
                            placeholder="Enter API key"
                            fullWidth
                        />
                    </Field.Pure>
                ) : (
                    <Collapse
                        panels={[
                            {
                                key: 'oauth-settings',
                                header: 'Advanced OAuth settings',
                                content: (
                                    <div className="flex flex-col gap-3">
                                        <Field.Pure
                                            label="OAuth client ID (optional)"
                                            help="Leave blank to let Insights register a client."
                                            htmlFor="mcp-gateway-server-client-id"
                                        >
                                            <Input
                                                id="mcp-gateway-server-client-id"
                                                value={addServerForm.clientId}
                                                onChange={(clientId) => setAddServerFormValue('clientId', clientId)}
                                                fullWidth
                                            />
                                        </Field.Pure>
                                        <Field.Pure
                                            label="OAuth client secret (optional)"
                                            htmlFor="mcp-gateway-server-client-secret"
                                        >
                                            <Input
                                                id="mcp-gateway-server-client-secret"
                                                type="password"
                                                value={addServerForm.clientSecret}
                                                onChange={(clientSecret) =>
                                                    setAddServerFormValue('clientSecret', clientSecret)
                                                }
                                                fullWidth
                                            />
                                        </Field.Pure>
                                    </div>
                                ),
                            },
                        ]}
                    />
                )}

                {isAdmin && (
                    <div className="flex items-center justify-between gap-4 rounded border p-3">
                        <div>
                            <div className="font-semibold">Available to team members</div>
                            <div className="text-sm text-secondary">
                                Members can find this server and connect their own account.
                            </div>
                        </div>
                        <Switch
                            checked={addServerForm.teamEnabled}
                            onChange={(teamEnabled) => setAddServerFormValue('teamEnabled', teamEnabled)}
                            aria-label="Make server available to team members"
                        />
                    </div>
                )}

                {canManageAgentAccess && (
                    <Field.Pure label="Share with agents (optional)">
                        <div className="flex flex-col gap-2 rounded border p-3">
                            {serviceAccountsLoading ? (
                                <span className="text-sm text-secondary">Loading agents…</span>
                            ) : serviceAccounts.length === 0 ? (
                                <span className="text-sm text-secondary">No Insights agents are available.</span>
                            ) : (
                                serviceAccounts.map((account) => (
                                    <Checkbox
                                        key={account.id}
                                        checked={addServerForm.agentIds.includes(account.id)}
                                        onChange={(checked) => setAgentSelected(account.id, checked)}
                                        label={
                                            <span>
                                                <span className="font-medium">{account.name}</span>
                                                <span className="ml-2 text-xs text-secondary">{account.handle}</span>
                                            </span>
                                        }
                                    />
                                ))
                            )}
                        </div>
                    </Field.Pure>
                )}
            </form>
        </Modal>
    )
}
