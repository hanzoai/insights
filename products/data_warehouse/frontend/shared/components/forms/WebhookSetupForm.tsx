import { BuiltLogic, LogicWrapper } from 'kea'
import { Form } from 'kea-forms'

import { IconCopy, IconRefresh } from '@hanzo/icons'
import { Banner, Button, Tag, Spinner } from '@hanzo/elements'

import { Card } from 'lib/elements/Card'
import { Markdown } from 'lib/elements/Markdown'
import { Link } from 'lib/elements/Link'
import { copyToClipboard } from 'lib/utils/copyToClipboard'

import { SourceConfig, SourceFieldConfig } from '~/queries/schema/schema-general'

import { sourceFieldToElement } from './SourceForm'

const MAX_VISIBLE_WEBHOOK_TABLES = 20

export interface WebhookCreateResult {
    success: boolean
    webhook_url: string
    error?: string
    /**
     * `webhookFields` keys the user still needs to fill in after a successful auto-create
     * (e.g. for sources whose API doesn't return the signing secret on create).
     */
    pending_inputs?: string[]
}

interface WebhookSetupFormProps {
    sourceName: string
    sourceConfig?: SourceConfig | null
    webhookTables?: { name: string; label?: string | null }[]
    webhookResult?: WebhookCreateResult | null
    webhookCreating: boolean
    onCreateWebhook: () => void
    /** kea-forms logic and formKey for the manual webhook field inputs form */
    formLogic?: LogicWrapper | BuiltLogic<any>
    formKey?: string
}

/**
 * Shared webhook setup UI used in the new source wizard (step 4) and the webhook settings tab.
 * Handles the full lifecycle: initial setup, creating, success, and manual fallback.
 */
export function WebhookSetupForm({
    sourceName,
    sourceConfig,
    webhookTables,
    webhookResult,
    webhookCreating,
    onCreateWebhook,
    formLogic,
    formKey,
}: WebhookSetupFormProps): JSX.Element {
    const webhookFields = sourceConfig?.webhookFields ?? []
    const manualOnly = sourceConfig?.webhookManualOnly ?? false

    const webhookTablesList =
        webhookTables && webhookTables.length > 0 ? (
            <div className="space-y-1">
                <p className="font-semibold text-sm mb-1">
                    {webhookTables.length.toLocaleString()} {webhookTables.length === 1 ? 'table' : 'tables'} using
                    webhook sync:
                </p>
                <ul className="list-disc list-inside text-sm">
                    {webhookTables.slice(0, MAX_VISIBLE_WEBHOOK_TABLES).map((t) => (
                        <li key={t.name}>{t.label || t.name}</li>
                    ))}
                </ul>
                {webhookTables.length > MAX_VISIBLE_WEBHOOK_TABLES && (
                    <p className="text-sm text-muted">
                        …and {(webhookTables.length - MAX_VISIBLE_WEBHOOK_TABLES).toLocaleString()} more
                    </p>
                )}
            </div>
        ) : null

    if (!webhookResult && !webhookCreating) {
        return (
            <WebhookSetupCard>
                <h3 className="text-lg font-semibold">Set up webhook for {sourceName}</h3>
                <p>
                    Instead of polling for changes on a schedule, we'll set up a webhook on your {sourceName} account so
                    that new data is pushed to Insights. This means faster syncs and less load on your source.
                </p>
                {webhookTablesList}
                <Banner type="info">
                    {manualOnly
                        ? `We'll generate a webhook URL — you'll need to register it manually in your ${sourceName} app settings.`
                        : `We'll automatically register the webhook on your ${sourceName} account. No manual configuration is needed.`}
                </Banner>
                {sourceConfig?.docsUrl && (
                    <p className="text-sm text-muted">
                        For more details, see our{' '}
                        <Link to={sourceConfig.docsUrl} target="_blank">
                            {sourceName} source docs
                        </Link>
                        .
                    </p>
                )}
                <Button type="primary" onClick={onCreateWebhook}>
                    {manualOnly ? 'Generate webhook URL' : 'Create webhook'}
                </Button>
            </WebhookSetupCard>
        )
    }

    if (webhookCreating) {
        return (
            <WebhookSetupCard>
                <h3 className="text-lg font-semibold">Setting up webhook for {sourceName}</h3>
                {webhookTablesList}
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                    <Spinner className="text-3xl" />
                    <p className="text-muted">
                        {manualOnly
                            ? 'Generating webhook URL...'
                            : `Registering webhook on your ${sourceName} account...`}
                    </p>
                </div>
            </WebhookSetupCard>
        )
    }

    if (webhookResult?.success) {
        const pendingKeys = new Set(webhookResult.pending_inputs ?? [])
        const pendingFields = webhookFields.filter((f) => pendingKeys.has(f.name))

        if (pendingFields.length === 0) {
            return (
                <WebhookSetupCard>
                    <h3 className="text-lg font-semibold">Webhook created for {sourceName}</h3>
                    <Banner type="success">
                        Webhook registered successfully. The tables below will now sync automatically when data changes
                        in your {sourceName} account.
                    </Banner>
                    {webhookTablesList}
                </WebhookSetupCard>
            )
        }

        return (
            <WebhookSetupCard>
                <h3 className="text-lg font-semibold">Almost done — finish setting up your {sourceName} webhook</h3>
                <Banner type="success">
                    Webhook created in {sourceName}. We just need a couple more details from your {sourceName} dashboard
                    to start receiving events.
                </Banner>
                {sourceConfig?.webhookSetupCaption && (
                    <Markdown className="text-sm">{sourceConfig.webhookSetupCaption}</Markdown>
                )}
                {sourceConfig && formLogic && formKey && (
                    <Form logic={formLogic} formKey={formKey} enableFormOnSubmit>
                        <div className="space-y-3 ph-no-capture">
                            {pendingFields.map((field: SourceFieldConfig) => sourceFieldToElement(field, sourceConfig))}
                            <Button type="primary" htmlType="submit">
                                Save
                            </Button>
                        </div>
                    </Form>
                )}
                {webhookTablesList}
            </WebhookSetupCard>
        )
    }

    return (
        <WebhookSetupCard>
            <h3 className="text-lg font-semibold">Manual webhook setup for {sourceName}</h3>
            {!manualOnly && (
                <Banner type="warning">
                    {webhookResult?.error || 'Could not create the webhook automatically.'}
                </Banner>
            )}
            <p>
                {manualOnly
                    ? `Copy the URL below and register it as a webhook endpoint in your ${sourceName} app settings.`
                    : `You'll need to manually configure the webhook in your ${sourceName} account. Copy the URL below and add it as a webhook endpoint in your ${sourceName} settings.`}
            </p>
            {webhookResult?.webhook_url && <WebhookUrlDisplay url={webhookResult.webhook_url} />}
            {sourceConfig?.webhookSetupCaption && (
                <Markdown className="text-sm">
                    {sourceConfig.webhookSetupCaption.replace('{webhook_url}', webhookResult?.webhook_url ?? '')}
                </Markdown>
            )}
            {webhookFields.length > 0 && sourceConfig && formLogic && formKey && (
                <Form logic={formLogic} formKey={formKey} enableFormOnSubmit>
                    <div className="space-y-3 ph-no-capture">
                        {webhookFields.map((field: SourceFieldConfig) => sourceFieldToElement(field, sourceConfig))}
                        <Button type="primary" htmlType="submit">
                            Save
                        </Button>
                    </div>
                </Form>
            )}
            {sourceConfig?.docsUrl && (
                <p className="text-sm text-muted">
                    For more details, see our{' '}
                    <Link to={sourceConfig.docsUrl} target="_blank">
                        {sourceName} source docs
                    </Link>
                    .
                </p>
            )}
        </WebhookSetupCard>
    )
}

