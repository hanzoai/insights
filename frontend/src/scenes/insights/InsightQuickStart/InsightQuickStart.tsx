import './InsightQuickStart.scss'

import { router } from 'kea-router'
import { useState } from 'react'

import { IconPlay, IconSparkles } from '@hanzo/icons'

import { Card } from 'lib/elements/Card'
import { Link } from 'lib/elements/Link'
import { INSIGHT_TYPE_URLS } from 'scenes/insights/utils'
import { INSIGHT_TYPES_METADATA } from 'scenes/saved-insights/SavedInsights'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { ProductKey } from '~/queries/schema/schema-general'
import { InsightType } from '~/types'

// Preview images/GIFs for each insight type
// Static images shown by default, GIFs play on hover
const INSIGHT_PREVIEWS: Partial<Record<InsightType, { static: string; animated: string }>> = {}

const AI_PREVIEW: { static: string; animated: string } | undefined = undefined

export const scene: SceneExport = {
    component: InsightQuickStart,
    productKey: ProductKey.PRODUCT_ANALYTICS,
}

interface InsightOptionCardProps {
    name: string
    description: string
    icon: React.ComponentType<any>
    iconClassName?: string
    url: string
    dataAttr: string
    preview?: { static: string; animated: string }
    docLink?: string
    index: number
}

function InsightOptionCard({
    name,
    description,
    icon: Icon,
    iconClassName = 'text-secondary',
    url,
    dataAttr,
    preview,
    docLink,
    index,
}: InsightOptionCardProps): JSX.Element {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            className="InsightQuickStart__card"
            style={{ animationDelay: `${index * 0.05}s` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Card
                className="cursor-pointer h-full overflow-hidden"
                data-attr={dataAttr}
                hoverEffect
                onClick={() => router.actions.push(url)}
            >
                <div className="flex flex-col gap-3 h-full">
                    {preview && (
                        <div className="relative w-full aspect-video overflow-hidden bg-fill-secondary">
                            <img
                                src={isHovered ? preview.animated : preview.static}
                                alt={`${name} preview`}
                                className="w-full h-full object-contain object-top transition-opacity duration-200"
                                loading="lazy"
                            />
                            <div
                                className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-[10px] font-medium text-white transition-opacity duration-200 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
                            >
                                <IconPlay className="w-3 h-3" />
                                <span>Hover to play</span>
                            </div>
                        </div>
                    )}
                    <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Icon className={`text-lg ${iconClassName}`} />
                            <div className="font-semibold text-default">{name}</div>
                        </div>
                        <div className="text-sm text-secondary leading-snug">{description}</div>
                    </div>
                    {docLink && (
                        <Link
                            to={docLink}
                            target="_blank"
                            className="text-xs mt-auto pt-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Learn more
                        </Link>
                    )}
                </div>
            </Card>
        </div>
    )
}

export function InsightQuickStart(): JSX.Element {
    const insightEntries = Object.entries(INSIGHT_TYPES_METADATA).filter(
        ([insightType, metadata]) =>
            metadata.inMenu &&
            insightType !== InsightType.JSON &&
            insightType !== InsightType.WEB_ANALYTICS &&
            insightType !== InsightType.SCRIPT
    )

    return (
        <SceneContent>
            <SceneTitleSection
                name="Create a new insight"
                description="Choose the type of insight that best fits your analysis needs"
                resourceType={{ type: 'product_analytics' }}
            />
            <div
                className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 pb-16"
                data-attr="insight-quick-start-page"
            >
                <InsightOptionCard
                    name="AI"
                    description="Ask Insights AI to create insights using natural language and query any of your data."
                    icon={IconSparkles}
                    iconClassName="text-ai"
                    url={urls.ai()}
                    dataAttr="insight-option-ai"
                    preview={AI_PREVIEW}
                    docLink="https://hanzo.ai/docs/insights-ai"
                    index={0}
                />
                {insightEntries.map(([insightType, metadata], index) => (
                    <InsightOptionCard
                        key={insightType}
                        name={metadata.name}
                        description={metadata.tooltipDescription || metadata.description || ''}
                        icon={metadata.icon}
                        url={INSIGHT_TYPE_URLS[insightType as InsightType]}
                        dataAttr={`insight-option-${insightType.toLowerCase()}`}
                        preview={INSIGHT_PREVIEWS[insightType as InsightType]}
                        docLink={metadata.tooltipDocLink}
                        index={index + 1}
                    />
                ))}
            </div>
        </SceneContent>
    )
}
