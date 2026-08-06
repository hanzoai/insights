import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { Input, Switch } from '@hanzo/elements'

import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { Label } from 'lib/elements/Label/Label'
import { pathsDataLogic } from 'scenes/paths/pathsDataLogic'

import { AvailableFeature, EditorFilterProps, PathEdgeParameters } from '~/types'

import { PathCleaningFilter } from '../filters/PathCleaningFilter'

export function PathsAdvanced({ insightProps, ...rest }: EditorFilterProps): JSX.Element {
    const { pathsFilter } = useValues(pathsDataLogic(insightProps))
    const { updateInsightFilter } = useActions(pathsDataLogic(insightProps))

    const { edgeLimit, minEdgeWeight, maxEdgeWeight, showFullUrls } = pathsFilter || {}

    const [localEdgeParameters, setLocalEdgeParameters] = useState<PathEdgeParameters>({
        edgeLimit,
        minEdgeWeight,
        maxEdgeWeight,
    })

    const updateEdgeParameters = (): void => {
        if (
            localEdgeParameters.edgeLimit !== edgeLimit ||
            localEdgeParameters.minEdgeWeight !== minEdgeWeight ||
            localEdgeParameters.maxEdgeWeight !== maxEdgeWeight
        ) {
            updateInsightFilter({ ...localEdgeParameters })
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <PayGateMini feature={AvailableFeature.PATHS_ADVANCED}>
                <div className="flex flex-col gap-2">
                    <Label info="Determines the maximum number of path nodes that can be generated. If necessary certain items will be grouped.">
                        Maximum number of paths
                    </Label>
                    <Input
                        type="number"
                        min={0}
                        max={1000}
                        defaultValue={localEdgeParameters.edgeLimit || 50}
                        onChange={(value): void =>
                            setLocalEdgeParameters((state) => ({
                                ...state,
                                edgeLimit: Number(value),
                            }))
                        }
                        onBlur={updateEdgeParameters}
                        onPressEnter={updateEdgeParameters}
                    />

                    <Label
                        info="Determines the minimum and maximum number of persons in each path. Helps adjust the density of the visualization."
                        className="mt-2"
                    >
                        Number of people on each path
                    </Label>
                </div>
                <div className="flex items-baseline">
                    <span className="mr-2">Between</span>
                    <Input
                        type="number"
                        min={0}
                        max={100000}
                        defaultValue={localEdgeParameters.minEdgeWeight}
                        onChange={(value): void => {
                            setLocalEdgeParameters((state) => ({
                                ...state,
                                minEdgeWeight: Number(value),
                            }))
                            updateEdgeParameters()
                        }}
                        onBlur={updateEdgeParameters}
                        onPressEnter={updateEdgeParameters}
                    />
                    <span className="mx-2">and</span>
                    <Input
                        type="number"
                        onChange={(value): void => {
                            setLocalEdgeParameters((state) => ({
                                ...state,
                                maxEdgeWeight: Number(value),
                            }))
                            updateEdgeParameters()
                        }}
                        min={0}
                        max={100000}
                        defaultValue={localEdgeParameters.maxEdgeWeight}
                        onBlur={updateEdgeParameters}
                        onPressEnter={updateEdgeParameters}
                    />
                    <span className="ml-2">persons.</span>
                </div>

                <div>
                    <div className="flex items-center my-2">
                        <Label
                            info={
                                <>
                                    Cleaning rules are an advanced feature that uses regex to normalize URLS for paths
                                    visualization. Rules can be set for all insights in the project settings, or they
                                    can be defined specifically for an insight.
                                </>
                            }
                        >
                            Path Cleaning Rules
                        </Label>
                    </div>
                    <PathCleaningFilter insightProps={insightProps} {...rest} />
                </div>
            </PayGateMini>

            {/* Show full URLs toggle - outside paywall */}
            <div>
                <Switch
                    checked={!!showFullUrls}
                    onChange={(checked) => updateInsightFilter({ showFullUrls: checked })}
                    label="Show full URLs"
                    bordered
                    fullWidth
                />
                <div className="text-muted text-xs mt-1">
                    Display complete URLs instead of truncated versions. Useful for comparing paths side-by-side.
                </div>
            </div>
        </div>
    )
}
