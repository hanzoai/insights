import { BindLogic, useActions, useValues } from 'kea'
import { useEffect, useRef } from 'react'

import * as directorPng from '@hanzo/brand/hoggies/png/director'
import { IconBrowser, IconDownload } from '@hanzo/icons'
import { Tag, Spinner } from '@hanzo/elements'

import { pngHoggie } from 'lib/brand/hoggies'
import { AccessControlAction } from 'lib/components/AccessControlAction'
import { appEditorUrl } from 'lib/components/AuthorizedUrlList/authorizedUrlListLogic'
import { HeatmapCanvas } from 'lib/components/heatmaps/HeatmapCanvas'
import { MAX_HEATMAP_HEIGHT } from 'lib/components/heatmaps/heatmapDataLogic'
import { Banner } from 'lib/elements/Banner/Banner'
import { Button } from 'lib/elements/Button'
import { LoadingBar } from 'lib/elements/LoadingBar'
import { getAccessControlDisabledReason } from 'lib/utils/accessControlUtils'
import { FilterPanel } from 'scenes/heatmaps/components/FilterPanel'
import { HeatmapHeader } from 'scenes/heatmaps/components/HeatmapHeader'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneDivider } from '~/layout/scenes/components/SceneDivider'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { AccessControlLevel, AccessControlResourceType } from '~/types'

import { heatmapLogic } from './heatmapLogic'

const MascotDirector = pngHoggie(directorPng)

export const scene: SceneExport<{ id: string }> = {
    component: HeatmapScene,
    logic: heatmapLogic,
    paramsToProps: ({ params: { id } }) => ({ id }),
}

