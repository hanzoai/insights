import { InputSelectOption } from 'lib/elements/InputSelect'
import { ProfilePicture } from 'lib/elements/ProfilePicture'
import { fullName } from 'lib/utils/strings'

import { UserBasicType, UserType } from '~/types'

export interface UserSelectItemProps {
    user: UserBasicType | UserType
}

export function UserSelectItem({ user }: UserSelectItemProps): JSX.Element {
    return (
        <span className="ph-no-capture flex gap-2 items-center">
            <ProfilePicture user={user} size="sm" />
            <span>
                {fullName(user)} <b>{`<${user.email}>`}</b>
            </span>
        </span>
    )
}

export function usersLemonSelectOptions(
    users: (UserBasicType | UserType)[],
    key: 'email' | 'uuid' = 'email'
): InputSelectOption[] {
    return users.map((user) => ({
        key: user[key],
        label: `${fullName(user)} ${user.email}`,
        labelComponent: <UserSelectItem user={user} />,
    }))
}
