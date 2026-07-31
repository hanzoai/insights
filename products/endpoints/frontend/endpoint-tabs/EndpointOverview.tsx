import { useValues } from 'kea'

import { Button, Label, Tag, ProfilePicture } from '@hanzo/elements'

import { TZLabel } from 'lib/components/TZLabel'
import { toast } from 'lib/elements/Toast/Toast'
import { Link } from 'lib/elements/Link'
import { urls } from 'scenes/urls'

import { endpointLogic } from '../endpointLogic'
import { EndpointTab, endpointSceneLogic } from '../endpointSceneLogic'

interface EndpointOverviewProps {
    tabId: string
}

export function EndpointOverview({ tabId }: EndpointOverviewProps): JSX.Element {
    const { endpoint } = useValues(endpointLogic({ tabId }))
    const { viewingVersion } = useValues(endpointSceneLogic({ tabId }))

    if (!endpoint) {
        return <></>
    }

    const isViewingOldVersion = viewingVersion && viewingVersion.version !== endpoint.current_version
    const versionUrl = isViewingOldVersion ? `${endpoint.endpoint_path}?version=${viewingVersion.version}` : null

    return (
        <div className="flex flex-col gap-4">
            {/* Row 1: Endpoint info (always shown) */}
            <div className="grid gap-2 overflow-hidden grid-cols-1 min-[1200px]:grid-cols-[1fr_26rem]">
                <div className="inline-flex deprecated-space-x-8">
                    <div className="flex flex-col w-28">
                        <Label>Endpoint status</Label>
                        <Tag type={endpoint.is_active ? 'success' : 'danger'} className="w-fit">
                            <b>{endpoint.is_active ? 'Active' : 'Inactive'}</b>
                        </Tag>
                    </div>
                    <div className="flex flex-col w-34">
                        <Label
                            info={
                                <>
                                    Versions auto-increment when the query changes. Access older versions in the{' '}
                                    <Link to={`${urls.endpoint(endpoint.name)}?tab=${EndpointTab.VERSIONS}`}>
                                        Versions tab
                                    </Link>
                                    .
                                </>
                            }
                        >
                            Current version
                        </Label>
                        <span className="text-sm font-semibold">v{endpoint.current_version}</span>
                    </div>
                    {!isViewingOldVersion && (
                        <div className="flex flex-col">
                            <Label>Endpoint URL</Label>
                            <Button
                                type="secondary"
                                size="xsmall"
                                onClick={() => {
                                    navigator.clipboard.writeText(endpoint.endpoint_path)
                                    toast.success('Endpoint URL copied to clipboard')
                                }}
                                className="font-mono text-xs"
                            >
                                {endpoint.endpoint_path}
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-4 overflow-hidden items-start min-[1200px]:items-end">
                    <div className="inline-flex deprecated-space-x-8">
                        <div className="flex flex-col">
                            <Label>Last executed</Label>
                            {endpoint.last_executed_at ? (
                                <TZLabel time={endpoint.last_executed_at} />
                            ) : (
                                <span className="text-muted">Never</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <Label>Created by</Label>
                            {endpoint.created_by && <ProfilePicture user={endpoint.created_by} size="md" showName />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Version info (only when viewing old version) */}
            {isViewingOldVersion && (
                <div className="inline-flex deprecated-space-x-8">
                    <div className="flex flex-col w-28">
                        <Label>Version status</Label>
                        <Tag type={viewingVersion.is_active ? 'success' : 'danger'} className="w-fit">
                            <b className="uppercase">{viewingVersion.is_active ? 'Active' : 'Inactive'}</b>
                        </Tag>
                    </div>
                    <div className="flex flex-col w-34">
                        <Label>Viewing version</Label>
                        <span className="text-sm font-semibold">v{viewingVersion.version}</span>
                    </div>
                    <div className="flex flex-col">
                        <Label>Version URL</Label>
                        <Button
                            type="secondary"
                            size="xsmall"
                            onClick={() => {
                                navigator.clipboard.writeText(versionUrl!)
                                toast.success('Version URL copied to clipboard')
                            }}
                            className="font-mono text-xs"
                        >
                            {versionUrl}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
