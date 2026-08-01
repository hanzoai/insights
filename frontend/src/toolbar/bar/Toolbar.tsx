import './Toolbar.scss'

import clsx from 'clsx'
import { useActions, useValues } from 'kea'
import { Insights } from 'insights-js'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'

import {
    IconApp,
    IconBolt,
    IconCamera,
    IconCheck,
    IconCursorClick,
    IconDay,
    IconEye,
    IconFlask,
    IconHide,
    IconLeave,
    IconLive,
    IconMessage,
    IconNight,
    IconPieChart,
    IconQuestion,
    IconSearch,
    IconSpotlight,
    IconStethoscope,
    IconToggle,
    IconWarning,
    IconX,
} from '@hanzo/icons'
import { Badge, Spinner } from '@hanzo/elements'

import { useKeyboardHotkeys } from 'lib/hooks/useKeyboardHotkeys'
import { IconFlare, IconMenu } from 'lib/elements/icons'
import { Menu, MenuItem, MenuItems } from 'lib/elements/Menu'
import { Link } from 'lib/elements/Link'
import { inStorybook, inStorybookTestRunner } from 'lib/utils/dom'
import { retryImport } from 'lib/utils/retryImport'

import { AnimatedLogomark } from '~/toolbar/bar/AnimatedLogomark'
import { AuthConfirmModal } from '~/toolbar/bar/AuthConfirmModal'
import { PII_MASKING_PRESET_COLORS } from '~/toolbar/bar/piiMaskingStyles'
import { toolbarLogic } from '~/toolbar/bar/toolbarLogic'
import { UiHostConfigModal } from '~/toolbar/bar/UiHostConfigModal'
import { fieldNotesLogic } from '~/toolbar/field-notes/fieldNotesLogic'
import { productToursLogic } from '~/toolbar/product-tours/productToursLogic'
import { screenshotUploadLogic } from '~/toolbar/screenshot-upload/screenshotUploadLogic'
import { ScreenshotUploadModal } from '~/toolbar/screenshot-upload/ScreenshotUploadModal'
import { surveysToolbarLogic } from '~/toolbar/surveys/surveysToolbarLogic'
import { toolbarConfigLogic } from '~/toolbar/toolbarConfigLogic'
import { useToolbarFeatureFlag } from '~/toolbar/toolbarInsightsJS'

import { ToolbarButton } from './ToolbarButton'

// Each feature menu is a lazy split point: its component graph (and per-tab logics only it
// mounts, like the event debugger's 200KB+ taxonomy) is fetched when the tab first opens, not
// on toolbar boot. Styles are unaffected — the shadow root loads the entry stylesheet, and
// bin/check-toolbar-size.mjs fails the build if a lazy chunk holds CSS the entry doesn't.
const ActionsToolbarMenu = lazy(() =>
    retryImport(() => import('~/toolbar/actions/ActionsToolbarMenu')).then((m) => ({
        default: m.ActionsToolbarMenu,
    }))
)
const EventDebugMenu = lazy(() =>
    retryImport(() => import('~/toolbar/debug/EventDebugMenu')).then((m) => ({ default: m.EventDebugMenu }))
)
const ExperimentsToolbarMenu = lazy(() =>
    retryImport(() => import('~/toolbar/experiments/ExperimentsToolbarMenu')).then((m) => ({
        default: m.ExperimentsToolbarMenu,
    }))
)
const FieldNotesOverlay = lazy(() =>
    retryImport(() => import('~/toolbar/field-notes/FieldNotesOverlay')).then((m) => ({
        default: m.FieldNotesOverlay,
    }))
)
const FieldNotesToolbarMenu = lazy(() =>
    retryImport(() => import('~/toolbar/field-notes/FieldNotesToolbarMenu')).then((m) => ({
        default: m.FieldNotesToolbarMenu,
    }))
)
const FlagsToolbarMenu = lazy(() =>
    retryImport(() => import('~/toolbar/flags/FlagsToolbarMenu')).then((m) => ({ default: m.FlagsToolbarMenu }))
)
const ProductToursSidebar = lazy(() =>
    retryImport(() => import('~/toolbar/product-tours/ProductToursSidebar')).then((m) => ({
        default: m.ProductToursSidebar,
    }))
)
const ProductToursToolbarMenu = lazy(() =>
    retryImport(() => import('~/toolbar/product-tours/ProductToursToolbarMenu')).then((m) => ({
        default: m.ProductToursToolbarMenu,
    }))
)
const HeatmapToolbarMenu = lazy(() =>
    retryImport(() => import('~/toolbar/stats/HeatmapToolbarMenu')).then((m) => ({ default: m.HeatmapToolbarMenu }))
)
const SurveySidebar = lazy(() =>
    retryImport(() => import('~/toolbar/surveys/SurveySidebar')).then((m) => ({ default: m.SurveySidebar }))
)
const SurveysToolbarMenu = lazy(() =>
    retryImport(() => import('~/toolbar/surveys/SurveysToolbarMenu')).then((m) => ({
        default: m.SurveysToolbarMenu,
    }))
)
const WebVitalsToolbarMenu = lazy(() =>
    retryImport(() => import('~/toolbar/web-vitals/WebVitalsToolbarMenu')).then((m) => ({
        default: m.WebVitalsToolbarMenu,
    }))
)

