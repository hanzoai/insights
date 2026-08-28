import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import React from 'react'

import { Banner, Button, Collapse, Divider, Label, Modal, Skeleton, Tag } from '@hanzo/elements'

import type { ApiError } from 'lib/api-error'
import { TZLabel } from 'lib/components/TZLabel'
import { Field } from 'lib/elements/Field'
import { ModalContent, ModalFooter, ModalHeader } from 'lib/elements/Modal/Modal'

import { JSONEditor } from '../components/JSONEditor'
import type { DatasetItemReadApi } from '../generated/api.schemas'
import type { DatasetItemModalValue } from './datasetItemModalLogic'
import { DatasetItemModalLogicProps, datasetItemModalLogic, isStoredDatasetItem } from './datasetItemModalLogic'
import { prettifyJson } from './utils'

export interface DatasetItemModalProps {
    isOpen: boolean
    onClose: (refetchDatasetItems?: boolean) => void
    datasetId: string
    partialDatasetItem?: DatasetItemModalValue | null
    /**
     * Whether the modal should display the "Save and add another" button.
     */
    displayBulkCreationButton?: boolean
    title?: string
    readOnly?: boolean
    readOnlyReason?: string
    loading?: boolean
    loadError?: ApiError | null
    versions?: DatasetItemReadApi[]
    versionsLoading?: boolean
    versionsLoadError?: ApiError | null
    versionsCount?: number
    versionsPage?: number
    versionsPageSize?: number
    canRestoreVersions?: boolean
    restoringVersion?: number | null
    onRestoreVersion?: (version: number) => void
    onVersionsPageChange?: (page: number) => void
    onRetryVersions?: () => void
    onRetry?: () => void
    onUnarchive?: () => void
    unarchiving?: boolean
}

export const DatasetItemModal = React.memo(function DatasetItemModal({
    isOpen,
    onClose,
    partialDatasetItem,
    datasetId,
    displayBulkCreationButton,
    title,
    readOnly = false,
    readOnlyReason,
    loading = false,
    loadError,
    versions = [],
    versionsLoading = false,
    versionsLoadError,
    versionsCount = 0,
    versionsPage = 1,
    versionsPageSize = 25,
    canRestoreVersions = false,
    restoringVersion,
    onRestoreVersion,
    onVersionsPageChange,
    onRetryVersions,
    onRetry,
    onUnarchive,
    unarchiving = false,
}: DatasetItemModalProps): JSX.Element {
    const logicProps: DatasetItemModalLogicProps = {
        datasetId,
        partialDatasetItem,
        closeModal: onClose,
        isModalOpen: isOpen,
        readOnly,
        restoringVersion,
    }
    const {
        datasetItemFormSubmitDisabledReason,
        datasetItemVersionRestoreDisabledReason,
        isDatasetItemFormReadOnly,
        isDatasetItemFormSubmitting,
        refetchDatasetItems,
    } = useValues(datasetItemModalLogic(logicProps))
    const { submitDatasetItemForm, setShouldCloseModal } = useActions(datasetItemModalLogic(logicProps))
    const storedDatasetItem = isStoredDatasetItem(partialDatasetItem) ? partialDatasetItem : null

    return (
        <Modal isOpen={isOpen} onClose={() => onClose(refetchDatasetItems)} maxWidth="56rem" simple className="w-full">
            <Form
                logic={datasetItemModalLogic}
                props={logicProps}
                formKey="datasetItemForm"
                enableFormOnSubmit={!isDatasetItemFormReadOnly}
                className="flex flex-col overflow-y-hidden"
            >
                <ModalHeader>
                    <div className="flex items-center gap-2">
                        <h3>
                            {title ??
                                (storedDatasetItem
                                    ? readOnly
                                        ? 'Dataset item'
                                        : 'Edit dataset item'
                                    : loading || loadError
                                      ? 'Dataset item'
                                      : 'New dataset item')}
                        </h3>
                        {storedDatasetItem?.archived && <Tag type="muted">Archived</Tag>}
                        {storedDatasetItem && <Tag type="default">Revision {storedDatasetItem.dataset_revision}</Tag>}
                    </div>
                </ModalHeader>

                <ModalContent className="flex flex-col gap-4">
                    {loadError ? (
                        <Banner
                            type="error"
                            action={
                                onRetry && loadError.status !== 403 && loadError.status !== 404
                                    ? { children: 'Try again', onClick: onRetry }
                                    : undefined
                            }
                        >
                            {getDatasetItemLoadErrorMessage(loadError)}
                        </Banner>
                    ) : loading && !partialDatasetItem ? (
                        <div className="flex flex-col gap-2">
                            <Skeleton active className="h-24 w-full" />
                            <Skeleton active className="h-24 w-full" />
                        </div>
                    ) : (
                        <>
                            {readOnlyReason && <Banner type="info">{readOnlyReason}</Banner>}
                            <Field name="input" label="Input">
                                <JSONEditor readOnly={isDatasetItemFormReadOnly} />
                            </Field>
                            <Field name="expectedOutput" label="Expected output" showOptional>
                                <JSONEditor readOnly={isDatasetItemFormReadOnly} />
                            </Field>
                            {partialDatasetItem?.source_output !== undefined &&
                                partialDatasetItem.source_output !== null && (
                                    <div>
                                        <Label>Source output</Label>
                                        <JSONEditor
                                            value={prettifyJson(partialDatasetItem.source_output) ?? ''}
                                            readOnly
                                        />
                                    </div>
                                )}
                            <Field name="metadata" label="Metadata">
                                <JSONEditor readOnly={isDatasetItemFormReadOnly} />
                            </Field>
                            {storedDatasetItem && (
                                <>
                                    <Divider />
                                    <DatasetItemHistory
                                        currentItem={storedDatasetItem}
                                        versions={versions}
                                        loading={versionsLoading}
                                        loadError={versionsLoadError}
                                        count={versionsCount}
                                        page={versionsPage}
                                        pageSize={versionsPageSize}
                                        canRestore={canRestoreVersions}
                                        restoringVersion={restoringVersion}
                                        restoreDisabledReason={datasetItemVersionRestoreDisabledReason}
                                        onRestore={onRestoreVersion}
                                        onPageChange={onVersionsPageChange}
                                        onRetry={onRetryVersions}
                                    />
                                </>
                            )}
                        </>
                    )}
                </ModalContent>

                <ModalFooter>
                    {readOnly || loadError || loading ? (
                        <>
                            <Button type="secondary" onClick={() => onClose(refetchDatasetItems)}>
                                Close
                            </Button>
                            {onUnarchive && storedDatasetItem?.archived && (
                                <Button type="primary" onClick={onUnarchive} loading={unarchiving}>
                                    Unarchive
                                </Button>
                            )}
                        </>
                    ) : (
                        <>
                            {displayBulkCreationButton && !storedDatasetItem && (
                                <Button
                                    type="secondary"
                                    loading={isDatasetItemFormSubmitting}
                                    disabledReason={datasetItemFormSubmitDisabledReason}
                                    htmlType="submit"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setShouldCloseModal(false)
                                        submitDatasetItemForm()
                                    }}
                                >
                                    Save and add another
                                </Button>
                            )}
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isDatasetItemFormSubmitting}
                                disabledReason={datasetItemFormSubmitDisabledReason}
                            >
                                Save
                            </Button>
                        </>
                    )}
                </ModalFooter>
            </Form>
        </Modal>
    )
})

