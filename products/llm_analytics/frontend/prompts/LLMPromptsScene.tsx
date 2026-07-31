import { useActions, useValues } from 'kea'
import { combineUrl, router } from 'kea-router'

import { IconPlusSmall } from '@hanzo/icons'
import { Link } from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { Button } from 'lib/elements/Button'
import { More } from 'lib/elements/Button/More'
import { ProfilePicture } from 'lib/elements/ProfilePicture'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { Input } from '~/lib/elements/Input'
import { Table, TableColumn, TableColumns } from '~/lib/elements/Table'
import { createdAtColumn } from '~/lib/elements/Table/columnUtils'
import { ProductKey } from '~/queries/schema/schema-general'
import { AccessControlLevel, AccessControlResourceType, LLMPrompt } from '~/types'

import { PROMPTS_PER_PAGE, llmPromptsLogic } from './llmPromptsLogic'
import { openDeletePromptDialog } from './utils'

export const scene: SceneExport = {
    component: LLMPromptsScene,
    logic: llmPromptsLogic,
    productKey: ProductKey.LLM_ANALYTICS,
}

export function LLMPromptsScene(): JSX.Element {
    const { setFilters, deletePrompt } = useActions(llmPromptsLogic)
    const { prompts, promptsLoading, sorting, pagination, filters, promptCountLabel } = useValues(llmPromptsLogic)
    const { searchParams } = useValues(router)
    const promptUrl = (name: string): string => combineUrl(urls.llmAnalyticsPrompt(name), searchParams).url

    const columns: TableColumns<LLMPrompt> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: '25%',
            render: function renderName(_, prompt) {
                return (
                    <Link to={promptUrl(prompt.name)} className="font-semibold" data-attr="prompt-name-link">
                        {prompt.name}
                    </Link>
                )
            },
        },
        {
            title: 'Prompt',
            dataIndex: 'prompt',
            key: 'prompt',
            width: '40%',
            render: function renderPrompt(prompt) {
                const displayValue = typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
                const truncated = displayValue.length > 100 ? displayValue.slice(0, 100) + '...' : displayValue

                return <span className="text-muted font-mono text-sm">{truncated || <i>–</i>}</span>
            },
        },
        {
            title: 'Created by',
            dataIndex: 'created_by',
            render: function renderCreatedBy(_, item) {
                const { created_by } = item

                return (
                    <div className="flex flex-row items-center flex-nowrap">
                        {created_by && <ProfilePicture user={created_by} size="md" showName />}
                    </div>
                )
            },
        },
        createdAtColumn<LLMPrompt>() as TableColumn<LLMPrompt, keyof LLMPrompt | undefined>,
        {
            width: 0,
            render: function renderMore(_, prompt) {
                return (
                    <More
                        overlay={
                            <>
                                <Button to={promptUrl(prompt.name)} data-attr="prompt-dropdown-view" fullWidth>
                                    View
                                </Button>

                                <AccessControlAction
                                    resourceType={AccessControlResourceType.LlmAnalytics}
                                    minAccessLevel={AccessControlLevel.Editor}
                                >
                                    <Button
                                        status="danger"
                                        onClick={() => openDeletePromptDialog(() => deletePrompt(prompt.id))}
                                        data-attr="prompt-dropdown-delete"
                                        fullWidth
                                    >
                                        Delete
                                    </Button>
                                </AccessControlAction>
                            </>
                        }
                    />
                )
            },
        },
    ]

    return (
        <SceneContent>
            <SceneTitleSection
                name="Prompts"
                description="Track and manage your LLM prompts."
                resourceType={{ type: 'llm_prompts' }}
                actions={
                    <AccessControlAction
                        resourceType={AccessControlResourceType.LlmAnalytics}
                        minAccessLevel={AccessControlLevel.Editor}
                    >
                        <Button
                            type="primary"
                            to={promptUrl('new')}
                            icon={<IconPlusSmall />}
                            data-attr="new-prompt-button"
                        >
                            New prompt
                        </Button>
                    </AccessControlAction>
                }
            />

            <div className="space-y-4">
                <div className="flex gap-x-4 gap-y-2 items-center flex-wrap">
                    <Input
                        type="search"
                        placeholder="Search prompts..."
                        value={filters.search}
                        data-attr="prompts-search-input"
                        onChange={(value) => setFilters({ search: value })}
                        className="max-w-md"
                    />
                    <div className="text-muted-alt">{promptCountLabel}</div>
                </div>

                <Table
                    loading={promptsLoading}
                    columns={columns}
                    dataSource={prompts.results}
                    pagination={pagination}
                    noSortingCancellation
                    sorting={sorting}
                    onSort={(newSorting) =>
                        setFilters({
                            order_by: newSorting
                                ? `${newSorting.order === -1 ? '-' : ''}${newSorting.columnKey}`
                                : undefined,
                        })
                    }
                    rowKey="id"
                    loadingSkeletonRows={PROMPTS_PER_PAGE}
                    nouns={['prompt', 'prompts']}
                />
            </div>
        </SceneContent>
    )
}
