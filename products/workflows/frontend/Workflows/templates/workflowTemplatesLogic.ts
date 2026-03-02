import FuseClass from 'fuse.js'
import { actions, afterMount, kea, path, reducers, selectors } from 'kea'
import { loaders } from 'kea-loaders'
import { actionToUrl, router, urlToAction } from 'kea-router'

import api from 'lib/api'

import type { CustomFlowTemplate } from '../customflows/types'
import type { workflowTemplatesLogicType } from './workflowTemplatesLogicType'

// Helping kea-typegen navigate the exported default class for Fuse
export interface Fuse extends FuseClass<CustomFlowTemplate> {}

export const workflowTemplatesLogic = kea<workflowTemplatesLogicType>([
    path(['products', 'workflows', 'frontend', 'Workflows', 'workflowTemplatesLogic']),
    actions({
        setTemplateFilter: (search: string) => ({ search }),
        setTagFilter: (tag: string | null) => ({ tag }),
        deleteCustomFlowTemplate: (template: CustomFlowTemplate) => ({ template }),
    }),
    reducers({
        templateFilter: [
            '' as string,
            {
                setTemplateFilter: (_, { search }) => search,
            },
        ],
        tagFilter: [
            null as string | null,
            {
                setTagFilter: (_, { tag }) => tag,
            },
        ],
    }),
    loaders(({ values }) => ({
        workflowTemplates: [
            [] as CustomFlowTemplate[],
            {
                loadWorkflowTemplates: async (): Promise<CustomFlowTemplate[]> => {
                    const response = await api.customFlowTemplates.getCustomFlowTemplates()
                    return response.results as CustomFlowTemplate[]
                },
                deleteCustomFlowTemplate: async ({ template }) => {
                    await api.customFlowTemplates.deleteCustomFlowTemplate(template.id)
                    return values.workflowTemplates.filter((t) => t.id !== template.id)
                },
            },
        ],
    })),
    selectors({
        workflowTemplateFuse: [
            (s) => [s.workflowTemplates],
            (workflowTemplates: CustomFlowTemplate[]): Fuse => {
                return new FuseClass(workflowTemplates || [], {
                    keys: [{ name: 'name', weight: 2 }, 'description'],
                    threshold: 0.3,
                    ignoreLocation: true,
                })
            },
        ],
        filteredTemplates: [
            (s) => [s.workflowTemplates, s.templateFilter, s.tagFilter, s.workflowTemplateFuse],
            (
                workflowTemplates: CustomFlowTemplate[],
                templateFilter: string,
                tagFilter: string | null,
                workflowTemplateFuse: Fuse
            ): CustomFlowTemplate[] => {
                let filtered = workflowTemplates

                // Filter by tag
                if (tagFilter) {
                    filtered = filtered.filter((template) => template.tags.includes(tagFilter))
                }

                // Filter by search term using Fuse
                if (templateFilter) {
                    const searchResults = workflowTemplateFuse.search(templateFilter)
                    filtered = searchResults.map((result: { item: CustomFlowTemplate }) => result.item)
                    // Apply tag filter to search results if active
                    if (tagFilter) {
                        filtered = filtered.filter((template) => template.tags.includes(tagFilter))
                    }
                }

                return filtered
            },
        ],
        availableTags: [
            (s) => [s.workflowTemplates],
            (workflowTemplates: CustomFlowTemplate[]): string[] => {
                const tagSet = new Set<string>()
                workflowTemplates.forEach((template) => {
                    template.tags.forEach((tag) => tagSet.add(tag))
                })
                return Array.from(tagSet).sort()
            },
        ],
    }),
    urlToAction(({ actions }) => ({
        '/workflows': (_, searchParams) => {
            if (searchParams.templateFilter) {
                actions.setTemplateFilter(searchParams.templateFilter)
            }
            if (searchParams.tagFilter) {
                actions.setTagFilter(searchParams.tagFilter)
            }
        },
    })),
    actionToUrl(({ values }) => ({
        setTemplateFilter: () => {
            const searchParams = { ...router.values.searchParams }
            searchParams.templateFilter = values.templateFilter
            if (!values.templateFilter) {
                delete searchParams.templateFilter
            }
            return ['/workflows', searchParams, router.values.hashParams, { replace: true }]
        },
        setTagFilter: () => {
            const searchParams = { ...router.values.searchParams }
            if (values.tagFilter) {
                searchParams.tagFilter = values.tagFilter
            } else {
                delete searchParams.tagFilter
            }
            return ['/workflows', searchParams, router.values.hashParams, { replace: true }]
        },
    })),
    afterMount(({ actions }) => {
        actions.loadWorkflowTemplates()
    }),
])
