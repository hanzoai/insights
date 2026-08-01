import { useActions, useValues } from 'kea'

import { Label, Modal, Select, Tag } from '@hanzo/elements'
import { Button, ColorPicker, Table, TableColumns } from '@hanzo/elements'

import { DashboardEventSource } from 'lib/utils/eventUsageLogic'
import stringWithWBR from 'lib/utils/stringWithWBR'
import { formatBreakdownLabel } from 'scenes/insights/utils'
import { dataColorThemesLogic } from 'scenes/settings/environment/dataColorThemesLogic'

import { cohortsModel } from '~/models/cohortsModel'
import { propertyDefinitionsModel } from '~/models/propertyDefinitionsModel'
import { BreakdownFilter } from '~/queries/schema/schema-general'
import { DashboardMode } from '~/types'

import { BreakdownColorConfig, denormalizeBreakdownValue, findBreakdownColorConfig } from './dashboardBreakdownColors'
import { dashboardInsightColorsModalLogic } from './dashboardInsightColorsModalLogic'
import { dashboardLogic } from './dashboardLogic'

export function DashboardInsightColorsModal(): JSX.Element {
    const { isOpen, insightTilesLoading, breakdownValues } = useValues(dashboardInsightColorsModalLogic)
    const { hideInsightColorsModal } = useActions(dashboardInsightColorsModalLogic)

    const { themes: _themes, themesLoading } = useValues(dataColorThemesLogic)

    const { effectiveBreakdownColors, dataColorThemeId, dashboardMode } = useValues(dashboardLogic)
    const { setBreakdownColorConfig, setDataColorThemeId, setDashboardMode } = useActions(dashboardLogic)

    const { formatPropertyValueForDisplay } = useValues(propertyDefinitionsModel)
    const { allCohorts } = useValues(cohortsModel)

    const themes = _themes || []

    const ensureEditMode = (): void => {
        if (dashboardMode !== DashboardMode.Edit) {
            setDashboardMode(DashboardMode.Edit, DashboardEventSource.DashboardInsightColorsModal)
        }
    }

    const columns: TableColumns<BreakdownColorConfig> = [
        {
            title: 'Breakdown',
            key: 'breakdown_value',
            render: (_, { breakdownValue, ...config }) => {
                const breakdownFilter: BreakdownFilter = { breakdown_type: config.breakdownType }
                const breakdownLabel = formatBreakdownLabel(
                    denormalizeBreakdownValue(breakdownValue),
                    breakdownFilter,
                    allCohorts?.results,
                    formatPropertyValueForDisplay
                )
                const formattedLabel = stringWithWBR(breakdownLabel, 20)

                return <span>{formattedLabel}</span>
            },
        },
        {
            title: 'Color',
            key: 'color',
            width: 400,
            render: (_, { colorToken, source, ...config }) => {
                return (
                    <div className="flex items-center gap-2">
                        <ColorPicker
                            selectedColorToken={colorToken}
                            onSelectColorToken={(colorToken) => {
                                ensureEditMode()
                                setBreakdownColorConfig({
                                    ...config,
                                    colorToken,
                                    source: 'manual',
                                })
                            }}
                            customButton={
                                colorToken === null ? (
                                    <Button type="tertiary">Customize color</Button>
                                ) : undefined
                            }
                            themeId={dataColorThemeId}
                        />
                        {source === 'auto' ? (
                            <Tag type="muted">Auto</Tag>
                        ) : colorToken !== null ? (
                            <Button
                                size="small"
                                type="tertiary"
                                tooltip="Reset to automatic color"
                                onClick={() => {
                                    ensureEditMode()
                                    setBreakdownColorConfig({
                                        ...config,
                                        colorToken: null,
                                        source: 'manual',
                                    })
                                }}
                            >
                                Reset
                            </Button>
                        ) : null}
                    </div>
                )
            },
        },
    ]

    return (
        <Modal title="Customize breakdown colors" isOpen={isOpen} onClose={hideInsightColorsModal}>
            <Label info="Select a color theme for all insights on this dashboard. If a theme is selected, it will be applied to all series and breakdowns.">
                Color theme
            </Label>
            <Select
                className="mt-2"
                value={dataColorThemeId || null}
                placeholder="Defined by insight"
                onChange={(id) => {
                    ensureEditMode()
                    setDataColorThemeId(id)
                }}
                loading={themesLoading}
                options={themes.map((theme) => ({ value: theme.id, label: theme.name }))}
            />

            <Label className="mt-4">Breakdown colors</Label>
            <p className="text-muted-alt mb-4">
                Breakdown values get a consistent color across all insights on this dashboard. Pick a color to pin a
                value to it. <i>Note: This works for trend, funnel, and retention insights.</i>
            </p>
            <Table
                columns={columns}
                dataSource={breakdownValues.map((breakdownValue) => {
                    const config = findBreakdownColorConfig(
                        effectiveBreakdownColors,
                        breakdownValue.breakdownValue,
                        breakdownValue.breakdownType
                    )
                    return {
                        ...breakdownValue,
                        colorToken: config?.colorToken || null,
                        source: config?.source,
                    }
                })}
                loading={insightTilesLoading || undefined}
            />
            {insightTilesLoading ? (
                <p className="text-muted-alt mt-2">Tiles are still loading. More breakdown values may appear.</p>
            ) : null}
        </Modal>
    )
}