const HELP_URL = 'https://hanzo.ai/docs/toolbar?utm_medium=in-product&utm_campaign=toolbar-help-button'

function EnabledStatusItem({ label, value }: { label: string; value: boolean }): JSX.Element {
    return (
        <div className="flex justify-between items-center w-full">
            <div>{label}: </div>
            <div>{value ? <IconCheck /> : <IconX />}</div>
        </div>
    )
}

function insightsDebugInfoMenuItem(
    insights: Insights | null,
    loadingSurveys: boolean,
    surveysCount: number
): MenuItem {
    const isAutocaptureEnabled = insights?.autocapture?.isEnabled

    return {
        icon: <IconStethoscope />,
        label: 'Debug info',
        items: [
            {
                label: (
                    <div className="flex justify-between items-center w-full">
                        <div>version: </div>
                        <div>{insights?.version || 'insights not available'}</div>
                    </div>
                ),
            },
            {
                label: (
                    <div className="flex justify-between items-center w-full">
                        <div>api host: </div>
                        <div>{insights?.config.api_host}</div>
                    </div>
                ),
            },
            {
                label: (
                    <div className="flex justify-between items-center w-full">
                        <div>ui host: </div>
                        <div>{insights?.config.ui_host || 'not set'}</div>
                    </div>
                ),
            },
            { label: <EnabledStatusItem label="autocapture" value={!!isAutocaptureEnabled} /> },
            {
                label: (
                    <EnabledStatusItem
                        label="rageclicks"
                        value={!!(isAutocaptureEnabled && insights?.config.rageclick)}
                    />
                ),
            },
            {
                label: (
                    <EnabledStatusItem
                        label="dead clicks"
                        value={!!insights?.deadClicksAutocapture?.lazyLoadedDeadClicksAutocapture}
                    />
                ),
            },
            { label: <EnabledStatusItem label="heatmaps" value={!!insights?.heatmaps?.isEnabled} /> },
            {
                label: (
                    <div className="flex justify-between items-center w-full">
                        <div>surveys: </div>
                        <div>
                            {loadingSurveys ? <Spinner /> : <Badge.Number showZero={true} count={surveysCount} />}
                        </div>
                    </div>
                ),
            },
            { label: <EnabledStatusItem label="session recording" value={!!insights?.sessionRecording?.started} /> },
            {
                label: (
                    <div className="flex justify-between items-center w-full">
                        <div>session recording status: </div>
                        <div>{insights?.sessionRecording?.status || 'unknown'}</div>
                    </div>
                ),
            },
            {
                label: (
                    <div className="flex items-center w-full">
                        <Link to={insights?.get_session_replay_url()} target="_blank">
                            View current session recording
                        </Link>
                    </div>
                ),
            },
        ],
    }
}

