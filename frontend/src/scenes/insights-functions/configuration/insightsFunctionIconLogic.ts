import { actions, kea, key, listeners, path, props, reducers } from 'kea'
import { loaders } from 'kea-loaders'

import api from 'lib/api'

import { InsightsFunctionIconResponse } from '~/types'

import type { insightsFunctionIconLogicType } from './insightsFunctionIconLogicType'

export interface InsightsFunctionIconLogicProps {
    logicKey: string
    src?: string
    onChange?: (src: string) => void
}

export const insightsFunctionIconLogic = kea<insightsFunctionIconLogicType>([
    props({} as InsightsFunctionIconLogicProps),
    key((props) => props.logicKey ?? 'default'),
    path((key) => ['scenes', 'pipeline', 'customfunctions', 'insightsFunctionIconLogic', key]),

    actions({
        loadPossibleIcons: true,
        setShowPopover: (show: boolean) => ({ show }),
        setSearchTerm: (search: string) => ({ search }),
    }),

    reducers({
        showPopover: [
            false,
            {
                setShowPopover: (_, { show }) => show,
            },
        ],

        searchTerm: [
            null as string | null,
            {
                setSearchTerm: (_, { search }) => search,
                setShowPopover: () => null,
            },
        ],
    }),

    loaders(({ values }) => ({
        possibleIcons: [
            null as InsightsFunctionIconResponse[] | null,
            {
                loadPossibleIcons: async (_, breakpoint) => {
                    const search = values.searchTerm

                    if (!search) {
                        return []
                    }

                    await breakpoint(1000)
                    const res = await api.insightsFunctions.listIcons({ query: search })
                    return res.map((icon) => ({
                        ...icon,
                        url: icon.url + '&temp=true',
                    }))
                },
            },
        ],
    })),

    listeners(({ actions }) => ({
        setShowPopover: ({ show }) => {
            if (show) {
                actions.loadPossibleIcons()
            }
        },

        setSearchTerm: () => {
            actions.loadPossibleIcons()
        },
    })),
])
