import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Modal, Select } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input'
import { Skeleton } from 'lib/elements/Skeleton'
import { TextArea } from 'lib/elements/TextArea'

import type { RefreshIntervalOption } from '../api'
import { businessKnowledgeLogic } from '../scenes/businessKnowledgeLogic'
import { AlwaysIncludeField } from './AlwaysIncludeField'
import { CrawlConfigFields } from './CrawlConfigFields'

export function EditKnowledgeSourceModal({
    refreshIntervalOptions,
}: {
    refreshIntervalOptions: RefreshIntervalOption[]
}): JSX.Element {
    const {
        isEditModalOpen,
        editingSource,
        editingSourceTextLoading,
        isEditSourceSubmitting,
        isEditUrlSourceSubmitting,
        editUrlSource,
    } = useValues(businessKnowledgeLogic)
    const { closeEditModal, submitEditSource, submitEditUrlSource } = useActions(businessKnowledgeLogic)

    return (
        <Modal
            isOpen={isEditModalOpen}
            onClose={closeEditModal}
            title={editingSource ? `Edit "${editingSource.name}"` : 'Edit knowledge source'}
            footer={
                <>
                    <Button onClick={closeEditModal}>Cancel</Button>
                    <Button
                        type="primary"
                        loading={
                            editingSource?.source_type === 'url' ? isEditUrlSourceSubmitting : isEditSourceSubmitting
                        }
                        disabled={editingSource?.source_type === 'text' && editingSourceTextLoading}
                        onClick={editingSource?.source_type === 'url' ? submitEditUrlSource : submitEditSource}
                    >
                        Save
                    </Button>
                </>
            }
        >
            {editingSource?.source_type === 'url' ? (
                <Form logic={businessKnowledgeLogic} formKey="editUrlSource" className="flex flex-col gap-2">
                    <Field name="name" label="Name">
                        <Input />
                    </Field>
                    <Field name="url" label="URL">
                        <Input placeholder="https://docs.example.com" />
                    </Field>
                    <Field name="crawl_mode" label="Crawl mode">
                        <Select
                            options={[
                                { value: 'single', label: 'Single page' },
                                { value: 'sitemap', label: 'Sitemap' },
                                { value: 'same_origin', label: 'Crawl same origin' },
                            ]}
                        />
                    </Field>
                    <CrawlConfigFields crawlMode={editUrlSource.crawl_mode} url={editUrlSource.url} />
                    <Field
                        name="refresh_interval"
                        label="Auto-refresh"
                        info="How often Insights re-fetches this source in the background. Changing it alone does not trigger an immediate re-crawl."
                    >
                        <Select options={refreshIntervalOptions} />
                    </Field>
                    <AlwaysIncludeField />
                    <p className="text-xs text-muted">Changing the URL or crawl settings will trigger a re-crawl.</p>
                </Form>
            ) : editingSource?.source_type === 'text' && editingSourceTextLoading ? (
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-60" />
                </div>
            ) : (
                <Form logic={businessKnowledgeLogic} formKey="editSource" className="flex flex-col gap-2">
                    <Field name="name" label="Name">
                        <Input />
                    </Field>
                    {editingSource?.source_type === 'text' && (
                        <Field name="text" label="Content">
                            <TextArea minRows={12} />
                        </Field>
                    )}
                    {editingSource?.source_type === 'file' && editingSource.original_filename && (
                        <p className="text-xs text-muted">
                            Uploaded file: {editingSource.original_filename}. To replace the content, delete this source
                            and upload a new file.
                        </p>
                    )}
                    {editingSource?.source_type === 'text' && (
                        <p className="text-xs text-muted">
                            Saving rewrites the chunks for this source. Agents won't see the change mid-conversation
                            until they refresh their prompt.
                        </p>
                    )}
                    <AlwaysIncludeField />
                </Form>
            )}
        </Modal>
    )
}
