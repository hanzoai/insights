import { IconRefresh } from '@hanzo/icons'

import { Button } from 'lib/elements/Button'

export function ErrorNetwork(): JSX.Element {
    return (
        <div>
            <h1 className="mb-1 text-2xl font-bold">Network error</h1>
            <p>There was an issue loading the requested resource.</p>
            <p>
                <Button type="primary" onClick={() => window.location.reload()} icon={<IconRefresh />}>
                    Reload the page!
                </Button>
            </p>
        </div>
    )
}