export function WebhookUrlDisplay({ url }: { url: string }): JSX.Element {
    return (
        <div>
            <label className="font-semibold text-sm">Webhook URL</label>
            <div className="flex items-center gap-2 mt-1">
                <code className="text-sm bg-bg-light rounded border px-2 py-1 break-all flex-1 ph-no-capture">
                    {url}
                </code>
                <Button
                    icon={<IconCopy />}
                    size="small"
                    type="secondary"
                    aria-label="Copy webhook URL"
                    onClick={() => void copyToClipboard(url, 'webhook URL')}
                />
            </div>
        </div>
    )
}

export function WebhookStatusTags({
    externalStateLabel,
    internalStateLabel,
}: {
    externalStateLabel: { label: string; tagType: 'success' | 'warning' | 'danger' | 'default' }
    internalStateLabel: { label: string; tagType: 'success' | 'warning' | 'danger' | 'default' }
}): JSX.Element {
    return (
        <div className="flex gap-8">
            <div className="space-y-1">
                <p className="text-xs font-semibold text-muted uppercase">Source webhook</p>
                <Tag type={externalStateLabel.tagType}>{externalStateLabel.label}</Tag>
            </div>
            <div className="space-y-1">
                <p className="text-xs font-semibold text-muted uppercase">Insights processing</p>
                <Tag type={internalStateLabel.tagType}>{internalStateLabel.label}</Tag>
            </div>
        </div>
    )
}

export function WebhookRefreshButton({ onClick, loading }: { onClick: () => void; loading: boolean }): JSX.Element {
    return (
        <Button icon={<IconRefresh />} type="secondary" size="small" onClick={onClick} loading={loading}>
            Refresh
        </Button>
    )
}

function WebhookSetupCard({ children }: { children: React.ReactNode }): JSX.Element {
    return (
        <Card hoverEffect={false} className="space-y-4">
            {children}
        </Card>
    )
}
