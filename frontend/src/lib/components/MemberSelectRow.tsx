import { Button, ProfilePicture } from '@hanzo/elements'

import { fullName } from 'lib/utils/strings'

import { OrganizationMemberType } from '~/types'

export type MemberSelectRowProps = {
    member: OrganizationMemberType
    isYou: boolean
    onClick: () => void
    /** Pass to render a selection checkbox (multi-select). Omit for single-select rows. */
    checked?: boolean
}

export function MemberSelectRow({ member, isYou, onClick, checked }: MemberSelectRowProps): JSX.Element {
    const isMultiSelect = checked !== undefined
    return (
        <li>
            <Button
                fullWidth
                role={isMultiSelect ? 'menuitemcheckbox' : 'menuitem'}
                aria-checked={checked}
                size="small"
                icon={<ProfilePicture size="md" user={member.user} />}
                onClick={onClick}
            >
                <span className="flex items-center justify-between gap-2 flex-1">
                    <span className="flex items-center gap-2 max-w-full">
                        {isMultiSelect && (
                            <input
                                type="checkbox"
                                className="cursor-pointer"
                                checked={checked}
                                readOnly
                                tabIndex={-1}
                                aria-hidden
                            />
                        )}
                        <span>{fullName(member.user)}</span>
                    </span>
                    <span className="text-secondary">{isYou ? '(you)' : ''}</span>
                </span>
            </Button>
        </li>
    )
}
