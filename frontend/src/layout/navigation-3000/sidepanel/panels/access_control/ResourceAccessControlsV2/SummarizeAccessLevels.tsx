import { capitalizeFirstLetter } from 'kea-forms'

import { Tag } from '@hanzo/elements'

import { pluralizeResource } from 'lib/utils/accessControlUtils'

import type { APIScopeObject } from '~/types'

export interface SummarizeAccessLevelsProps {
    accessControlByResource: Record<APIScopeObject, { access_level?: string | null } | undefined>
}

export function SummarizeAccessLevels({ accessControlByResource }: SummarizeAccessLevelsProps): JSX.Element {
    const entries = Object.entries(accessControlByResource)
        .map(([resource, ac]) => ({ resource, level: ac?.access_level }))
        .filter((entry) => entry.level !== null && entry.level !== undefined)

    if (entries.length === 0) {
        return <span>No default permissions</span>
    }

    return (
        <div className="flex gap-2 flex-wrap">
            {entries.map(({ resource, level }) => (
                <Tag key={resource} type="default">
                    {capitalizeFirstLetter(
                        resource === 'project' ? resource : pluralizeResource(resource as APIScopeObject)
                    )}
                    : {capitalizeFirstLetter(level!)}
                </Tag>
            ))}
        </div>
    )
}