export function HeatmapScene({ id }: { id: string }): JSX.Element {
    const logicProps = { id: id }
    const logic = heatmapLogic(logicProps)

    const {
        name,
        loading,
        type,
        displayUrl,
        widthOverride,
        heightOverride,
        screenshotUrl,
        generatingScreenshot,
        screenshotLoaded,
        containerWidth,
        desiredNumericWidth,
        effectiveWidth,
        scalePercent,
        isHeightCapped,
        userAccessLevel,
    } = useValues(logic)
    const {
        setName,
        changeCaptureMethod,
        updateHeatmap,
        onIframeLoad,
        setScreenshotLoaded,
        setScreenshotError,
        exportHeatmap,
        setContainerWidth,
    } = useActions(logic)

    const toolbarAccessDisabledReason = getAccessControlDisabledReason(
        AccessControlResourceType.Toolbar,
        AccessControlLevel.Viewer
    )

    const measureRef = useRef<HTMLDivElement | null>(null)
    useEffect(() => {
        const measure = (): void => {
            if (measureRef.current) {
                const w = measureRef.current.getBoundingClientRect().width
                setContainerWidth(typeof w === 'number' ? w : null)
            }
        }
        measure()
        const onResize = (): void => {
            measure()
        }
        window.addEventListener('resize', onResize)
        return () => {
            window.removeEventListener('resize', onResize)
        }
    }, [setContainerWidth, widthOverride])

    if (loading) {
        return (
            <SceneContent>
                <Spinner />
            </SceneContent>
        )
    }

    return (
        <BindLogic logic={heatmapLogic} props={logicProps}>
            <SceneContent>
                <SceneTitleSection
                    name={name}
                    resourceType={{
                        type: 'heatmap',
                    }}
                    description={null}
                    canEdit
                    onNameChange={setName}
                    forceBackTo={{
                        name: 'Heatmaps',
                        path: urls.heatmaps(),
                        key: 'heatmaps',
                    }}
                    actions={
                        <>
                            <AccessControlAction
                                resourceType={AccessControlResourceType.Heatmap}
                                minAccessLevel={AccessControlLevel.Editor}
                                userAccessLevel={userAccessLevel ?? undefined}
                            >
                                <Button type="primary" onClick={updateHeatmap} size="small">
                                    Save
                                </Button>
                            </AccessControlAction>
                            <Button
                                onClick={exportHeatmap}
                                data-attr="export-heatmap"
                                type="secondary"
                                icon={<IconDownload />}
                                size="small"
                                tooltip="Export heatmap as PNG"
                                tooltipPlacement="bottom"
                                disabledReason={
                                    type === 'screenshot' && !screenshotUrl ? 'Screenshot is not ready' : undefined
                                }
                            >
                                Export
                            </Button>
                        </>
                    }
                />
                <Banner
                    type="info"
                    dismissKey={`heatmap-type-info:${id}:${type ?? 'unknown'}`}
                    className="mb-2"
                    action={{
                        size: 'small',
                        type: 'secondary',
                        children: 'Open in toolbar',
                        to: displayUrl
                            ? appEditorUrl(displayUrl, {
                                  userIntent: 'heatmaps',
                              })
                            : undefined,
                        targetBlank: true,
                        'data-attr': 'heatmaps-open-in-toolbar',
                        disabledReason: !displayUrl ? 'Select a URL first' : toolbarAccessDisabledReason,
                    }}
                >
                    You can also open your website using the toolbar and verify results there (useful for auth-protected
                    pages).
                </Banner>
                <HeatmapHeader />
                <FilterPanel captureMethod={type} onCaptureMethodChange={changeCaptureMethod} />
                <SceneDivider />
                {isHeightCapped && (
                    <Banner type="info" className="mb-2">
                        This heatmap is capped at {MAX_HEATMAP_HEIGHT.toLocaleString()}px tall to keep rendering fast,
                        so data below that point isn't shown.
                    </Banner>
                )}
                <div ref={measureRef} className="w-full">
                    <div
                        className="border mx-auto bg-surface-primary rounded-lg"
                        style={{ width: effectiveWidth ?? '100%' }}
                    >
                        <div className="p-2 border-b text-muted-foreground gap-x-2 flex items-center">
                            <IconBrowser /> {displayUrl}
                            {typeof widthOverride === 'number' && containerWidth && widthOverride > containerWidth ? (
                                <Tag className="ml-auto" type="highlight">
                                    Scaled to {scalePercent}% ({widthOverride}px →{' '}
                                    {Math.round(effectiveWidth as number)} px)
                                </Tag>
                            ) : null}
                        </div>
                        {type === 'screenshot' ? (
                            <div className="relative flex w-full justify-center flex-1" style={{ width: '100%' }}>
                                {generatingScreenshot ? (
                                    <div className="flex-1 flex items-center justify-center min-h-96">
                                        <style>{`@keyframes script-wobble{from{transform:rotate(0deg)}to{transform:rotate(5deg)}}`}</style>
                                        <div className="text-sm text-center font-semibold">
                                            <MascotDirector
                                                className="w-32 h-32 mx-auto mb-2"
                                                style={{
                                                    animation: 'script-wobble 1.2s ease-in-out infinite alternate',
                                                    transformOrigin: '50% 50%',
                                                }}
                                            />
                                            Taking screenshots of your page...
                                            <div className="text-muted text-xs mt-2">
                                                This usually takes a few minutes
                                            </div>
                                            <LoadingBar />
                                        </div>
                                    </div>
                                ) : screenshotUrl ? (
                                    <>
                                        {screenshotLoaded && (
                                            <HeatmapCanvas
                                                key={effectiveWidth ?? 'auto'}
                                                positioning="absolute"
                                                widthOverride={desiredNumericWidth ?? undefined}
                                                context="in-app"
                                            />
                                        )}
                                        <img
                                            id="heatmap-screenshot"
                                            src={screenshotUrl}
                                            alt="Website screenshot for heatmap analysis"
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                display: 'block',
                                            }}
                                            onLoad={() => {
                                                setScreenshotLoaded(true)
                                                setScreenshotError(null)
                                            }}
                                            className="rounded-b-lg border-l border-r border-b"
                                            onError={() => {
                                                setScreenshotLoaded(false)
                                                setScreenshotError('The screenshot failed to load.')
                                            }}
                                        />
                                    </>
                                ) : null}
                            </div>
                        ) : (
                            <div
                                className="relative"
                                // eslint-disable-next-line react/forbid-dom-props
                                style={{ height: heightOverride }}
                            >
                                <HeatmapCanvas
                                    positioning="absolute"
                                    widthOverride={desiredNumericWidth ?? undefined}
                                    context="in-app"
                                />
                                <iframe
                                    id="heatmap-iframe"
                                    title="Heatmap browser"
                                    className="bg-white rounded-b-lg"
                                    // eslint-disable-next-line react/forbid-dom-props
                                    style={{ width: '100%', height: heightOverride }}
                                    src={displayUrl || ''}
                                    onLoad={onIframeLoad}
                                    // these two sandbox values are necessary so that the site and toolbar can run
                                    // this is a very loose sandbox,
                                    // but we specify it so that at least other capabilities are denied
                                    sandbox="allow-scripts allow-same-origin"
                                    // we don't allow things such as camera access though
                                    allow=""
                                />
                            </div>
                        )}
                    </div>
                </div>
            </SceneContent>
        </BindLogic>
    )
}
