import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconCopy, IconTrash } from '@hanzo/icons'
import {
    Banner,
    Button,
    Collapse,
    Input,
    Modal,
    SegmentedButton,
    Tag,
    Link,
    Spinner,
} from '@hanzo/elements'

import { AccessDenied } from 'lib/components/AccessDenied'
import { TZLabel } from 'lib/components/TZLabel'
import { Field } from 'lib/elements/Field'
import { FileInput } from 'lib/elements/FileInput'
import { copyToClipboard } from 'lib/utils/copyToClipboard'
import { organizationLogic } from 'scenes/organizationLogic'

import { CSVImportProgress, customerIOImportLogic } from './customerIOImportLogic'

function StepBadge({ status }: { status: 'completed' | 'failed' | false }): JSX.Element | null {
    if (status === 'completed') {
        return <Tag type="success">Completed</Tag>
    }
    if (status === 'failed') {
        return <Tag type="warning">Failed</Tag>
    }
    return null
}

function Step1Content(): JSX.Element {
    const { isImporting, importProgress, importError, importForm, syncConfig, isRemovingAppConfig } =
        useValues(customerIOImportLogic)
    const { submitImportForm, rerunImport, removeAppConfig } = useActions(customerIOImportLogic)

    const hasStoredKey = syncConfig?.app_integration_id != null || importProgress?.status === 'completed'
    const result = syncConfig?.app_import_result
    // Prefer local reducer state, fall back to DB-persisted result
    const displayResult = importProgress?.status === 'completed' ? importProgress : null
    const persistedResult = !displayResult && result?.status === 'completed' ? result : null

    if (isImporting) {
        return (
            <div className="text-center py-8">
                <Spinner className="text-3xl mb-4" />
                <div className="text-lg font-semibold mb-2">Importing from Customer.io...</div>
                <div className="text-sm text-muted-alt">
                    This may take a moment. Please don't navigate away from this page.
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Error banner */}
            {importProgress?.status === 'failed' && (
                <Banner type="error">
                    Import failed: {importProgress.errors?.join(', ') || 'An unknown error occurred'}
                </Banner>
            )}
            {!importProgress && result?.status === 'failed' && (
                <Banner type="error">Last import failed: {result.error || 'Unknown error'}</Banner>
            )}

            {/* Success banner */}
            {(displayResult || persistedResult) && (
                <>
                    <Banner type="success">
                        <span className="font-semibold">API import complete</span>
                    </Banner>
                    <div className="space-y-2 text-sm">
                        {(persistedResult?.imported_at || displayResult) && (
                            <div className="flex items-center justify-between">
                                <span>Last imported:</span>
                                <TZLabel time={persistedResult?.imported_at || new Date().toISOString()} />
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span>Categories imported:</span>
                            <Tag>
                                {displayResult?.categories_created ?? persistedResult?.categories_created ?? 0}
                            </Tag>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Globally unsubscribed users:</span>
                            <Tag>
                                {(
                                    displayResult?.globally_unsubscribed_count ??
                                    persistedResult?.globally_unsubscribed_count ??
                                    0
                                ).toLocaleString()}
                            </Tag>
                        </div>
                    </div>
                </>
            )}

            {/* API key */}
            {hasStoredKey ? (
                <>
                    <div className="space-y-2">
                        <label className="Label">Customer.io App API Key</label>
                        <Input
                            value="••••••••••••••••"
                            disabledReason="Can't be changed"
                            suffix={
                                <Button
                                    size="xsmall"
                                    type="tertiary"
                                    status="danger"
                                    tooltip="Remove stored API key"
                                    onClick={removeAppConfig}
                                    loading={isRemovingAppConfig}
                                    icon={<IconTrash className="text-danger" />}
                                />
                            }
                        />
                    </div>
                    <p className="text-sm text-muted">Safe to rerun, existing categories and users will be updated.</p>
                </>
            ) : (
                <Form logic={customerIOImportLogic} formKey="importForm" enableFormOnSubmit>
                    <div className="space-y-4">
                        <Field name="app_api_key" label="Customer.io App API Key">
                            <Input
                                placeholder="Enter your App API key"
                                type="password"
                                data-attr="customerio-api-key"
                                autoComplete="off"
                            />
                        </Field>
                        {importError && (
                            <Banner type="error" className="text-sm">
                                {importError}
                            </Banner>
                        )}
                        <div className="text-xs text-muted-alt">
                            You can generate an App API key in Customer.io under Settings → Account Settings → API
                            Credentials.
                        </div>
                    </div>
                </Form>
            )}

            {/* Action button */}
            <div className="flex justify-end">
                {hasStoredKey ? (
                    <Button type="primary" onClick={rerunImport}>
                        Run again
                    </Button>
                ) : (
                    <Button
                        type="primary"
                        onClick={submitImportForm}
                        disabledReason={!importForm.app_api_key ? 'Enter your API key' : undefined}
                    >
                        Start import
                    </Button>
                )}
            </div>
        </div>
    )
}

function Step2Content(): JSX.Element {
    const { csvFile, csvProgress, isUploadingCSV, syncConfig } = useValues(customerIOImportLogic)
    const { setCSVFile, uploadCSV } = useActions(customerIOImportLogic)
    const persistedCSVResult = !csvProgress ? syncConfig?.csv_import_result : null

    const renderFailedImports = (failed: CSVImportProgress['failed_imports']): JSX.Element | null => {
        if (!failed || failed.length === 0) {
            return null
        }
        return (
            <Collapse
                className="mt-4"
                panels={[
                    {
                        key: 'failed-imports',
                        header: <div className="font-semibold text-sm">Failed imports ({failed.length})</div>,
                        content: (
                            <div className="max-h-32 overflow-y-auto bg-bg-light rounded p-2 text-xs font-mono">
                                {failed.slice(0, 100).map((item, idx) => (
                                    <div key={idx} className="py-0.5">
                                        {item.email}: {item.error}
                                    </div>
                                ))}
                                {failed.length > 100 && (
                                    <div className="text-muted-alt mt-2">... and {failed.length - 100} more</div>
                                )}
                            </div>
                        ),
                    },
                ]}
                defaultActiveKeys={[]}
            />
        )
    }

    if (isUploadingCSV && !csvProgress) {
        return (
            <div className="text-center py-8">
                <Spinner className="text-3xl mb-4" />
                <div className="text-lg font-semibold mb-2">Processing CSV...</div>
                <div className="text-sm text-muted-alt">This may take a moment for large files.</div>
            </div>
        )
    }

    if (csvProgress?.status === 'completed') {
        return (
            <div className="space-y-4">
                <Banner type="success">
                    <span className="font-semibold">CSV import complete</span>
                </Banner>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span>Total rows processed:</span>
                        <Tag>{csvProgress.total_rows.toLocaleString()}</Tag>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Users with opt-outs:</span>
                        <Tag>{csvProgress.users_with_optouts.toLocaleString()}</Tag>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Users skipped (no opt-outs):</span>
                        <Tag>{csvProgress.users_skipped.toLocaleString()}</Tag>
                    </div>
                    {csvProgress.parse_errors > 0 && (
                        <div className="flex items-center justify-between text-warning">
                            <span>Parse errors:</span>
                            <Tag type="warning">{csvProgress.parse_errors}</Tag>
                        </div>
                    )}
                </div>
                {renderFailedImports(csvProgress.failed_imports)}
            </div>
        )
    }

    const csvFailed = csvProgress?.status === 'failed' || persistedCSVResult?.status === 'failed'
    const csvFailureDetail = csvProgress?.details || persistedCSVResult?.error

    if (csvFailed) {
        return (
            <Banner type="error">CSV import failed{csvFailureDetail ? `: ${csvFailureDetail}` : ''}</Banner>
        )
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted">
                Export a CSV from Customer.io containing users with subscription preferences. This is not supported via
                the API. You can upload multiple times to update existing users.
                <br />
                <Link
                    to="https://hanzo.ai/docs/workflows/import-customerio-optouts"
                    target="_blank"
                    className="text-primary"
                >
                    View instructions
                </Link>
            </p>
            <div>
                {!csvFile ? (
                    <FileInput
                        accept=".csv"
                        multiple={false}
                        value={[]}
                        onChange={(files) => setCSVFile(files[0] || null)}
                        showUploadedFiles={false}
                        callToAction={
                            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary-light transition-colors cursor-pointer w-full">
                                <div className="text-sm text-muted">Drop your CSV file here or click to browse</div>
                                <div className="text-xs text-muted-alt mt-1">Accepts .csv files only</div>
                            </div>
                        }
                    />
                ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-3 w-full">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-sm">{csvFile.name}</div>
                                <div className="text-xs text-muted mt-1">
                                    Size: {(csvFile.size / (1024 * 1024)).toFixed(2)}MB
                                </div>
                            </div>
                            <Button size="small" type="secondary" onClick={() => setCSVFile(null)}>
                                Remove
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end">
                <Button
                    type="primary"
                    onClick={uploadCSV}
                    loading={isUploadingCSV}
                    disabledReason={!csvFile ? 'Please select a CSV file' : undefined}
                >
                    Upload & process CSV
                </Button>
            </div>
        </div>
    )
}

function Step3Content(): JSX.Element {
    const { syncConfig, webhookUrl, webhookSigningSecret, isSavingWebhook, webhookError, isRemovingWebhookConfig } =
        useValues(customerIOImportLogic)
    const { setWebhookSigningSecret, saveWebhookConfig, toggleWebhook, removeWebhookConfig } =
        useActions(customerIOImportLogic)

    const webhookEnabled = syncConfig?.webhook_enabled ?? false
    const hasSecret = syncConfig?.has_webhook_secret ?? false

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted">
                Configure Customer.io to send a webhook when a user unsubscribes, so Insights automatically records the
                opt-out.
            </p>

            {/* Webhook URL */}
            <div className="space-y-2">
                <label className="Label">Webhook URL</label>
                <div className="flex items-center gap-2">
                    <Input
                        value={webhookUrl}
                        disabledReason="Copy this URL"
                        className="flex-1 font-mono text-xs"
                    />
                    <Button
                        type="secondary"
                        size="small"
                        icon={<IconCopy />}
                        tooltip="Copy URL"
                        onClick={() => void copyToClipboard(webhookUrl, 'webhook URL')}
                    />
                </div>
                <p className="text-xs text-muted-alt">
                    Paste this URL into Customer.io under Integrations → Add integration → Reporting webhook.
                </p>
            </div>

            {webhookError && (
                <Banner type="error" className="text-sm">
                    {webhookError}
                </Banner>
            )}

            {webhookEnabled && <Banner type="success">Inbound webhook sync is active.</Banner>}

            {/* Signing secret */}
            {hasSecret ? (
                <>
                    <div className="space-y-2">
                        <label className="Label">Webhook signing secret</label>
                        <Input
                            value="••••••••••••••••"
                            disabledReason="Can't be changed"
                            suffix={
                                <Button
                                    size="xsmall"
                                    type="tertiary"
                                    status="danger"
                                    tooltip="Remove signing secret"
                                    onClick={removeWebhookConfig}
                                    loading={isRemovingWebhookConfig}
                                    icon={<IconTrash className="text-danger" />}
                                />
                            }
                        />
                    </div>
                    <div className="flex justify-end">
                        {webhookEnabled ? (
                            <Button
                                type="secondary"
                                status="danger"
                                onClick={() => toggleWebhook(false)}
                                loading={isSavingWebhook}
                            >
                                Disable sync
                            </Button>
                        ) : (
                            <Button type="primary" onClick={() => toggleWebhook(true)} loading={isSavingWebhook}>
                                Enable sync
                            </Button>
                        )}
                    </div>
                </>
            ) : (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <label className="Label">Webhook signing secret</label>
                        <Input
                            value={webhookSigningSecret}
                            onChange={setWebhookSigningSecret}
                            placeholder="Enter your webhook signing secret"
                            type="password"
                            autoComplete="off"
                        />
                        <p className="text-xs text-muted-alt">
                            Find this in Customer.io under Settings → Webhooks → Reporting webhooks → Signing secret.
                        </p>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            onClick={saveWebhookConfig}
                            loading={isSavingWebhook}
                            disabledReason={!webhookSigningSecret ? 'Enter the signing secret' : undefined}
                        >
                            Enable sync
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

function Step4Content(): JSX.Element {
    const {
        syncConfig,
        trackSiteId,
        trackApiKey,
        trackRegion,
        isSavingTrack,
        trackError,
        isRemovingTrackConfig,
        trackEnabled,
        hasTrackCredentials,
    } = useValues(customerIOImportLogic)
    const { setTrackSiteId, setTrackApiKey, setTrackRegion, saveTrackConfig, toggleTrackSync, removeTrackConfig } =
        useActions(customerIOImportLogic)

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted">
                When users change their preferences on the Insights-managed page, automatically sync those changes back
                to Customer.io. Only categories imported from Customer.io are synced.
            </p>

            {trackError && (
                <Banner type="error" className="text-sm">
                    {trackError}
                </Banner>
            )}

            {trackEnabled && <Banner type="success">Outbound sync is active.</Banner>}

            {hasTrackCredentials ? (
                <>
                    <div className="space-y-2">
                        <label className="Label">Track API credentials</label>
                        <Input
                            value="••••••••••••••••"
                            disabledReason="Can't be changed"
                            suffix={
                                <Button
                                    size="xsmall"
                                    type="tertiary"
                                    status="danger"
                                    tooltip="Remove track integration"
                                    onClick={removeTrackConfig}
                                    loading={isRemovingTrackConfig}
                                    icon={<IconTrash className="text-danger" />}
                                />
                            }
                        />
                    </div>
                    <div className="flex justify-end">
                        {syncConfig?.track_enabled ? (
                            <Button
                                type="secondary"
                                status="danger"
                                onClick={() => toggleTrackSync(false)}
                                loading={isSavingTrack}
                            >
                                Disable sync
                            </Button>
                        ) : (
                            <Button type="primary" onClick={() => toggleTrackSync(true)} loading={isSavingTrack}>
                                Enable sync
                            </Button>
                        )}
                    </div>
                </>
            ) : (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <label className="Label">Region</label>
                        <SegmentedButton
                            value={trackRegion}
                            onChange={setTrackRegion}
                            options={[
                                { value: 'US', label: 'US', tooltip: 'track.customer.io' },
                                { value: 'EU', label: 'EU', tooltip: 'track-eu.customer.io' },
                            ]}
                            size="small"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="Label">Site ID</label>
                        <Input
                            value={trackSiteId}
                            onChange={setTrackSiteId}
                            placeholder="Your Customer.io site ID"
                            autoComplete="off"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="Label">Track API key</label>
                        <Input
                            value={trackApiKey}
                            onChange={setTrackApiKey}
                            placeholder="Your Customer.io Track API key"
                            type="password"
                            autoComplete="off"
                        />
                    </div>
                    <p className="text-xs text-muted-alt">
                        Find these in Customer.io under Settings → API and webhook credentials → Track API Keys.
                    </p>
                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            onClick={saveTrackConfig}
                            loading={isSavingTrack}
                            disabledReason={!trackSiteId || !trackApiKey ? 'Enter site ID and API key' : undefined}
                        >
                            Enable sync
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export function CustomerIOImportModal(): JSX.Element {
    const { isImportModalOpen, stepCompletion, syncConfigLoading } = useValues(customerIOImportLogic)
    const { closeImportModal } = useActions(customerIOImportLogic)
    const { isAdminOrOwner } = useValues(organizationLogic)

    return (
        <Modal
            title="Customer.io integration"
            description="Import categories and unsubscribed users from Customer.io."
            isOpen={isImportModalOpen}
            onClose={closeImportModal}
            width={640}
        >
            {isAdminOrOwner === false ? (
                <AccessDenied object="Customer.io integration" inline />
            ) : syncConfigLoading ? (
                <div className="flex justify-center py-8">
                    <Spinner className="text-3xl" />
                </div>
            ) : (
                <div className="space-y-4">
                    <Banner type="info">
                        <span>
                            Check our{' '}
                            <Link to="https://hanzo.ai/docs/workflows/import-customerio-optouts" target="_blank">
                                Customer.io import guide
                            </Link>{' '}
                            for detailed instructions.
                        </span>
                    </Banner>
                    <Collapse
                        defaultActiveKey={(['step1', 'step2', 'step3', 'step4'] as const).find(
                            (s) => !stepCompletion[s]
                        )}
                        panels={[
                            {
                                key: 'step1',
                                header: (
                                    <div className="flex items-center justify-between w-full">
                                        <span>1. Import categories & global opt-outs</span>
                                        <StepBadge status={stepCompletion.step1} />
                                    </div>
                                ),
                                content: <Step1Content />,
                            },
                            {
                                key: 'step2',
                                header: (
                                    <div className="flex items-center justify-between w-full">
                                        <span>2. Upload opt-out preferences CSV</span>
                                        <StepBadge status={stepCompletion.step2} />
                                    </div>
                                ),
                                content: <Step2Content />,
                            },
                            {
                                key: 'step3',
                                header: (
                                    <div className="flex items-center justify-between w-full">
                                        <span>3. Inbound webhook sync</span>
                                        <StepBadge status={stepCompletion.step3} />
                                    </div>
                                ),
                                content: <Step3Content />,
                            },
                            {
                                key: 'step4',
                                header: (
                                    <div className="flex items-center justify-between w-full">
                                        <span>4. Outbound sync to Customer.io</span>
                                        <StepBadge status={stepCompletion.step4} />
                                    </div>
                                ),
                                content: <Step4Content />,
                            },
                        ]}
                    />
                </div>
            )}
        </Modal>
    )
}
