import { useValues } from 'kea'
import { useMemo } from 'react'

import { IconWrench } from '@hanzo/icons'
import { Skeleton } from '@hanzo/elements'

import { Link } from 'lib/elements/Link'
import { Tooltip } from 'lib/elements/Tooltip'
import { getDataWarehouseSourceUrl } from 'scenes/data-warehouse/settings/DataWarehouseManagedSourcesTable'

import IconInsights from 'public/insights-icon.svg'
import IconAwsS3 from 'public/services/aws-s3.png'
import Iconazure from 'public/services/azure.png'
import IconCloudflare from 'public/services/cloudflare.png'
import IconGoogleCloudStorage from 'public/services/google-cloud-storage.png'

import { availableSourcesDataLogic } from '../new/availableSourcesDataLogic'

/**
 * In some cases we don't have the backend telling us what provider we have for blob storage, so we can have some
 * heuristic to guess, then fallback to a default icon.
 * @param url
 */
export function mapUrlToProvider(url: string): string {
    if (url.includes('amazonaws.com')) {
        return 'aws'
    } else if (url.startsWith('https://storage.googleapis.com')) {
        return 'google-cloud'
    } else if (url.includes('.blob.')) {
        return 'azure'
    } else if (url.includes('.r2.cloudflarestorage.com')) {
        return 'cloudflare-r2'
    }
    return 'Insights'
}

export function mapUrlToSourceName(url: string): string {
    if (url.includes('amazonaws.com')) {
        return 'AWS'
    } else if (url.startsWith('https://storage.googleapis.com')) {
        return 'GCS'
    } else if (url.includes('.blob.')) {
        return 'Azure'
    } else if (url.includes('.r2.cloudflarestorage.com')) {
        return 'Cloudflare'
    }
    return 'Insights'
}

const SIZE_PX_MAP = {
    xsmall: 16,
    small: 30,
    medium: 60,
}

export const DATA_WAREHOUSE_SOURCE_ICON_MAP: Record<string, string> = {
    aws: IconAwsS3,
    'google-cloud': IconGoogleCloudStorage,
    'cloudflare-r2': IconCloudflare,
    azure: Iconazure,
    Insights: IconInsights,
}

export const DATA_WAREHOUSE_SOURCE_ICON_COMPONENT_MAP: Record<string, JSX.Element> = {
    System: <IconWrench />,
}

export function DataWarehouseSourceIcon({
    type,
    size = 'small',
    sizePx: sizePxProps,
    disableTooltip = false,
}: {
    type: string
    size?: 'xsmall' | 'small' | 'medium'
    sizePx?: number
    disableTooltip?: boolean
}): JSX.Element | null {
    const { availableSources, availableSourcesLoading } = useValues(availableSourcesDataLogic)

    const icon = useMemo(() => {
        if (!availableSources) {
            return null
        }

        const sourceConfig = availableSources[type]
        if (sourceConfig) {
            return sourceConfig.iconPath
        }

        const icon = DATA_WAREHOUSE_SOURCE_ICON_MAP[type]
        if (icon) {
            return icon
        }

        const component = DATA_WAREHOUSE_SOURCE_ICON_COMPONENT_MAP[type]

        return component ?? null
    }, [availableSources, type])

    if (availableSourcesLoading || !availableSources) {
        return <Skeleton />
    }

    if (!icon) {
        return null
    }

    const sizePx = sizePxProps ?? SIZE_PX_MAP[size]

    if (disableTooltip) {
        return (
            <div className="flex gap-4 items-center">
                {typeof icon === 'object' ? (
                    icon
                ) : (
                    <img
                        src={icon}
                        alt={type}
                        height={sizePx}
                        width={sizePx}
                        className="object-contain max-w-none rounded"
                    />
                )}
            </div>
        )
    }

    return (
        <div className="flex gap-4 items-center">
            <Tooltip
                title={
                    <>
                        {type}
                        <br />
                        Click to view docs
                    </>
                }
            >
                <Link to={getDataWarehouseSourceUrl(type)}>
                    {typeof icon === 'object' ? (
                        icon
                    ) : (
                        <img
                            src={icon}
                            alt={type}
                            height={sizePx}
                            width={sizePx}
                            className="object-contain max-w-none rounded"
                        />
                    )}
                </Link>
            </Tooltip>
        </div>
    )
}
