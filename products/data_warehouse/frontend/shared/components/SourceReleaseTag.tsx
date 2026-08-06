import { Tag } from '@hanzo/elements'

import { Tooltip } from 'lib/elements/Tooltip'

import { SourceConfig } from '~/queries/schema/schema-general'

export interface SourceReleaseTagProps {
    releaseStatus?: SourceConfig['releaseStatus']
}

export function SourceReleaseTag({ releaseStatus }: SourceReleaseTagProps): JSX.Element | null {
    if (releaseStatus === 'alpha') {
        return (
            <Tooltip title="Alpha means this is a new source and hasn't been extensively tested yet">
                <Tag type="danger">Alpha</Tag>
            </Tooltip>
        )
    }
    if (releaseStatus === 'beta') {
        return (
            <Tooltip title="Beta means this source has been tested and most rough edges have been ironed out — getting ready for general availability">
                <Tag type="completion">Beta</Tag>
            </Tooltip>
        )
    }
    return null
}