function DatasetItemHistory({
    currentItem,
    versions,
    loading,
    loadError,
    count,
    page,
    pageSize,
    canRestore,
    restoringVersion,
    restoreDisabledReason,
    onRestore,
    onPageChange,
    onRetry,
}: {
    currentItem: DatasetItemReadApi
    versions: DatasetItemReadApi[]
    loading: boolean
    loadError?: ApiError | null
    count: number
    page: number
    pageSize: number
    canRestore: boolean
    restoringVersion?: number | null
    restoreDisabledReason?: string
    onRestore?: (version: number) => void
    onPageChange?: (page: number) => void
    onRetry?: () => void
}): JSX.Element {
    if (loading) {
        return <Skeleton active className="h-16 w-full" />
    }

    if (loadError) {
        return (
            <Banner type="error" action={onRetry ? { children: 'Try again', onClick: onRetry } : undefined}>
                {loadError.detail || "Couldn't load item history. Try again."}
            </Banner>
        )
    }

    const pageCount = Math.ceil(count / pageSize)
    const pageStart = (page - 1) * pageSize + 1
    const pageEnd = Math.min(page * pageSize, count)

    return (
        <div className="flex flex-col gap-2">
            <h4 className="m-0">Item history</h4>
            {versions.length === 0 ? (
                <p className="text-muted m-0">No item history is available.</p>
            ) : (
                <Collapse
                    embedded
                    size="small"
                    panels={versions.map((version) => ({
                        key: version.version,
                        header: (
                            <div className="flex flex-wrap items-center gap-2 text-left">
                                <strong>Version {version.version}</strong>
                                <span className="text-muted">Revision {version.dataset_revision}</span>
                                <Tag type={version.archived ? 'muted' : 'success'}>
                                    {version.archived ? 'Archived' : 'Active'}
                                </Tag>
                                <TZLabel time={version.version_created_at} />
                                <span className="text-muted">
                                    {version.version_created_by?.email ?? 'Unknown creator'}
                                </span>
                            </div>
                        ),
                        content: (
                            <div className="flex flex-col gap-3 p-3">
                                <DatasetItemVersionValue label="Input" value={version.input} />
                                <DatasetItemVersionValue label="Expected output" value={version.expected_output} />
                                <DatasetItemVersionValue label="Source output" value={version.source_output} />
                                <DatasetItemVersionValue label="Metadata" value={version.metadata} />
                                {canRestore && version.version !== currentItem.version && onRestore && (
                                    <div>
                                        <Button
                                            type="secondary"
                                            size="small"
                                            onClick={() => onRestore(version.version)}
                                            loading={restoringVersion === version.version}
                                            disabledReason={
                                                restoreDisabledReason ??
                                                (restoringVersion && restoringVersion !== version.version
                                                    ? 'Another version is being restored'
                                                    : undefined)
                                            }
                                        >
                                            Restore this version
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ),
                    }))}
                />
            )}
            {pageCount > 1 && onPageChange && (
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">
                        {pageStart}-{pageEnd} of {count} versions
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            type="secondary"
                            size="small"
                            onClick={() => onPageChange(page - 1)}
                            disabledReason={page <= 1 ? 'No previous page' : undefined}
                        >
                            Previous
                        </Button>
                        <Button
                            type="secondary"
                            size="small"
                            onClick={() => onPageChange(page + 1)}
                            disabledReason={page >= pageCount ? 'No next page' : undefined}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

function DatasetItemVersionValue({ label, value }: { label: string; value: unknown }): JSX.Element {
    return (
        <div>
            <Label>{label}</Label>
            <JSONEditor value={prettifyJson(value) ?? 'null'} readOnly />
        </div>
    )
}

function getDatasetItemLoadErrorMessage(error: ApiError): string {
    if (error.status === 404) {
        return 'This dataset item was not found. Close this dialog and choose another item.'
    }
    if (error.status === 403) {
        return "You don't have permission to view this dataset item."
    }
    return error.detail || "Couldn't load this dataset item. Try again."
}
