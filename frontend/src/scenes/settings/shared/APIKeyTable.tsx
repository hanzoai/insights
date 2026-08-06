import { IconEllipsis } from '@hanzo/icons'
import { Button, Dialog, Menu, Table, TableColumn, Tag, Tooltip } from '@hanzo/elements'

import { Link } from 'lib/elements/Link'
import { detailedTime, humanFriendlyDetailedTime } from 'lib/utils/datetime'

export interface APIKeyTableRow {
    id: string
    label: string
    mask_value?: string | null
    scopes: string[]
    created_at: string
    created_by?: {
        email: string
        first_name?: string
    } | null
    last_used_at: string | null
    last_rolled_at: string | null
}

interface APIKeyTableProps<T extends APIKeyTableRow = APIKeyTableRow> {
    keys: T[]
    loading: boolean
    onEdit: (id: string) => void
    onRoll: (id: string) => void
    onDelete: (id: string) => void
    noun: string
    showCreatedBy?: boolean
    showActions?: boolean

    /** Render override for the label cell — defaults to a plain Link that opens the edit modal. */
    renderLabel?: (key: T) => JSX.Element
    /** Render override for the secret-key (mask_value) cell — defaults to a monospace span. */
    renderMaskValue?: (key: T) => JSX.Element
    /** Render override for the scopes cell — defaults to a TagList. */
    renderScopes?: (key: T) => JSX.Element
    /** Extra columns inserted between Label and Secret key. */
    extraColumnsAfterLabel?: TableColumn<T, any>[]
    /** Extra columns inserted between Scopes and Last used. */
    extraColumnsAfterScopes?: TableColumn<T, any>[]
    /** Per-row className (e.g. for opacity on disabled keys). */
    rowClassName?: (key: T) => string
    /** Override the delete dialog description. */
    deleteDescription?: string
}

function TagList({ tags, onMoreClick }: { tags: string[]; onMoreClick: () => void }): JSX.Element {
    return (
        <span className="flex flex-wrap gap-1">
            {tags.slice(0, 4).map((x) => (
                <Tag key={x}>{x}</Tag>
            ))}
            {tags.length > 4 && (
                <Tooltip title={tags.slice(4).join(', ')}>
                    <Tag onClick={onMoreClick}>+{tags.length - 4} more</Tag>
                </Tooltip>
            )}
        </span>
    )
}