function piiMaskingMenuItem(
    piiMaskingEnabled: boolean,
    piiMaskingColor: string,
    togglePiiMasking: () => void,
    setPiiMaskingColor: (color: string) => void,
    piiWarning: string[] | null
): MenuItem[] {
    return [
        {
            icon: piiMaskingEnabled ? <IconEye /> : <IconHide />,
            label: piiMaskingEnabled ? 'Show PII' : 'Hide PII',
            sideIcon: piiWarning && piiWarning.length > 0 ? <IconWarning className="text-warning" /> : undefined,
            tooltip: piiWarning && piiWarning.length > 0 ? piiWarning.join('\n') : undefined,
            onClick: (e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                togglePiiMasking()
            },
            custom: true,
        },
        piiMaskingEnabled
            ? {
                  icon: (
                      <div
                          className="w-4 h-4 rounded border"
                          // eslint-disable-next-line react/forbid-dom-props
                          style={{ backgroundColor: piiMaskingColor }}
                      />
                  ),
                  label: 'PII masking color',
                  placement: 'right',
                  disabled: !piiMaskingEnabled,
                  items: PII_MASKING_PRESET_COLORS.map((preset) => ({
                      icon: (
                          <div
                              className="w-4 h-4 rounded border"
                              // eslint-disable-next-line react/forbid-dom-props
                              style={{ backgroundColor: preset.value }}
                          />
                      ),
                      label: preset.label,
                      onClick: () => {
                          setPiiMaskingColor(preset.value)
                      },
                      active: piiMaskingColor === preset.value,
                      custom: true,
                  })),
              }
            : undefined,
    ].filter(Boolean) as MenuItem[]
}

function MoreMenu(): JSX.Element {
    const {
        mascotModeEnabled,
        mascotModeAvailable,
        theme,
        insights,
        piiMaskingEnabled,
        piiMaskingColor,
        piiWarning,
    } = useValues(toolbarLogic)
    const {
        setMascotModeEnabled,
        toggleTheme,
        togglePiiMasking,
        setPiiMaskingColor,
        startGracefulExit,
        openMascotOptions,
    } = useActions(toolbarLogic)
    const { isAuthenticated } = useValues(toolbarConfigLogic)
    const { logout } = useActions(toolbarConfigLogic)
    const { isTakingScreenshot } = useValues(screenshotUploadLogic)
    const { takeScreenshot } = useActions(screenshotUploadLogic)

    const [loadingSurveys, setLoadingSurveys] = useState(true)
    const [surveysCount, setSurveysCount] = useState(0)

    useEffect(() => {
        insights?.surveys?.getSurveys((surveys: any[]) => {
            setSurveysCount(surveys.length)
            setLoadingSurveys(false)
        }, false)
    }, [insights])

    const showScreenshotForEvent = useToolbarFeatureFlag('event-media-previews')

    // KLUDGE: if there is no theme, assume light mode, which shouldn't be, but seems to be, necessary
    const currentlyLightMode = !theme || theme === 'light'

    return (
        <>
            <ScreenshotUploadModal />
            <Menu
                placement="top-end"
                fallbackPlacements={['bottom-end']}
                items={
                    [
                        {
                            icon: <>🦔</>,
                            label: mascotModeEnabled ? 'Disable mascot mode' : 'Mascot mode',
                            disabledReason: !mascotModeAvailable
                                ? "Mascot mode is disabled. Mascot mode uses `new Function` directives to render WebGL, and that requires 'unsafe-eval' in your Content Security Policy's script-src directive"
                                : undefined,
                            onClick: () => {
                                setMascotModeEnabled(!mascotModeEnabled)
                            },
                        },
                        mascotModeEnabled && mascotModeAvailable
                            ? {
                                  icon: <IconFlare />,
                                  label: 'Mascot options',
                                  onClick: () => {
                                      openMascotOptions()
                                  },
                              }
                            : undefined,
                        {
                            icon: currentlyLightMode ? <IconNight /> : <IconDay />,
                            label: `Switch to ${currentlyLightMode ? 'dark' : 'light'} mode`,
                            onClick: () => toggleTheme(),
                        },
                        showScreenshotForEvent
                            ? {
                                  icon: <IconCamera />,
                                  label: 'Screenshot for event',
                                  onClick: takeScreenshot,
                                  disabled: isTakingScreenshot,
                              }
                            : undefined,
                        ...piiMaskingMenuItem(
                            piiMaskingEnabled,
                            piiMaskingColor,
                            togglePiiMasking,
                            setPiiMaskingColor,
                            piiWarning
                        ),
                        insightsDebugInfoMenuItem(insights, loadingSurveys, surveysCount),
                        {
                            icon: <IconQuestion />,
                            label: 'Help',
                            onClick: () => {
                                window.open(HELP_URL, '_blank')?.focus()
                            },
                        },
                        isAuthenticated ? { icon: <IconLeave />, label: 'Sign out', onClick: logout } : undefined,
                        { icon: <IconX />, label: 'Close toolbar', onClick: startGracefulExit },
                    ].filter(Boolean) as MenuItems
                }
                maxContentWidth={true}
            >
                <ToolbarButton>{isTakingScreenshot ? <Spinner /> : <IconMenu />}</ToolbarButton>
            </Menu>
        </>
    )
}

