import { IconGithub } from '@hanzo/icons'

import { IconGitlab, IconGoogle, IconKey } from 'lib/elements/icons'

import { SSOProvider } from '~/types'

export const SocialLoginIcon = ({
    provider,
    ...props
}: {
    provider: SSOProvider
    className?: string
}): JSX.Element | null => {
    if (provider === 'google-oauth2') {
        return <IconGoogle {...props} />
    } else if (provider === 'github') {
        return <IconGithub {...props} />
    } else if (provider === 'gitlab') {
        return <IconGitlab {...props} />
    } else if (provider === 'saml') {
        return <IconKey {...props} />
    } else if (provider === 'oidc') {
        return (
            <img
                src="https://cdn.hanzo.ai/img/logo-white.svg"
                alt="Hanzo"
                style={{ width: 28, height: 28, objectFit: 'contain' }}
                {...(props as any)}
            />
        )
    }
    return null
}
