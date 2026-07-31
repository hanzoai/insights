import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconGear, IconPlusSmall, IconTrash } from '@hanzo/icons'
import {
    Button,
    ColorGlyph,
    ColorPicker,
    Input,
    Label,
    SegmentedButton,
    Select,
    Switch,
    Tabs,
    Tag,
    Popover,
} from '@hanzo/elements'

import { getSeriesColor, getSeriesColorPalette } from 'lib/colors'
import { Field } from 'lib/elements/Field'

import { ChartDisplayType } from '~/types'

import { AxisSeries, dataVisualizationLogic } from '../dataVisualizationLogic'
import { HeatmapSeriesTab } from './Heatmap/HeatmapSeriesTab'
import { AxisBreakdownSeries, seriesBreakdownLogic } from './seriesBreakdownLogic'
import { YSeriesLogicProps, YSeriesSettingsTab, ySeriesLogic } from './ySeriesLogic'

export const SeriesTab = (): JSX.Element => {
    const { visualizationType } = useValues(dataVisualizationLogic)
    const {
        columns,
        numericalColumns,
        xData,
        yData,
        responseLoading,
        showTableSettings,
        tabularColumns,
        selectedXAxis,
        dataVisualizationProps,
    } = useValues(dataVisualizationLogic)
    const { updateXSeries, addYSeries } = useActions(dataVisualizationLogic)
    const breakdownLogic = seriesBreakdownLogic({ key: dataVisualizationProps.key })
    const { showSeriesBreakdown } = useValues(breakdownLogic)
    const { addSeriesBreakdown } = useActions(breakdownLogic)

    const hideAddYSeries = yData.length >= numericalColumns.length
    const hideAddSeriesBreakdown = !(!showSeriesBreakdown && selectedXAxis && columns.length > yData.length)

    if (visualizationType === ChartDisplayType.TwoDimensionalHeatmap) {
        return <HeatmapSeriesTab />
    }

    if (showTableSettings) {
        return (
            <div className="flex flex-col w-full p-3">
                <Label>Columns</Label>
                {tabularColumns.map((series, index) => (
                    <YSeries series={series} index={index} key={`${series.column.name}-${index}`} />
                ))}
            </div>
        )
    }

    const options = columns.map(({ name, type }) => ({
        value: name,
        label: (
            <div className="items-center flex-1">
                {name}
                <Tag className="ml-2" type="default">
                    {type.name}
                </Tag>
            </div>
        ),
    }))

    return (
        <div className="flex flex-col w-full p-3">
            <Label className="mb-1">X-axis</Label>
            <Select
                className="w-full"
                value={xData !== null ? xData.column.name : 'None'}
                options={options}
                disabledReason={responseLoading ? 'Query loading...' : undefined}
                onChange={(value) => {
                    const column = columns.find((n) => n.name === value)
                    if (column) {
                        updateXSeries(column.name)
                    }
                }}
            />
            {!hideAddSeriesBreakdown && (
                <Button
                    className="mt-1"
                    type="tertiary"
                    onClick={() => addSeriesBreakdown(null)}
                    icon={<IconPlusSmall />}
                    fullWidth
                >
                    Add series breakdown
                </Button>
            )}
            {showSeriesBreakdown && <SeriesBreakdownSelector />}

            <Label className="mt-4 mb-1">Y-axis</Label>
            {yData.map((series, index) => (
                <YSeries series={series} index={index} key={`${series?.column.name}-${index}`} />
            ))}
            {!hideAddYSeries && (
                <Button
                    className="mt-1"
                    type="tertiary"
                    onClick={() => addYSeries()}
                    icon={<IconPlusSmall />}
                    fullWidth
                >
                    Add Y-series
                </Button>
            )}
        </div>
    )
}

