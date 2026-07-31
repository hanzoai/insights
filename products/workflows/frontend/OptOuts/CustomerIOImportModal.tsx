import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import {
    Banner,
    Button,
    Collapse,
    Divider,
    Input,
    Modal,
    Tag,
    Link,
    Spinner,
} from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { FileInput } from 'lib/elements/FileInput'

import { CSVImportProgress, customerIOImportLogic } from './customerIOImportLogic'

export function CustomerIOImportModal(): JSX.Element {
    const {
        isImportModalOpen,
        isImporting,
        importProgress,
        importError,
        importForm,
        csvFile,
        csvProgress,
        showCSVPhase,
        isUploadingCSV,
    } = useValues(customerIOImportLogic)
    const { closeImportModal, submitImportForm, setCSVFile, uploadCSV } = useActions(customerIOImportLogic)

    const renderAPIImportPhase = (): JSX.Element => {
        if (isImporting) {
            // Show simple loading spinner
            return (
                <div className="space-y-4">
                    <div className="text-center py-8">
                        <Spinner className="text-3xl mb-4" />
                        <div className="text-lg font-semibold mb-2">Importing from Customer.io...</div>
                        <div className="text-sm text-muted-alt">
                            This may take a moment. Processing categories and unsubscribed users.
                        </div>
                    </div>
                </div>
            )
        }

        if (importProgress?.status === 'failed') {
            return (
                <Banner type="error">
                    <div>
                        <div className="font-semibold mb-2">Import Failed</div>
                        <div className="text-sm">
                            {importProgress.errors?.join(', ') || 'An unknown error occurred'}
                        </div>
                    </div>
                </Banner>
            )
        }

        if (importProgress?.status === 'completed') {
            return (
                <div className="space-y-4">
                    <Banner type="success">
                        <span className="font-semibold">API Import Complete!</span>
                    </Banner>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span>Categories imported:</span>
                            <Tag>{importProgress.categories_created || 0}</Tag>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Globally unsubscribed users:</span>
                            <Tag>{(importProgress.globally_unsubscribed_count || 0).toLocaleString()}</Tag>
                        </div>
                    </div>
                </div>
            )
        }

        // Initial form
        return (
            <Form logic={customerIOImportLogic} formKey="importForm" enableFormOnSubmit>
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
                    <div>
                        <p className="text-sm text-muted mb-4">
                            Step 1: Import categories and globally unsubscribed users from Customer.io API.
                        </p>
                    </div>

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
        )
    }

    const renderCSVImportPhase = (): JSX.Element => {
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
                    defaultActiveKeys={[]} // Start collapsed
                />
            )
        }

        // Show loading state while processing
        if (isUploadingCSV && !csvProgress) {
            return (
                <div className="space-y-4">
                    <Divider />
                    <div className="text-center py-8">
                        <Spinner className="text-3xl mb-4" />
                        <div className="text-lg font-semibold mb-2">Processing CSV...</div>
                        <div className="text-sm text-muted-alt">
                            This may take a moment for large files. Please don't close this window.
                        </div>
                        <div className="text-xs text-muted-alt mt-2">
                            Processing thousands of rows and updating the database...
                        </div>
                    </div>
                </div>
            )
        }

        if (csvProgress) {
            if (csvProgress.status === 'completed') {
                return (
                    <div className="space-y-4">
                        <Divider />
                        <Banner type="success">
                            <span className="font-semibold">CSV Import Complete!</span>
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
            } else if (csvProgress.status === 'failed') {
                return (
                    <div className="space-y-4">
                        <Divider />
                        <Banner type="error">
                            <div>
                                <div className="font-semibold mb-2">CSV Import Failed</div>
                                <div className="text-sm">{csvProgress.details}</div>
                            </div>
                        </Banner>
                    </div>
                )
            }
        }

        return (
            <div className="space-y-3">
                <Divider />
                <div>
                    <h3 className="font-semibold mb-2">Step 2: Import User Preferences (Optional)</h3>
                    <p className="text-sm text-muted mb-3">
                        Export a CSV from Customer.io with users who have subscription preferences set.{' '}
                        <Link
                            to="https://hanzo.ai/docs/workflows/import-customerio-optouts"
                            target="_blank"
                            className="text-primary"
                        >
                            View instructions
                        </Link>
                    </p>

                    <div className="flex justify-center">
                        {!csvFile ? (
                            <FileInput
                                accept=".csv"
                                multiple={false}
                                value={[]}
                                onChange={(files) => setCSVFile(files[0] || null)}
                                showUploadedFiles={false}
                                callToAction={
                                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary-light transition-colors cursor-pointer w-full">
                                        <div className="text-sm text-muted">
                                            Drop your CSV file here or click to browse
                                        </div>
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
                </div>
            </div>
        )
    }

    const renderContent = (): JSX.Element => {
        if (!showCSVPhase) {
            return renderAPIImportPhase()
        }

        return (
            <div className="space-y-4">
                {renderAPIImportPhase()}
                {renderCSVImportPhase()}
            </div>
        )
    }

    const getModalFooter = (): JSX.Element | null => {
        // During API import
        if (isImporting) {
            return null // No buttons during import
        }

        // During CSV upload/processing
        if (isUploadingCSV && !csvProgress) {
            return null // No buttons while processing
        }

        // API import failed
        if (importProgress?.status === 'failed') {
            return (
                <Button type="primary" onClick={closeImportModal}>
                    Close
                </Button>
            )
        }

        // CSV phase
        if (showCSVPhase) {
            if (csvProgress?.status === 'completed' || csvProgress?.status === 'failed') {
                return (
                    <Button type="primary" onClick={closeImportModal}>
                        Close
                    </Button>
                )
            }

            return (
                <>
                    <Button type="secondary" onClick={closeImportModal}>
                        Skip CSV Import
                    </Button>
                    <Button
                        type="primary"
                        onClick={uploadCSV}
                        loading={isUploadingCSV}
                        disabledReason={!csvFile ? 'Please select a CSV file' : undefined}
                    >
                        Upload & Process CSV
                    </Button>
                </>
            )
        }

        // Initial API import form
        return (
            <>
                <Button type="secondary" onClick={closeImportModal}>
                    Cancel
                </Button>
                <Button
                    type="primary"
                    onClick={submitImportForm}
                    loading={isImporting}
                    disabledReason={!importForm.app_api_key ? 'Please enter your API key' : undefined}
                >
                    Start Import
                </Button>
            </>
        )
    }

    return (
        <Modal
            title="Import from Customer.io"
            isOpen={isImportModalOpen}
            onClose={closeImportModal}
            footer={getModalFooter()}
            width="medium"
        >
            {renderContent()}
        </Modal>
    )
}
