import { useEffect, useState, type ReactNode } from 'react'

import { IconPlus } from '@hanzo/icons'
import { Button, Input, Tooltip } from '@hanzo/elements'

import { Modal } from 'lib/elements/Modal'
import { Table, TableColumns } from 'lib/elements/Table'

export type MarkdownNotebookEntityListPickerItem = {
    id: string | number
    name: string
    description?: string | null
}

export type MarkdownNotebookEntityListPickerProps = {
    isOpen: boolean
    title: string
    searchPlaceholder: string
    entityIcon?: ReactNode
    /** Loads the pickable entities when the modal opens; typed search filters client-side. */
    loadItems: () => Promise<MarkdownNotebookEntityListPickerItem[]>
    onClose: () => void
    onSelect: (item: MarkdownNotebookEntityListPickerItem) => void
}

/** Entity picker for insert-menu commands whose entity has no taxonomic group (surveys, early
 * access features, …): a searchable one-page list, matching the experiment picker's table feel. */
export function MarkdownNotebookEntityListPicker({
    isOpen,
    title,
    searchPlaceholder,
    entityIcon,
    loadItems,
    onClose,
    onSelect,
}: MarkdownNotebookEntityListPickerProps): JSX.Element {
    const [search, setSearch] = useState('')
    const [items, setItems] = useState<MarkdownNotebookEntityListPickerItem[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) {
            setSearch('')
            return
        }

        let cancelled = false
        setIsLoading(true)
        loadItems()
            .then((loadedItems) => {
                if (!cancelled) {
                    setItems(loadedItems)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setItems([])
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false)
                }
            })
        return () => {
            cancelled = true
        }
    }, [isOpen, loadItems])

    const normalizedSearch = search.trim().toLowerCase()
    const filteredItems = normalizedSearch
        ? items.filter((item) => item.name.toLowerCase().includes(normalizedSearch))
        : items

    const columns: TableColumns<MarkdownNotebookEntityListPickerItem> = [
        ...(entityIcon
            ? [
                  {
                      key: 'icon',
                      width: 32,
                      render: function renderIcon() {
                          return <span className="text-secondary text-2xl">{entityIcon}</span>
                      },
                  },
              ]
            : []),
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: function renderName(_, item) {
                return (
                    <div className="flex flex-col gap-1 min-w-0 overflow-hidden">
                        <Tooltip title={item.name}>
                            <span className="block truncate max-w-full font-medium">{item.name}</span>
                        </Tooltip>
                        {item.description ? (
                            <Tooltip title={item.description}>
                                <div className="text-xs text-tertiary line-clamp-2">{item.description}</div>
                            </Tooltip>
                        ) : null}
                    </div>
                )
            },
        },
        {
            key: 'action',
            width: 32,
            render: function renderAction() {
                return (
                    <IconPlus className="text-muted text-xl opacity-40 group-hover:opacity-100 group-hover:text-success transition-all" />
                )
            },
        },
    ]

    return (
        <Modal
            title={title}
            onClose={onClose}
            isOpen={isOpen}
            footer={
                <Button type="secondary" data-attr="markdown-notebook-entity-picker-cancel" onClick={onClose}>
                    Close
                </Button>
            }
        >
            <div className="mb-3">
                <Input
                    type="search"
                    placeholder={searchPlaceholder}
                    autoFocus
                    value={search}
                    onChange={setSearch}
                />
            </div>
            <Table
                dataSource={filteredItems}
                columns={columns}
                loading={isLoading}
                rowKey="id"
                rowClassName="group cursor-pointer hover:bg-success-highlight/30"
                onRow={(item) => ({
                    onClick: () => onSelect(item),
                    title: 'Click to select',
                })}
                emptyState="Nothing found"
            />
        </Modal>
    )
}
