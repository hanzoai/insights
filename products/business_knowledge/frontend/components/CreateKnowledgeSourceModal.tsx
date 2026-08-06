import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Modal, Select } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { FileInput } from 'lib/elements/FileInput'
import { Input } from 'lib/elements/Input'
import { Tabs } from 'lib/elements/Tabs'
import { TextArea } from 'lib/elements/TextArea'

import type { RefreshIntervalOption } from '../api'
import { CreateTab, businessKnowledgeLogic } from '../scenes/businessKnowledgeLogic'
import { AlwaysIncludeField } from './AlwaysIncludeField'
import { CrawlConfigFields } from './CrawlConfigFields'
import { CrawlModeHelp } from './CrawlModeHelp'

export function CreateKnowledgeSourceModal({
    refreshIntervalOptions,
}: {
    refreshIntervalOptions: RefreshIntervalOption[]
}): JSX.Element {
    const {
        isCreateModalOpen,
        createTab,
        isTextSourceSubmitting,
        isUrlSourceSubmitting,
        isFileSourceSubmitting,
        urlSource,
    } = useValues(businessKnowledgeLogic)
    const { closeCreateModal, setCreateTab, submitTextSource, submitUrlSource, submitFileSource, setFileSourceValue } =
        useActions(businessKnowledgeLogic)

    return (
        <Modal
            isOpen={isCreateModalOpen}
            onClose={closeCreateModal}
            width={800}
            title="Add to business knowledge"
            footer={
                <>
                    <Button onClick={closeCreateModal}>Cancel</Button>
                    {createTab === 'text' ? (
                        <Button type="primary" loading={isTextSourceSubmitting} onClick={submitTextSource}>
                            Add
                        </Button>
                    ) : createTab === 'url' ? (
                        <Button type="primary" loading={isUrlSourceSubmitting} onClick={submitUrlSource}>
                            Fetch and index
                        </Button>
                    ) : (
                        <Button type="primary" loading={isFileSourceSubmitting} onClick={submitFileSource}>
                            Upload and index
                        </Button>
                    )}
                </>
            }
        >
            <Tabs
                activeKey={createTab}
                onChange={(key) => setCreateTab(key as CreateTab)}
                tabs={[
                    {
                        key: 'text',
                        label: 'Text',
                        content: (
                            <Form logic={businessKnowledgeLogic} formKey="textSource" className="flex flex-col gap-2">
                                <Field name="name" label="Name">
                                    <Input placeholder="e.g. Refund policy" />
                                </Field>
                                <Field name="text" label="Content">
                                    <TextArea
                                        placeholder="Paste FAQ, macros, or any text the support agent should be able to cite."
                                        minRows={12}
                                    />
                                </Field>
                                <p className="text-xs text-muted">
                                    Text is chunked paragraph-by-paragraph and stored in Postgres. The support agent can
                                    find it via SQL — no embeddings or vector DB in this stage.
                                </p>
                                <AlwaysIncludeField />
                            </Form>
                        ),
                    },
                    {
                        key: 'url',
                        label: 'URL',
                        content: (
                            <Form logic={businessKnowledgeLogic} formKey="urlSource" className="flex flex-col gap-2">
                                <Field name="name" label="Name">
                                    <Input placeholder="e.g. Product docs – Billing" />
                                </Field>
                                <Field name="url" label="Entry URL">
                                    <Input
                                        type="url"
                                        inputMode="url"
                                        placeholder="https://docs.example.com/billing or https://example.com/sitemap.xml"
                                    />
                                </Field>
                                <Field name="crawl_mode" label="Mode">
                                    <Select
                                        options={[
                                            {
                                                value: 'single',
                                                label: 'Single page',
                                            },
                                            {
                                                value: 'sitemap',
                                                label: 'Sitemap.xml',
                                            },
                                            {
                                                value: 'same_origin',
                                                label: 'Same-origin crawl',
                                            },
                                        ]}
                                    />
                                </Field>
                                <CrawlModeHelp />
                                <CrawlConfigFields crawlMode={urlSource.crawl_mode} url={urlSource.url} />
                                <Field
                                    name="refresh_interval"
                                    label="Auto-refresh"
                                    info="How often Insights re-fetches this source in the background after the initial crawl."
                                >
                                    <Select options={refreshIntervalOptions} />
                                </Field>
                                <AlwaysIncludeField />
                            </Form>
                        ),
                    },
                    {
                        key: 'file',
                        label: 'File',
                        content: (
                            <Form logic={businessKnowledgeLogic} formKey="fileSource" className="flex flex-col gap-2">
                                <Field name="file" label="File">
                                    <FileInput
                                        accept=".pdf,.docx,.md,.markdown,.txt,.csv"
                                        multiple={false}
                                        callToAction="Drop a file here or click to browse"
                                        showUploadedFiles
                                        onChange={(files) => {
                                            const file = files[0] ?? null
                                            setFileSourceValue('file', file)
                                            if (file) {
                                                const nameWithoutExt = file.name.replace(/\.[^.]+$/, '')
                                                setFileSourceValue('name', nameWithoutExt)
                                            }
                                        }}
                                    />
                                </Field>
                                <Field name="name" label="Name">
                                    <Input placeholder="Auto-filled from filename" />
                                </Field>
                                <p className="text-xs text-muted">
                                    PDF, DOCX, Markdown, CSV, or plain text. Max 50 MB. The file is parsed into text and
                                    chunked — the original file is not stored.
                                </p>
                                <AlwaysIncludeField />
                            </Form>
                        ),
                    },
                ]}
            />
        </Modal>
    )
}
