import { Link } from '@hanzo/lemon-ui'

import defaultLogo from 'public/hanzo-logo.svg'

export function WelcomeLogo({ view: _view }: { view?: string }): JSX.Element {
    return (
        <Link to="https://insights.hanzo.ai" className="flex flex-col items-center mb-8">
            <img src={defaultLogo} alt="Insights" className="h-6 invert dark:invert-0" />
        </Link>
    )
}
