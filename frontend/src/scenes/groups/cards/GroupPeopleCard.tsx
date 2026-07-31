import { Button } from 'lib/elements/Button'
import { urls } from 'scenes/urls'

import { Group } from '~/types'

import { RelatedGroups } from '../RelatedGroups'

export function GroupPeopleCard({ groupData }: { groupData: Group }): JSX.Element {
    return (
        <div className="flex flex-col gap-2">
            <RelatedGroups
                groupTypeIndex={groupData.group_type_index}
                id={groupData.group_key}
                type="person"
                pageSize={5}
            />
            <div className="flex justify-end">
                <Button
                    type="secondary"
                    size="small"
                    to={urls.group(groupData.group_type_index, groupData.group_key, true, 'related')}
                >
                    View people
                </Button>
            </div>
        </div>
    )
}
