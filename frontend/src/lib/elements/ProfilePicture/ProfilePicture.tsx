import './ProfilePicture.scss'

import clsx from 'clsx'
import { useValues } from 'kea'
import React from 'react'

import { fullName } from 'lib/utils/strings'
import { userLogic } from 'scenes/userLogic'

import { MascotConfig, MinimalMascotConfig, UserBasicType } from '~/types'

import { IconRobot } from '../icons'
import { Lettermark, LettermarkColor } from '../Lettermark/Lettermark'

export interface ProfilePictureProps {
    user?:
        | (Pick<Partial<UserBasicType>, 'first_name' | 'email' | 'last_name'> & {
              mascot_config?: MinimalMascotConfig | MascotConfig
          })
        | null
    name?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
    showName?: boolean
    className?: string
    title?: string
    index?: number
    type?: 'person' | 'bot' | 'system'
}

export const ProfilePicture = React.forwardRef<HTMLSpanElement, ProfilePictureProps>(function ProfilePicture(
    { user, name, size = 'lg', showName, className, index, title, type = 'person' },
    ref
) {
    const { user: currentUser } = useValues(userLogic)

    let email = user?.email

    if (user) {
        name = fullName(user)
        email = user.email
    }

    const combinedNameAndEmail = name && email ? `${name} <${email}>` : name || email

    const pictureComponent = (
        // `title` used to sit on the Gravatar image. It stays on the avatar so the
        // prop keeps meaning something for the callers that pass one.
        <span className={clsx('ProfilePicture ph-no-capture', size, className)} ref={ref} title={title}>
            {type === 'bot' ? (
                <IconRobot className="p-0.5" />
            ) : (
                <Lettermark
                    name={combinedNameAndEmail}
                    index={index}
                    rounded
                    color={type === 'system' ? LettermarkColor.Gray : undefined}
                />
            )}
        </span>
    )

    return !showName ? (
        pictureComponent
    ) : (
        <div className="profile-package" title={combinedNameAndEmail}>
            {pictureComponent}
            <span className="ph-no-capture profile-name">
                {currentUser?.email === email ? 'you' : name || email || 'an unknown user'}
            </span>
        </div>
    )
})