const YSeries = ({ series, index }: { series: AxisSeries<number>; index: number }): JSX.Element => {
    const { columns, numericalColumns, responseLoading, dataVisualizationProps, showTableSettings } =
        useValues(dataVisualizationLogic)
    const { updateSeriesIndex, deleteYSeries } = useActions(dataVisualizationLogic)
    const { selectedSeriesBreakdownColumn } = useValues(seriesBreakdownLogic({ key: dataVisualizationProps.key }))

    const seriesLogicProps: YSeriesLogicProps = { series, seriesIndex: index, dataVisualizationProps }
    const seriesLogic = ySeriesLogic(seriesLogicProps)

    const { isSettingsOpen, canOpenSettings, activeSettingsTab } = useValues(seriesLogic)
    const { setSettingsOpen, submitFormatting, submitDisplay, setSettingsTab } = useActions(seriesLogic)

    const seriesColor = series.settings?.display?.color ?? getSeriesColor(index)
    const showSeriesColor = !showTableSettings && !selectedSeriesBreakdownColumn

    const columnsInOptions = showTableSettings ? columns : numericalColumns
    const options = columnsInOptions.map(({ name, type }) => ({
        value: name,
        label: (
            <div className="items-center flex flex-1">
                {showSeriesColor && <ColorGlyph className="mr-2" color={seriesColor} />}
                {series.settings?.display?.label && series.column.name === name ? series.settings.display.label : name}
                <Tag className="ml-2" type="default">
                    {type.name}
                </Tag>
            </div>
        ),
    }))

    return (
        <div className="flex gap-1 mb-1">
            <Select
                className="grow flex-1 break-all"
                value={series !== null ? series.column.name : 'None'}
                options={options}
                disabledReason={responseLoading ? 'Query loading...' : undefined}
                onChange={(value) => {
                    const column = columns.find((n) => n.name === value)
                    if (column) {
                        updateSeriesIndex(index, column.name)
                    }
                }}
            />
            <Popover
                overlay={
                    <div className="m-2">
                        <Tabs
                            activeKey={activeSettingsTab}
                            barClassName="justify-around"
                            onChange={(tab) => setSettingsTab(tab as YSeriesSettingsTab)}
                            tabs={Object.values(Y_SERIES_SETTINGS_TABS).map(({ label, Component }, index) => ({
                                label: label,
                                key: Object.keys(Y_SERIES_SETTINGS_TABS)[index],
                                content: <Component ySeriesLogicProps={seriesLogicProps} />,
                            }))}
                        />
                    </div>
                }
                visible={isSettingsOpen}
                placement="bottom"
                onClickOutside={() => {
                    submitFormatting()
                    submitDisplay()
                }}
            >
                <Button
                    key="seriesSettings"
                    icon={<IconGear />}
                    noPadding
                    onClick={() => setSettingsOpen(true)}
                    disabledReason={!canOpenSettings && 'Select a column first'}
                />
            </Popover>
            {!showTableSettings && (
                <Button
                    key="delete"
                    icon={<IconTrash />}
                    status="danger"
                    title="Delete Y-series"
                    noPadding
                    onClick={() => deleteYSeries(index)}
                />
            )}
        </div>
    )
}

const YSeriesFormattingTab = ({ ySeriesLogicProps }: { ySeriesLogicProps: YSeriesLogicProps }): JSX.Element => {
    return (
        <Form logic={ySeriesLogic} props={ySeriesLogicProps} formKey="formatting" className="deprecated-space-y-4">
            {ySeriesLogicProps.series.column.type.isNumerical && (
                <Field name="style" label="Style" className="gap-1">
                    <Select
                        options={[
                            { value: 'none', label: 'None' },
                            { value: 'number', label: 'Number' },
                            { value: 'percent', label: 'Percentage' },
                        ]}
                    />
                </Field>
            )}
            <Field name="prefix" label="Prefix">
                <Input placeholder="$" />
            </Field>
            <Field name="suffix" label="Suffix">
                <Input placeholder="USD" />
            </Field>
            {ySeriesLogicProps.series.column.type.isNumerical && (
                <Field name="decimalPlaces" label="Decimal places">
                    <Input type="number" min={0} />
                </Field>
            )}
        </Form>
    )
}

