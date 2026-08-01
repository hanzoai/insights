import './MessageTemplatesGrid.scss'

import { useActions, useMountedLogic, useValues } from 'kea'
import { router } from 'kea-router'

import * as readingIsMagicPng from '@hanzo/brand/hoggies/png/reading-is-magic'
import { IconTrash } from '@hanzo/icons'

import { pngHoggie } from 'lib/brand/hoggies'
import { MemberSelect } from 'lib/components/MemberSelect'
import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { More } from 'lib/elements/Button/More'
import { Input } from 'lib/elements/Input'
import { MenuOverlay } from 'lib/elements/Menu/Menu'
import { Spinner } from 'lib/elements/Spinner'
import MaxTool from 'scenes/max/MaxTool'
import { urls } from 'scenes/urls'

import { MessageTemplateCard } from './MessageTemplateCard'
import { messageTemplatesLogic } from './messageTemplatesLogic'

const MascotReadingIsMagic = pngHoggie(readingIsMagicPng)

export function MessageTemplatesTable(): JSX.Element {
    useMountedLogic(messageTemplatesLogic)
    const { filteredTemplates, templates, templatesLoading, search, createdByFilter } = useValues(messageTemplatesLogic)
    const { deleteTemplate, createTemplate, duplicateTemplate, setSearch, setCreatedByFilter } =
        useActions(messageTemplatesLogic)

    const showProductIntroduction = !templatesLoading && templates.length === 0

    return (
        <div className="templates-section" data-attr="message-templates-table">
            {showProductIntroduction && (
                <ProductIntroduction
                    productName="Message template"
                    thingName="message template"
                    description="Create and manage reusable message templates for your workflows."
                    docsURL="https://hanzo.ai/docs/workflows"
                    action={() => {
                        router.actions.push(urls.workflowsLibraryTemplateNew())
                    }}
                    customHog={MascotReadingIsMagic}
                    isEmpty
                />
            )}
            <MaxTool
                identifier="create_message_template"
                context={{}}
                callback={(toolOutput: any) => {
                    createTemplate({ template: JSON.parse(toolOutput) })
                }}
            >
                <div className="relative" />
            </MaxTool>
            <div className="flex items-center gap-2 mb-4">
                <Input
                    type="search"
                    placeholder="Search templates"
                    value={search}
                    onChange={setSearch}
                    data-attr="templates-search"
                />
                <div className="flex items-center gap-2">
                    <span className="text-secondary whitespace-nowrap">Created by:</span>
                    <MemberSelect value={createdByFilter} onChange={(user) => setCreatedByFilter(user?.id ?? null)} />
                </div>
            </div>
            {templatesLoading ? (
                <Spinner className="text-6xl" />
            ) : (
                <div className="MessageTemplatesGrid">
                    {filteredTemplates.map((template, index) => (
                        <MessageTemplateCard
                            key={template.id}
                            template={template}
                            index={index}
                            onClick={() => router.actions.push(urls.workflowsLibraryTemplate(template.id))}
                            actions={
                                <More
                                    size="small"
                                    overlay={
                                        <MenuOverlay
                                            items={[
                                                {
                                                    label: 'Duplicate',
                                                    onClick: () => duplicateTemplate(template),
                                                },
                                                {
                                                    label: 'Delete',
                                                    status: 'danger' as const,
                                                    icon: <IconTrash />,
                                                    onClick: () => deleteTemplate(template),
                                                },
                                            ]}
                                        />
                                    }
                                />
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
