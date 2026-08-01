import './BreakdownTagMenu.scss'

import { useActions, useValues } from 'kea'

import { IconGear, IconInfo } from '@hanzo/icons'
import { Button, Divider, Input, Switch } from '@hanzo/elements'

import { Tooltip } from 'lib/elements/Tooltip'
import { urls } from 'scenes/urls'

import { breakdownTagLogic } from './breakdownTagLogic'
import { GlobalBreakdownOptionsMenu } from './GlobalBreakdownOptionsMenu'
import { taxonomicBreakdownFilterLogic } from './taxonomicBreakdownFilterLogic'

export const BreakdownTagMenu = (): JSX.Element => {
    const {
        isHistogramable,
        isNormalizeable,
        histogramBinCount,
        normalizeBreakdownURL,
        histogramBinsUsed,
        pathCleaningEnabled,
        hasAdvancedPaths,
        hasPathCleaningFilters,
    } = useValues(breakdownTagLogic)

    const {
        removeBreakdown,
        setHistogramBinCount,
        setHistogramBinsUsed,
        setNormalizeBreakdownURL,
        setPathCleaningEnabled,
    } = useActions(breakdownTagLogic)

    const { isMultipleBreakdownsEnabled } = useValues(taxonomicBreakdownFilterLogic)

    return (
        <>
            {isNormalizeable && (
                <Switch
                    checked={normalizeBreakdownURL} // TODO move global values/actions to taxonomicBreakdownFilterLogic
                    fullWidth={true}
                    onChange={(checked) => setNormalizeBreakdownURL(checked)}
                    className="min-h-10 px-2"
                    id="normalize-breakdown-url-switch"
                    label={
                        <div className="flex flex-row items-center">
                            Normalize paths
                            <Tooltip
                                title={
                                    <>
                                        <p>
                                            Strip noise (trailing slashes, question marks, and hashes) from paths by
                                            enabling this option.
                                        </p>
                                        <p>
                                            Without path normalization, "https://example.com", "https://example.com/",
                                            "https://example.com/?" and "https://example.com/#" are treated as four
                                            distinct breakdown values. With normalization, they all count towards
                                            "https://example.com".
                                        </p>
                                    </>
                                }
                            >
                                <IconInfo className="text-xl text-secondary ml-1 shrink-0" />
                            </Tooltip>
                        </div>
                    }
                />
            )}
            {isNormalizeable && hasAdvancedPaths && (
                <Switch
                    checked={hasPathCleaningFilters ? pathCleaningEnabled : false}
                    disabled={!hasPathCleaningFilters}
                    fullWidth={true}
                    onChange={(checked) => setPathCleaningEnabled(checked)}
                    className="min-h-10 px-2"
                    id="path-cleaning-switch"
                    label={
                        <div className="flex flex-row items-center">
                            Path cleaning
                            <Tooltip
                                interactive
                                title={
                                    hasPathCleaningFilters ? (
                                        <>
                                            <p>
                                                Apply your team's path cleaning rules to standardize URLs by removing
                                                unnecessary parameters and fragments.
                                            </p>
                                            <Button
                                                icon={<IconGear />}
                                                type="primary"
                                                size="small"
                                                to={urls.settings('project-product-analytics', 'path-cleaning')}
                                                targetBlank
                                                className="w-full mt-2"
                                            >
                                                Edit path cleaning settings
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <p>
                                                You don't have any path cleaning filters configured. Click the button
                                                below to set up path cleaning rules.
                                            </p>
                                            <Button
                                                icon={<IconGear />}
                                                type="primary"
                                                size="small"
                                                to={urls.settings('project-product-analytics', 'path-cleaning')}
                                                targetBlank
                                                className="w-full mt-2"
                                            >
                                                Configure path cleaning
                                            </Button>
                                        </>
                                    )
                                }
                            >
                                <IconInfo className="text-xl text-secondary ml-1 shrink-0" />
                            </Tooltip>
                        </div>
                    }
                />
            )}
            {isHistogramable ? (
                <>
                    <Button
                        onClick={() => {
                            setHistogramBinsUsed(true)
                        }}
                        active={histogramBinsUsed}
                        fullWidth
                    >
                        Use{' '}
                        <Input
                            min={1}
                            value={histogramBinCount}
                            onChange={(newValue) => {
                                if (typeof newValue === 'number') {
                                    setHistogramBinCount(newValue)
                                }
                            }}
                            fullWidth={false}
                            type="number"
                            className="histogram-bin-input"
                        />
                        bins
                    </Button>
                    <Button
                        onClick={() => {
                            setHistogramBinsUsed(false)
                        }}
                        active={!histogramBinsUsed}
                        className="mt-2"
                        fullWidth
                    >
                        Do not bin numeric values
                    </Button>
                </>
            ) : (
                !isMultipleBreakdownsEnabled && <GlobalBreakdownOptionsMenu />
            )}
            <Divider />
            <Button status="danger" onClick={removeBreakdown} fullWidth>
                Remove breakdown
            </Button>
        </>
    )
}