const YSeriesDisplayTab = ({ ySeriesLogicProps }: { ySeriesLogicProps: YSeriesLogicProps }): JSX.Element => {
    const { showTableSettings, dataVisualizationProps } = useValues(dataVisualizationLogic)
    const { selectedSeriesBreakdownColumn } = useValues(seriesBreakdownLogic({ key: dataVisualizationProps.key }))
    const { updateSeriesIndex } = useActions(dataVisualizationLogic)

    const showColorPicker = !showTableSettings && !selectedSeriesBreakdownColumn
    const showLabelInput = showTableSettings || !selectedSeriesBreakdownColumn

    return (
        <Form logic={ySeriesLogic} props={ySeriesLogicProps} formKey="display" className="deprecated-space-y-4">
            {(showColorPicker || showLabelInput) && (
                <div className="flex gap-3">
                    {showColorPicker && (
                        <Field name="color" label="Color">
                            {({ value, onChange }) => (
                                <ColorPicker
                                    selectedColor={value}
                                    onSelectColor={(color) => {
                                        onChange(color)
                                        updateSeriesIndex(
                                            ySeriesLogicProps.seriesIndex,
                                            ySeriesLogicProps.series.column.name,
                                            {
                                                display: {
                                                    color: color,
                                                },
                                            }
                                        )
                                    }}
                                    colors={getSeriesColorPalette()}
                                    showCustomColor
                                    hideDropdown
                                    preventPopoverClose
                                    customColorValue={value}
                                />
                            )}
                        </Field>
                    )}
                    {showLabelInput && (
                        <Field name="label" label="Label">
                            {({ value, onChange }) => (
                                <Input
                                    value={value}
                                    onChange={(label) => {
                                        onChange(label)
                                        updateSeriesIndex(
                                            ySeriesLogicProps.seriesIndex,
                                            ySeriesLogicProps.series.column.name,
                                            {
                                                display: {
                                                    label: label,
                                                },
                                            }
                                        )
                                    }}
                                />
                            )}
                        </Field>
                    )}
                </div>
            )}
            {!showTableSettings && (
                <>
                    {!selectedSeriesBreakdownColumn && (
                        <Field name="trendLine" label="Trend line">
                            {({ value, onChange }) => (
                                <Switch
                                    checked={value}
                                    onChange={(newValue) => {
                                        onChange(newValue)
                                        updateSeriesIndex(
                                            ySeriesLogicProps.seriesIndex,
                                            ySeriesLogicProps.series.column.name,
                                            {
                                                display: {
                                                    trendLine: newValue,
                                                },
                                            }
                                        )
                                    }}
                                />
                            )}
                        </Field>
                    )}
                    <Field name="yAxisPosition" label="Y-axis position">
                        {({ value, onChange }) => (
                            <SegmentedButton
                                value={value}
                                className="w-full"
                                options={[
                                    {
                                        label: 'Left',
                                        value: 'left',
                                    },
                                    {
                                        label: 'Right',
                                        value: 'right',
                                    },
                                ]}
                                onChange={(newValue) => {
                                    onChange(newValue)
                                    updateSeriesIndex(
                                        ySeriesLogicProps.seriesIndex,
                                        ySeriesLogicProps.series.column.name,
                                        {
                                            display: {
                                                yAxisPosition: newValue as 'left' | 'right',
                                            },
                                        }
                                    )
                                }}
                            />
                        )}
                    </Field>
                    <Field name="displayType" label="Display type">
                        {({ value, onChange }) => (
                            <SegmentedButton
                                value={value}
                                className="w-full"
                                options={[
                                    {
                                        label: 'Auto',
                                        value: 'auto',
                                    },
                                    {
                                        label: 'Line',
                                        value: 'line',
                                    },
                                    {
                                        label: 'Bar',
                                        value: 'bar',
                                    },
                                ]}
                                onChange={(newValue) => {
                                    onChange(newValue)
                                    updateSeriesIndex(
                                        ySeriesLogicProps.seriesIndex,
                                        ySeriesLogicProps.series.column.name,
                                        {
                                            display: {
                                                displayType: newValue as 'auto' | 'line' | 'bar',
                                            },
                                        }
                                    )
                                }}
                            />
                        )}
                    </Field>
                </>
            )}
        </Form>
    )
}

const Y_SERIES_SETTINGS_TABS = {
    [YSeriesSettingsTab.Formatting]: {
        label: 'Formatting',
        Component: YSeriesFormattingTab,
    },
    [YSeriesSettingsTab.Display]: {
        label: 'Display',
        Component: YSeriesDisplayTab,
    },
}

export const SeriesBreakdownSelector = (): JSX.Element => {
    const { columns, responseLoading, selectedXAxis, dataVisualizationProps } = useValues(dataVisualizationLogic)
    const breakdownLogic = seriesBreakdownLogic({ key: dataVisualizationProps.key })
    const { selectedSeriesBreakdownColumn, seriesBreakdownData } = useValues(breakdownLogic)
    const { addSeriesBreakdown, deleteSeriesBreakdown } = useActions(breakdownLogic)

    const seriesBreakdownOptions = columns
        .map(({ name, type }) => ({
            value: name,
            label: (
                <div className="items-center flex-1">
                    {name}
                    <Tag className="ml-2" type="default">
                        {type.name}
                    </Tag>
                </div>
            ),
        }))
        .filter((column) => column.value !== selectedXAxis)

    return (
        <>
            <div className="flex gap-1 my-1">
                <Select
                    className="grow"
                    value={selectedSeriesBreakdownColumn !== null ? selectedSeriesBreakdownColumn : 'None'}
                    options={seriesBreakdownOptions}
                    disabledReason={responseLoading ? 'Query loading...' : undefined}
                    onChange={(value) => {
                        const column = columns.find((n) => n.name === value)
                        if (column) {
                            addSeriesBreakdown(column.name)
                        }
                    }}
                />
                <Button
                    key="delete"
                    icon={<IconTrash />}
                    status="danger"
                    title="Delete series breakdown"
                    noPadding
                    onClick={() => deleteSeriesBreakdown()}
                />
            </div>
            <div className="ml-4 mt-2">
                {seriesBreakdownData.error ? (
                    <div className="text-danger font-bold mt-1">{seriesBreakdownData.error}</div>
                ) : (
                    seriesBreakdownData.seriesData.map((series, index) => (
                        <BreakdownSeries series={series} index={index} key={`${series.name}-${index}`} />
                    ))
                )}
            </div>
        </>
    )
}

const BreakdownSeries = ({ series, index }: { series: AxisBreakdownSeries<number>; index: number }): JSX.Element => {
    const seriesColor = series.settings?.display?.color ?? getSeriesColor(index)

    return (
        <div className="flex gap-1 mb-2">
            <div className="flex gap-2">
                <ColorGlyph color={seriesColor} className="mr-2" />
                <span>{series.name ? series.name : '[No value]'}</span>
            </div>
            {/* For now let's keep things simple and not allow too much configuration */}
            {/* We may just want to add a show/hide button here */}
        </div>
    )
}
