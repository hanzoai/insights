import { useActions, useValues } from 'kea'

import { IconTrash } from '@hanzo/icons'
import { Divider, Modal, Link } from '@hanzo/elements'

import { usersLemonSelectOptions } from 'lib/components/UserSelectItem'
import { Button } from 'lib/elements/Button'
import { InputSelect } from 'lib/elements/InputSelect/InputSelect'
import { Table, TableColumns } from 'lib/elements/Table'
import { Tag } from 'lib/elements/Tag/Tag'
import { ProfilePicture } from 'lib/elements/ProfilePicture'
import { userLogic } from 'scenes/userLogic'

import { UserType } from '~/types'

import { staffUsersLogic } from './staffUsersLogic'

export function StaffUsersTab(): JSX.Element {
    const { user: myself } = useValues(userLogic)
    const { staffUsers, allUsersLoading, nonStaffUsers, staffUsersToBeAdded, staffUserToBeDeleted } =
        useValues(staffUsersLogic)
    const { setStaffUsersToBeAdded, addStaffUsers, deleteStaffUser, setStaffUserToBeDeleted } =
        useActions(staffUsersLogic)

    const columns: TableColumns<UserType> = [
        {
            key: 'profile_picture',
            render: function ProfilePictureRender(_, user) {
                return <ProfilePicture user={user} />
            },
            width: 32,
        },
        {
            key: 'name',
            title: 'Name',
            dataIndex: 'first_name',
            render: function ProfilePictureRender(_, user) {
                return (
                    <>
                        <span className="ph-no-capture">{user.first_name}</span>
                        {user.uuid === myself?.uuid && <Tag className="uppercase ml-1">Me</Tag>}
                    </>
                )
            },
        },
        {
            key: 'email',
            title: 'Email',
            dataIndex: 'email',
            render: (_, user) => <span className="ph-no-capture">{user.email}</span>,
        },
        {
            key: 'actions',
            width: 32,
            render: function RenderActions(_, user) {
                return (
                    <Button
                        data-attr="invite-delete"
                        icon={<IconTrash />}
                        status="danger"
                        disabledReason={staffUsers.length < 2 && 'At least one staff user must remain'}
                        title={
                            staffUsers.length < 2
                                ? 'You should always have at least one staff user.'
                                : 'Cancel the invite'
                        }
                        onClick={() => setStaffUserToBeDeleted(user)}
                    />
                )
            },
        },
    ]

    return (
        <div>
            <h3 className="l3 mt-4">Staff Users</h3>
            <div className="mb-4">
                Users who have permissions to manage instance-wide settings. Staff user permissions are set at the{' '}
                <b>instance-level and are independent of any organization or project permissions.</b>{' '}
                <Link
                    to="https://hanzo.ai/docs/self-host/configure/instance-settings#staff-users"
                    target="_blank"
                    targetBlankIcon
                >
                    Learn more
                </Link>
                .
            </div>
            <Divider className="mb-4" />
            <section>
                <div className="flex gap-2 mb-4">
                    <div className="flex-1">
                        <InputSelect
                            placeholder="Add staff users here…"
                            loading={allUsersLoading}
                            value={staffUsersToBeAdded}
                            onChange={(newValues: string[]) => setStaffUsersToBeAdded(newValues)}
                            mode="multiple"
                            data-attr="subscribed-emails"
                            options={usersLemonSelectOptions(nonStaffUsers, 'uuid')}
                        />
                    </div>
                    <Button
                        type="primary"
                        loading={allUsersLoading}
                        disabled={staffUsersToBeAdded.length === 0}
                        onClick={addStaffUsers}
                    >
                        Add
                    </Button>
                </div>
            </section>
            <Table dataSource={staffUsers} columns={columns} loading={allUsersLoading} rowKey="uuid" />
            <StaffUsersRemovalModal
                myself={myself}
                user={staffUserToBeDeleted}
                onClose={() => setStaffUserToBeDeleted(null)}
                onRemove={() => {
                    if (staffUserToBeDeleted) {
                        deleteStaffUser(staffUserToBeDeleted.uuid)
                        setStaffUserToBeDeleted(null)
                    }
                }}
            />
        </div>
    )
}

const StaffUsersRemovalModal = ({
    myself,
    user,
    onClose,
    onRemove,
}: {
    myself: UserType | null
    user: UserType | null
    onClose: () => void
    onRemove: () => void
}): JSX.Element => {
    return (
        <Modal
            closable={false}
            isOpen={!!user}
            title={`Remove ${myself?.uuid === user?.uuid ? 'yourself' : user?.first_name} as a Staff User?`}
            onClose={onClose}
            footer={
                <>
                    <Button type="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        form="text-tile-form"
                        htmlType="submit"
                        type="primary"
                        status="danger"
                        onClick={onRemove}
                    >
                        Remove user
                    </Button>
                </>
            }
        >
            <div className="border-none">
                {myself?.uuid === user?.uuid ? (
                    <>
                        Please confirm you want to <b>remove yourself</b> as a staff user.
                        <div className="font-normal text-secondary">
                            Only another staff user will be able to add you again.
                        </div>
                    </>
                ) : (
                    `Are you sure you want to remove ${user?.first_name} as a Staff User?`
                )}
            </div>
        </Modal>
    )
}
