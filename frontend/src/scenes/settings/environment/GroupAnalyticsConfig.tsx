import { useActions, useValues } from 'kea'

import { IconTrash } from '@hanzo/icons'
import { Button, Dialog, Input, Link } from '@hanzo/elements'

import { GroupsAccessStatus, groupsAccessLogic } from 'lib/introductions/groupsAccessLogic'
import { Banner } from 'lib/elements/Banner'
import { Table, TableColumns } from 'lib/elements/Table'
import { GroupsIntroduction } from 'scenes/groups/GroupsIntroduction'

import { GroupType } from '~/types'

import { groupAnalyticsConfigLogic } from './groupAnalyticsConfigLogic'

export interface DeleteGroupTypeDialogProps {
    onConfirm: () => void
    groupTypeName: string
}

export function openDeleteGroupTypeDialog({ onConfirm, groupTypeName }: DeleteGroupTypeDialogProps): void {
    const groupType = groupTypeName.toLowerCase()
    Dialog.open({
        title: `Delete ${groupType} group type`,
        description: (
            <div className="mt-2 w-150">
                Deleting a group type is irreversible.
                <br />
                <br />
                You will not be able to assign existing events from this group type to another group type created in the
                future, only new events.
                <br />
                <br />
                For more information about groups, see{' '}
                <Link to="https://hanzo.ai/docs/product-analytics/group-analytics" target="_blank">
                    the docs
                </Link>
            </div>
        ),
        secondaryButton: {
            type: 'secondary',
            children: 'Cancel',
        },
        primaryButton: {
            type: 'primary',
            status: 'danger',
            onClick: onConfirm,
            children: `Delete ${groupType}`,
        },
    })
}

export function GroupAnalyticsConfig(): JSX.Element | null {
    const { groupTypes, groupTypesLoading, singularChanges, pluralChanges, hasChanges } =
        useValues(groupAnalyticsConfigLogic)
    const { setSingular, setPlural, reset, save, deleteGroupType } = useActions(groupAnalyticsConfigLogic)

    const { groupsAccessStatus, needsUpgradeForGroups } = useValues(groupsAccessLogic)

    if (needsUpgradeForGroups) {
        return <GroupsIntroduction />
    }

    const columns: TableColumns<GroupType> = [
        {
            title: 'Group type',
            tooltip: 'As used in code',
            dataIndex: 'group_type',
            key: 'name',
            render: function RenderName(name) {
                return name
            },
        },
        {
            title: 'Singular name',
            key: 'singular',
            render: function Render(_, groupType) {
                return (
                    <Input
                        value={
                            singularChanges[groupType.group_type_index] ||
                            groupType.name_singular ||
                            groupType.group_type
                        }
                        onChange={(e) => setSingular(groupType.group_type_index, e)}
                    />
                )
            },
        },
        {
            title: 'Plural name',
            key: 'plural',
            render: function Render(_, groupType) {
                return (
                    <Input
                        value={
                            pluralChanges[groupType.group_type_index] ||
                            groupType.name_plural ||
                            `${groupType.group_type}(s)`
                        }
                        onChange={(e) => setPlural(groupType.group_type_index, e)}
                    />
                )
            },
        },
        {
            title: '',
            key: 'delete',
            width: 24,
            render: function Render(_, groupType) {
                return (
                    <Button
                        status="danger"
                        size="small"
                        icon={<IconTrash />}
                        onClick={() =>
                            openDeleteGroupTypeDialog({
                                onConfirm: () => deleteGroupType(groupType.group_type_index),
                                groupTypeName: groupType.group_type,
                            })
                        }
                    />
                )
            },
        },
    ]

    return (
        <>
            {groupsAccessStatus !== GroupsAccessStatus.AlreadyUsing && (
                <Banner type="info" className="mb-4">
                    Group types will show up here after you send your first event associated with a group. Take a look
                    at{' '}
                    <Link to="https://hanzo.ai/docs/product-analytics/group-analytics" target="_blank">
                        this guide
                    </Link>{' '}
                    for more information on getting started.
                </Banner>
            )}

            <Table columns={columns} dataSource={Array.from(groupTypes.values())} loading={groupTypesLoading} />

            <div className="flex gap-2 mt-4">
                <Button
                    type="primary"
                    disabledReason={!hasChanges && 'Make some changes before saving'}
                    onClick={save}
                >
                    Save
                </Button>
                <Button disabledReason={!hasChanges && 'Revert any changes made'} onClick={reset}>
                    Cancel
                </Button>
            </div>
        </>
    )
}
