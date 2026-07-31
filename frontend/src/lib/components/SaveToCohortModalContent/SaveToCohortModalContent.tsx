import { useActions, useValues } from 'kea'

import { Button, Input, Table, TableColumns } from '@hanzo/elements'

import { TableLink } from 'lib/elements/Table/TableLink'
import { IconOpenInNew } from 'lib/elements/icons'
import { urls } from 'scenes/urls'

import { ActorsQuery } from '~/queries/schema/schema-general'
import { CohortType } from '~/types'

import { saveToCohortModalContentLogic } from './saveToCohortModalContentLogic'

interface SaveToCohortModalContentProps {
    closeModal: () => void
    query: ActorsQuery
}

export function SaveToCohortModalContent({ closeModal, query }: SaveToCohortModalContentProps): JSX.Element {
    const { cohorts, cohortsLoading, pagination, cohortFilters } = useValues(saveToCohortModalContentLogic)
    const { setCohortFilters, saveQueryToCohort } = useActions(saveToCohortModalContentLogic)

    const columns: TableColumns<CohortType> = [
        {
            title: 'Name',
            dataIndex: 'name',
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
            render: function Render(name, { id, description }) {
                return (
                    <TableLink
                        to={urls.cohort(id)}
                        target="_blank"
                        title={
                            name ? (
                                <>
                                    {name} <IconOpenInNew className="shrink-0" />
                                </>
                            ) : (
                                'Untitled'
                            )
                        }
                        description={description}
                    />
                )
            },
        },
        {
            title: null,
            render: function RenderActions(_, cohort) {
                return (
                    <Button
                        size="xsmall"
                        type="primary"
                        onClick={() => {
                            saveQueryToCohort(cohort, query)
                            closeModal()
                        }}
                    >
                        Select
                    </Button>
                )
            },
        },
    ]
    return (
        <div className="text-muted mb-2 w-160">
            <Input
                className="w-48 mb-2"
                type="search"
                placeholder="Search for cohorts"
                onChange={(search) => {
                    setCohortFilters({ search: search || undefined, page: 1 })
                }}
                value={cohortFilters.search}
            />
            <Table
                columns={columns}
                loading={cohortsLoading}
                rowKey="id"
                pagination={pagination}
                dataSource={cohorts.results}
                nouns={['cohort', 'cohorts']}
                data-attr="static-cohorts-table"
                useURLForSorting={false}
            />
        </div>
    )
}
