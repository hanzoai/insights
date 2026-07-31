import { useValues } from 'kea'

import { Button } from '@hanzo/elements'

import { MenuOverlay } from 'lib/elements/Menu/Menu'
import { IconTableChart } from 'lib/elements/icons'
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
        <Button
            type="secondary"
            icon={<IconTableChart />}
            to={urls.insightNew({ query })}
            sideAction={
                response && 'insightsql' in response && response.insightsql
                    ? {
                          dropdown: {
                              overlay: (
                                  <MenuOverlay
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
        </Button>
    )
}
