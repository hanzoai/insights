import { Link } from '@hanzo/elements'

import { Logo } from 'lib/brand'

export function WelcomeLogo({ view }: { view?: string }): JSX.Element {
    const UTM_TAGS = `utm_campaign=in-product&utm_tag=${view || 'welcome'}-header`
    const logoHref = `https://hanzo.ai?${UTM_TAGS}`

    return (
        <Link to={logoHref} className="flex flex-col items-center mb-8" aria-label="hanzo.ai">
            <Logo size="md" className="shrink-0" aria-hidden />
        </Link>
    )
}