export function ToolbarInfoMenu(): JSX.Element | null {
    const ref = useRef<HTMLDivElement | null>(null)
    const { visibleMenu, isDragging, menuProperties, minimized, isBlurred } = useValues(toolbarLogic)
    const { setMenu } = useActions(toolbarLogic)

    const { isAuthenticated } = useValues(toolbarConfigLogic)

    const productToursFlag = useToolbarFeatureFlag('product-tours-2025')
    const showProductTours = inStorybook() || inStorybookTestRunner() || productToursFlag

    const surveysFlag = useToolbarFeatureFlag('surveys-toolbar')
    const showSurveys = surveysFlag

    const fieldNotesFlag = useToolbarFeatureFlag('field-notes')
    const showFieldNotes = inStorybook() || inStorybookTestRunner() || fieldNotesFlag

    const content = minimized ? null : visibleMenu === 'flags' ? (
        <FlagsToolbarMenu />
    ) : visibleMenu === 'heatmap' ? (
        <HeatmapToolbarMenu />
    ) : visibleMenu === 'actions' ? (
        <ActionsToolbarMenu />
    ) : visibleMenu === 'debugger' ? (
        <EventDebugMenu />
    ) : visibleMenu === 'web-vitals' ? (
        <WebVitalsToolbarMenu />
    ) : visibleMenu === 'experiments' ? (
        <ExperimentsToolbarMenu />
    ) : visibleMenu === 'product-tours' && showProductTours ? (
        <ProductToursToolbarMenu />
    ) : visibleMenu === 'field-notes' && showFieldNotes ? (
        <FieldNotesToolbarMenu />
    ) : visibleMenu === 'surveys' && showSurveys ? (
        <SurveysToolbarMenu />
    ) : null

    useEffect(() => {
        setMenu(ref.current)
        return () => setMenu(null)
    }, [ref.current]) // oxlint-disable-line react-hooks/exhaustive-deps

    if (!isAuthenticated) {
        return null
    }

    return (
        <div
            className={clsx(
                'ToolbarMenu',
                !!content && 'ToolbarMenu--visible',
                isDragging && 'ToolbarMenu--dragging',
                isBlurred && 'ToolbarMenu--blurred',
                menuProperties.isBelow && 'ToolbarMenu--below'
            )}
            // eslint-disable-next-line react/forbid-dom-props
            style={{
                transform: menuProperties.transform,
            }}
        >
            <div
                ref={ref}
                className="ToolbarMenu__content"
                // eslint-disable-next-line react/forbid-dom-props
                style={{
                    maxHeight: menuProperties.maxHeight,
                }}
            >
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center p-4">
                            <Spinner />
                        </div>
                    }
                >
                    {content}
                </Suspense>
            </div>
        </div>
    )
}

