import FuseClass from 'fuse.js'
import { actions, afterMount, kea, path, reducers, selectors } from 'kea'
import { loaders } from 'kea-loaders'
import { actionToUrl, router, urlToAction } from 'kea-router'

import api from 'lib/api'

import type { InsightsFlowTemplate } from '../insightsflows/types'
import type { workflowTemplatesLogicType } from './workflowTemplatesLogicType'

// Helping kea-typegen navigate the exported default class for Fuse
export interface Fuse extends FuseClass<InsightsFlowTemplate> {}

export const workflowTemplatesLogic = kea<workflowTemplatesLogicType>([
    path(['products', 'workflows', 'frontend', 'Workflows', 'workflowTemplatesLogic']),
    actions({
        setTemplateFilter: (search: string) => ({ search }),
        setTagFilter: (tag: string | null) => ({ tag }),
        deleteInsightsFlowTemplate: (template: InsightsFlowTemplate) => ({ template }),
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
            [] as InsightsFlowTemplate[],
            {
                loadWorkflowTemplates: async (): Promise<InsightsFlowTemplate[]> => {
                    const response = await api.insightsFlowTemplates.getInsightsFlowTemplates()
                    return response.results as InsightsFlowTemplate[]
                },
                deleteInsightsFlowTemplate: async ({ template }) => {
                    await api.insightsFlowTemplates.deleteInsightsFlowTemplate(template.id)
                    return values.workflowTemplates.filter((t) => t.id !== template.id)
                },
            },
        ],
    })),
    selectors({
        workflowTemplateFuse: [
            (s) => [s.workflowTemplates],
            (workflowTemplates: InsightsFlowTemplate[]): Fuse => {
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
                workflowTemplates: InsightsFlowTemplate[],
                templateFilter: string,
                tagFilter: string | null,
                workflowTemplateFuse: Fuse
            ): InsightsFlowTemplate[] => {
                let filtered = workflowTemplates

                // Filter by tag
                if (tagFilter) {
                    filtered = filtered.filter((template) => template.tags.includes(tagFilter))
                }

                // Filter by search term using Fuse
                if (templateFilter) {
                    const searchResults = workflowTemplateFuse.search(templateFilter)
                    filtered = searchResults.map((result: { item: InsightsFlowTemplate }) => result.item)
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
            (workflowTemplates: InsightsFlowTemplate[]): string[] => {
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
