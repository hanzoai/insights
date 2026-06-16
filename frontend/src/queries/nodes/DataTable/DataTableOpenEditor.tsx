import { useValues } from 'kea'

import { LemonButton } from '@hanzo/lemon-ui'

import { LemonMenuOverlay } from 'lib/lemon-ui/LemonMenu/LemonMenu'
import { IconTableChart } from 'lib/lemon-ui/icons'
import { urls } from 'scenes/urls'

import { DataTableNode } from '~/queries/schema/schema-general'

import { dataTableLogic } from './dataTableLogic'

interface DataTableOpenEditorProps {
    query: DataTableNode
    setQuery?: (query: DataTableNode) => void
}

export function DataTableOpenEditor({ query }: DataTableOpenEditorProps): JSX.Element | null {
    const { response } = useValues(dataTableLogic)

    return (
        <LemonButton
            type="secondary"
            icon={<IconTableChart />}
            to={urls.insightNew({ query })}
            sideAction={
                response && 'insightsql' in response && response.insightsql
                    ? {
                          dropdown: {
                              overlay: (
                                  <LemonMenuOverlay
                                      items={[
                                          {
                                              label: 'Open in SQL editor',
                                              to: urls.sqlEditor({ query: response.insightsql }),
                                              'data-attr': 'open-sql-editor-button',
                                          },
                                      ]}
                                  />
                              ),
                          },
                      }
                    : undefined
            }
            data-attr="open-json-editor-button"
            size="small"
        >
            Open as new insight
        </LemonButton>
    )
}
