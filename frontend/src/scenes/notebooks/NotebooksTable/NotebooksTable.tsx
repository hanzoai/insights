import { useActions, useValues } from 'kea'

import { IconEllipsis, IconTrash } from '@hanzo/icons'
import { Button, Input, Tag } from '@hanzo/elements'

import { MemberSelect } from 'lib/components/MemberSelect'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { Banner } from 'lib/elements/Banner'
import { Menu } from 'lib/elements/Menu'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { atColumn, createdByColumn } from 'lib/elements/Table/columnUtils'
import { Link } from 'lib/elements/Link'
import { ContainsTypeFilters } from 'scenes/notebooks/NotebooksTable/ContainsTypeFilter'
import { notebooksTableLogic } from 'scenes/notebooks/NotebooksTable/notebooksTableLogic'
import { urls } from 'scenes/urls'

import { notebooksModel } from '~/models/notebooksModel'

import { notebookPanelLogic } from '../NotebookPanel/notebookPanelLogic'
import { NotebookListItemType } from '../types'

function titleColumn(): TableColumn<NotebookListItemType, 'title'> {
    return {
        title: 'Title',
        dataIndex: 'title',
        width: '100%',
        render: function Render(title, { short_id, is_template }) {
            return (
                <Link
                    data-attr="notebook-title"
                    to={urls.notebook(short_id)}
                    className="font-semibold flex items-center gap-2"
                >
                    {title || 'Untitled'}
                    {is_template && <Tag type="highlight">TEMPLATE</Tag>}
                </Link>
            )
        },
        sorter: (a, b) => (a.title ?? 'Untitled').localeCompare(b.title ?? 'Untitled'),
    }
}

export function NotebooksTable(): JSX.Element {
    const { notebooksAndTemplates, filters, notebooksResponseLoading, notebookTemplates, tableSorting, pagination } =
        useValues(notebooksTableLogic)
    const { loadNotebooks, setFilters, tableSortingChanged } = useActions(notebooksTableLogic)
    const { selectNotebook } = useActions(notebookPanelLogic)

    useOnMountEffect(loadNotebooks)

    const columns: TableColumns<NotebookListItemType> = [
        titleColumn() as TableColumn<NotebookListItemType, keyof NotebookListItemType | undefined>,

        createdByColumn<NotebookListItemType>() as TableColumn<
            NotebookListItemType,
            keyof NotebookListItemType | undefined
        >,
        atColumn<NotebookListItemType>('created_at', 'Created') as TableColumn<
            NotebookListItemType,
            keyof NotebookListItemType | undefined
        >,
        atColumn<NotebookListItemType>('last_modified_at', 'Last modified') as TableColumn<
            NotebookListItemType,
            keyof NotebookListItemType | undefined
        >,
        {
            render: function Render(_, notebook) {
                if (notebook.is_template) {
                    return null
                }
                return (
                    <Menu
                        items={[
                            {
                                label: 'Delete',
                                icon: <IconTrash />,
                                status: 'danger',

                                onClick: () => {
                                    notebooksModel.actions.deleteNotebook(notebook.short_id, notebook?.title)
                                },
                            },
                        ]}
                    >
                        <Button aria-label="more" icon={<IconEllipsis />} size="small" />
                    </Menu>
                )
            },
        },
    ]

    return (
        <div className="deprecated-space-y-4">
            <Banner
                type="info"
                action={{
                    onClick: () => {
                        selectNotebook(notebookTemplates[0].short_id)
                    },
                    children: 'Get started',
                }}
                dismissKey="notebooks-preview-banner"
            >
                <b>Welcome to Notebooks</b> - a great way to bring Insights, Replays, Feature Flags and many more
                Insights products together into one place.
            </Banner>
            <div className="flex justify-between gap-2 flex-wrap">
                <Input
                    type="search"
                    placeholder="Search for notebooks"
                    onChange={(s) => {
                        setFilters({ search: s })
                    }}
                    value={filters.search}
                    data-attr="notebooks-search"
                />
                <div className="flex items-center gap-2 flex-wrap">
                    <ContainsTypeFilters filters={filters} setFilters={setFilters} />
                    <div className="flex items-center gap-2">
                        <span>Created by:</span>
                        <MemberSelect
                            value={filters.createdBy}
                            onChange={(user) => setFilters({ createdBy: user?.uuid || null })}
                        />
                    </div>
                </div>
            </div>
            <Table
                data-attr="notebooks-table"
                pagination={pagination}
                dataSource={notebooksAndTemplates}
                rowKey="short_id"
                columns={columns}
                loading={notebooksResponseLoading}
                defaultSorting={tableSorting}
                emptyState="No notebooks matching your filters!"
                nouns={['notebook', 'notebooks']}
                onSort={tableSortingChanged}
            />
        </div>
    )
}
