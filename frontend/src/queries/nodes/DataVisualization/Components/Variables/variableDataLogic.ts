import { kea, path } from 'kea'
import { lazyLoaders } from 'kea-loaders'

import { toast } from '@hanzo/elements'

import api from 'lib/api'

import { Variable } from '../../types'
import type { variableDataLogicType } from './variableDataLogicType'

export const variableDataLogic = kea<variableDataLogicType>([
    path(['queries', 'nodes', 'DataVisualization', 'Components', 'Variables', 'variableDataLogic']),
    lazyLoaders(({ values }) => ({
        variables: [
            [] as Variable[],
            {
                getVariables: async () => {
                    const insights = await api.insightVariables.list()
                    return insights.results
                },
                deleteVariable: async (variableId: string) => {
                    try {
                        await api.insightVariables.delete(variableId)
                        toast.success('Variable deleted successfully')
                    } catch {
                        toast.error('Failed to delete variable')
                    }
                    return values.variables.filter((variable) => variable.id !== variableId)
                },
            },
        ],
    })),
])
