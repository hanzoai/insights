import { IconAIText } from '@hanzo/icons'
import { Banner, Tag, TagType, Tooltip } from '@hanzo/elements'

const BANNER_TO_TAG_TYPE: Record<SeverityBannerProps['type'], TagType> = {
    error: 'danger',
    warning: 'warning',
    success: 'success',
    info: 'default',
}

export interface SeverityBannerProps {
    type: 'info' | 'warning' | 'error' | 'success'
    headline: string
    impact: string
    severityLabel: string
}

export function SeverityBanner({ type, headline, impact, severityLabel }: SeverityBannerProps): JSX.Element {
    return (
        <Banner type={type} hideIcon={false} icon={<IconAIText className="text-lg" />}>
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <Tooltip title="AI's assessment of this log's severity">
                        <Tag type={BANNER_TO_TAG_TYPE[type]} size="small">
                            {severityLabel}
                        </Tag>
                    </Tooltip>
                    <span className="font-semibold">{headline}</span>
                </div>
                <span className="text-sm opacity-80">{impact}</span>
            </div>
        </Banner>
    )
}