export function Toolbar(): JSX.Element | null {
    const ref = useRef<HTMLDivElement | null>(null)
    const { minimized, position, isDragging, mascotMode, isEmbeddedInApp, isExiting, isLoading } =
        useValues(toolbarLogic)
    const { setVisibleMenu, toggleMinimized, onMouseOrTouchDown, setElement, setIsBlurred, completeGracefulExit } =
        useActions(toolbarLogic)
    const { isAuthenticated, userIntent, authStatus, uiHostConfigModalVisible, authConfirmModalVisible } =
        useValues(toolbarConfigLogic)
    const { authenticate, openUiHostConfigModal, closeUiHostConfigModal, closeAuthConfirmModal } =
        useActions(toolbarConfigLogic)
    const { selectedTourId, isPreviewing } = useValues(productToursLogic)
    const { isCreating: isSurveyCreating } = useValues(surveysToolbarLogic)

    const productToursFlag = useToolbarFeatureFlag('product-tours-2025')
    const showProductTours = inStorybook() || inStorybookTestRunner() || productToursFlag

    const surveysFlag = useToolbarFeatureFlag('surveys-toolbar')
    const showSurveys = surveysFlag

    const fieldNotesFlag = useToolbarFeatureFlag('field-notes')
    const showFieldNotes = inStorybook() || inStorybookTestRunner() || fieldNotesFlag
    const { hasOpenedFieldNotes } = useValues(fieldNotesLogic)

    useEffect(() => {
        setElement(ref.current)
        return () => setElement(null)
    }, [ref.current]) // oxlint-disable-line react-hooks/exhaustive-deps

    useKeyboardHotkeys(
        {
            escape: { action: () => setVisibleMenu('none'), willHandleEvent: true },
        },
        []
    )

    useEffect(() => {
        if (userIntent === 'add-action' || userIntent === 'edit-action') {
            setVisibleMenu('actions')
        }

        if (userIntent === 'add-experiment' || userIntent === 'edit-experiment') {
            setVisibleMenu('experiments')
        }

        if (userIntent === 'heatmaps') {
            setVisibleMenu('heatmap')
        }

        if (userIntent === 'add-product-tour' || userIntent === 'edit-product-tour') {
            setVisibleMenu('product-tours')
        }
    }, [userIntent]) // oxlint-disable-line react-hooks/exhaustive-deps

    if (isEmbeddedInApp) {
        return null
    }

    const showToursSidebar = selectedTourId !== null && !isPreviewing

    return (
        <>
            <Suspense fallback={null}>
                {showToursSidebar && <ProductToursSidebar />}
                {showFieldNotes && <FieldNotesOverlay />}
                {isSurveyCreating && <SurveySidebar />}
            </Suspense>
            <ToolbarInfoMenu />
            <div
                ref={ref}
                className={clsx('Toolbar', {
                    'Toolbar--minimized': minimized,
                    'Toolbar--mascot-mode': mascotMode,
                    'Toolbar--dragging': isDragging,
                    'Toolbar--extra-buttons-1':
                        1 + (showProductTours ? 1 : 0) + (showFieldNotes ? 1 : 0) + (showSurveys ? 1 : 0) === 1,
                    'Toolbar--extra-buttons-2':
                        1 + (showProductTours ? 1 : 0) + (showFieldNotes ? 1 : 0) + (showSurveys ? 1 : 0) === 2,
                    'Toolbar--extra-buttons-3':
                        1 + (showProductTours ? 1 : 0) + (showFieldNotes ? 1 : 0) + (showSurveys ? 1 : 0) === 3,
                    'Toolbar--extra-buttons-4':
                        1 + (showProductTours ? 1 : 0) + (showFieldNotes ? 1 : 0) + (showSurveys ? 1 : 0) === 4,
                })}
                onMouseDown={(e) => onMouseOrTouchDown(e.nativeEvent)}
                onTouchStart={(e) => onMouseOrTouchDown(e.nativeEvent)}
                onMouseOver={() => setIsBlurred(false)}
                // eslint-disable-next-line react/forbid-dom-props
                style={
                    {
                        '--toolbar-button-x': `${position.x}px`,
                        '--toolbar-button-y': `${position.y}px`,
                    } as any
                }
            >
                <ToolbarButton
                    onClick={isAuthenticated ? toggleMinimized : authenticate}
                    title={isAuthenticated ? 'Minimize' : 'Authenticate the Insights Toolbar'}
                    titleMinimized={isAuthenticated ? 'Expand the toolbar' : 'Authenticate the Insights Toolbar'}
                >
                    <AnimatedLogomark
                        animate={isLoading || authStatus === 'checking' || authStatus === 'authenticating'}
                        animateOnce={isExiting ? completeGracefulExit : undefined}
                        className="Toolbar__logomark"
                    />
                </ToolbarButton>
                {isAuthenticated ? (
                    <>
                        <ToolbarButton menuId="inspect">
                            <IconSearch />
                        </ToolbarButton>
                        {/* When the field notes flag is on, field notes takes the heatmap slot + cursor icon */}
                        {showFieldNotes ? (
                            <ToolbarButton menuId="field-notes" title="Field notes">
                                {/* Inline font-size because the wrapper breaks the `button > svg` size rule */}
                                {/* eslint-disable-next-line react/forbid-dom-props */}
                                <span className="relative flex" style={{ fontSize: '1.5rem' }}>
                                    <IconCursorClick />
                                    {!hasOpenedFieldNotes && (
                                        <span
                                            className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                                            // eslint-disable-next-line react/forbid-dom-props
                                            style={{ backgroundColor: 'var(--primary-3000)' }}
                                        />
                                    )}
                                </span>
                            </ToolbarButton>
                        ) : (
                            <ToolbarButton menuId="heatmap">
                                <IconCursorClick />
                            </ToolbarButton>
                        )}
                        <ToolbarButton menuId="actions">
                            <IconBolt />
                        </ToolbarButton>
                        <ToolbarButton menuId="flags" title="Feature flags">
                            <IconToggle />
                        </ToolbarButton>
                        <ToolbarButton menuId="debugger" title="Event debugger">
                            <IconLive />
                        </ToolbarButton>
                        <ToolbarButton menuId="web-vitals" title="Web vitals">
                            <IconPieChart />
                        </ToolbarButton>
                        <ToolbarButton menuId="experiments" title="Experiments">
                            <IconFlask />
                        </ToolbarButton>
                        {showProductTours && (
                            <ToolbarButton menuId="product-tours" title="Product tours">
                                <IconSpotlight />
                            </ToolbarButton>
                        )}
                        {/* Heatmaps moves here and takes the app icon when field notes is enabled */}
                        {showFieldNotes && (
                            <ToolbarButton menuId="heatmap" title="Heatmaps">
                                <IconApp />
                            </ToolbarButton>
                        )}
                        {showSurveys && (
                            <ToolbarButton menuId="surveys" title="Surveys">
                                <IconMessage />
                            </ToolbarButton>
                        )}
                    </>
                ) : authStatus === 'checking' || authStatus === 'authenticating' ? (
                    <ToolbarButton flex>
                        <span className="flex items-center gap-1">
                            <Spinner /> {authStatus === 'authenticating' ? 'Authenticating…' : 'Checking…'}
                        </span>
                    </ToolbarButton>
                ) : authStatus === 'error' ? (
                    <ToolbarButton
                        flex
                        onClick={openUiHostConfigModal}
                        title="Insights app unreachable — click for help"
                    >
                        <span className="flex items-center gap-1">
                            Authenticate <IconWarning className="text-warning" />
                        </span>
                    </ToolbarButton>
                ) : (
                    <ToolbarButton flex onClick={authenticate}>
                        Authenticate
                    </ToolbarButton>
                )}
                <UiHostConfigModal visible={uiHostConfigModalVisible} onClose={closeUiHostConfigModal} />
                <AuthConfirmModal visible={authConfirmModalVisible} onClose={closeAuthConfirmModal} />

                <MoreMenu />
            </div>
        </>
    )
}
