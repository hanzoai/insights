import { Skeleton } from '@hanzo/elements'

import { Link } from 'lib/elements/Link'
import { Tooltip } from 'lib/elements/Tooltip'

import { PluginType } from '~/types'

import { PluginImage, PluginImageSize } from './PipelinePluginImage'

type RenderAppProps = {
    /** If the plugin is null, a skeleton will be rendered. */
    plugin: PluginType | null
    imageSize?: PluginImageSize
}

export function RenderApp({ plugin, imageSize = 'small' }: RenderAppProps): JSX.Element {
    if (!plugin) {
        return <Skeleton className="w-15 h-15" />
    }

    return (
        <div className="flex gap-4 items-center">
            <Tooltip
                title={
                    <>
                        {plugin.name}
                        <br />
                        {plugin.description}
                        <br />
                        {plugin.url ? 'Click to view app source code' : 'No source code available'}
                    </>
                }
            >
                {plugin.url && plugin.plugin_type !== 'inline' ? (
                    <Link to={plugin.url} target="_blank">
                        <PluginImage plugin={plugin} size={imageSize} />
                    </Link>
                ) : (
                    <span>
                        <PluginImage plugin={plugin} size={imageSize} />
                    </span>
                )}
            </Tooltip>
        </div>
    )
}