export function APIKeyTable<T extends APIKeyTableRow = APIKeyTableRow>({
    keys,
    loading,
    onEdit,
    onRoll,
    onDelete,
    noun,
    showCreatedBy = false,
    showActions = false,
    renderLabel,
    renderMaskValue,
    renderScopes,
    extraColumnsAfterLabel,
    extraColumnsAfterScopes,
    rowClassName,
    deleteDescription = 'This action cannot be undone.',
}: APIKeyTableProps<T>): JSX.Element {
    const labelColumn: TableColumn<T, any> = {
        title: 'Label',
        dataIndex: 'label',
        key: 'label',
        render: function RenderLabel(_label: any, key: T) {
            if (renderLabel) {
                return renderLabel(key)
            }
            return (
                <Link subtle className="text-left font-semibold truncate" onClick={() => onEdit(key.id)}>
                    {String(key.label)}
                </Link>
            )
        },
    }

    const secretKeyColumn: TableColumn<T, any> = {
        title: 'Secret key',
        dataIndex: 'mask_value',
        key: 'mask_value',
        render: (_: any, key: T) => {
            if (renderMaskValue) {
                return renderMaskValue(key)
            }
            return key.mask_value ? (
                <span className="font-mono">{key.mask_value}</span>
            ) : (
                <Tooltip title="This key was created before the introduction of previews">
                    <span className="inline-flex items-center gap-1">
                        <span>No preview</span>
                    </span>
                </Tooltip>
            )
        },
    }

    const scopesColumn: TableColumn<T, any> = {
        title: 'Scopes',
        key: 'scopes',
        dataIndex: 'scopes',
        render: function RenderScopes(_: any, key: T) {
            if (renderScopes) {
                return renderScopes(key)
            }
            return <TagList tags={key.scopes} onMoreClick={() => onEdit(key.id)} />
        },
    }

    const createdByColumn: TableColumn<T, any> = {
        title: 'Created by',
        key: 'created_by',
        dataIndex: 'created_by',
        render: (_: any, key: T) =>
            key.created_by ? `${key.created_by.first_name || key.created_by.email}` : 'Unknown',
    }

    const lastUsedColumn: TableColumn<T, any> = {
        title: 'Last used',
        dataIndex: 'last_used_at',
        key: 'lastUsedAt',
        sorter: (a: T, b: T) => {
            if (!a.last_used_at && !b.last_used_at) {
                return 0
            }
            if (!a.last_used_at) {
                return -1
            }
            if (!b.last_used_at) {
                return 1
            }
            return new Date(a.last_used_at).getTime() - new Date(b.last_used_at).getTime()
        },
        render: (_: any, key: T) => (
            <Tooltip title={detailedTime(key.last_used_at)}>
                {humanFriendlyDetailedTime(key.last_used_at, 'MMMM DD, YYYY', 'h A')}
            </Tooltip>
        ),
    }

    const createdColumn: TableColumn<T, any> = {
        title: 'Created',
        dataIndex: 'created_at',
        key: 'createdAt',
        render: (_: any, key: T) => (
            <Tooltip title={detailedTime(key.created_at)}>{humanFriendlyDetailedTime(key.created_at)}</Tooltip>
        ),
    }

    const lastRolledColumn: TableColumn<T, any> = {
        title: 'Last rolled',
        dataIndex: 'last_rolled_at',
        key: 'lastRolledAt',
        render: (_: any, key: T) => (
            <Tooltip title={detailedTime(key.last_rolled_at)}>
                {humanFriendlyDetailedTime(key.last_rolled_at, 'MMMM DD, YYYY', 'h A')}
            </Tooltip>
        ),
    }

    const actionsColumn: TableColumn<T, any> = {
        title: '',
        key: 'actions',
        align: 'right' as const,
        width: 0,
        render: (_: any, key: T) => (
            <Menu
                items={[
                    {
                        label: 'Edit',
                        onClick: () => onEdit(key.id),
                    },
                    {
                        label: 'Roll',
                        onClick: () => {
                            Dialog.open({
                                title: `Roll key "${key.label}"?`,
                                description: 'This will generate a new key. The old key will immediately stop working.',
                                primaryButton: {
                                    status: 'danger',
                                    children: 'Roll',
                                    onClick: () => onRoll(key.id),
                                },
                                secondaryButton: {
                                    children: 'Cancel',
                                },
                            })
                        },
                    },
                    {
                        label: 'Delete',
                        status: 'danger',
                        onClick: () => {
                            Dialog.open({
                                title: `Permanently delete key "${key.label}"?`,
                                description: deleteDescription,
                                primaryButton: {
                                    status: 'danger',
                                    children: 'Permanently delete',
                                    onClick: () => onDelete(key.id),
                                },
                            })
                        },
                    },
                ]}
            >
                <Button size="small" icon={<IconEllipsis />} />
            </Menu>
        ),
    }

    const columns: TableColumn<T, any>[] = [
        labelColumn,
        ...(extraColumnsAfterLabel ?? []),
        secretKeyColumn,
        scopesColumn,
        ...(extraColumnsAfterScopes ?? []),
        ...(showCreatedBy ? [createdByColumn] : []),
        lastUsedColumn,
        createdColumn,
        lastRolledColumn,
        ...(showActions ? [actionsColumn] : []),
    ]

    return (
        <Table
            dataSource={keys}
            loading={loading}
            loadingSkeletonRows={3}
            className="mt-4"
            nouns={[noun, `${noun}s`]}
            rowClassName={rowClassName}
            columns={columns}
        />
    )
}
