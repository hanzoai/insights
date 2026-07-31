import { useValues } from 'kea'

import { IconGear } from '@hanzo/icons'
import { Button, Switch, Link, Tooltip } from '@hanzo/elements'

import { IconBranch } from 'lib/elements/icons/icons'
import { urls } from 'scenes/urls'
import { userLogic } from 'scenes/userLogic'

import { AvailableFeature } from '~/types'

export const PathCleaningToggle = ({
    value,
    onChange,
}: {
    value: boolean
    onChange: (enabled: boolean) => void
}): JSX.Element | null => {
    const { hasAvailableFeature } = useValues(userLogic)
    const hasAdvancedPaths = hasAvailableFeature(AvailableFeature.PATHS_ADVANCED)

    if (!hasAdvancedPaths) {
        return null
    }

    return (
        <Tooltip
            title={
                <div className="p-2">
                    <p className="mb-2">
                        Path cleaning helps standardize URLs by removing unnecessary parameters and fragments.
                    </p>
                    <div className="mb-2">
                        <Link to="https://hanzo.ai/docs/product-analytics/paths#path-cleaning-rules">
                            Learn more about path cleaning rules
                        </Link>
                    </div>
                    <Button
                        icon={<IconGear />}
                        type="primary"
                        size="small"
                        to={urls.settings('project-product-analytics', 'path-cleaning')}
                        targetBlank
                        className="w-full"
                    >
                        Edit path cleaning settings
                    </Button>
                </div>
            }
            placement="top"
            interactive={true}
        >
            <Button icon={<IconBranch />} onClick={() => onChange(!value)} type="secondary" size="small">
                Path cleaning: <Switch checked={value} className="ml-1" />
            </Button>
        </Tooltip>
    )
}
