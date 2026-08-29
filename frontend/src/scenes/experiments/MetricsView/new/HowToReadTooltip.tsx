import { useValues } from 'kea'

import { Divider, Tooltip } from '@hanzo/elements'
import { IconTrending } from '@hanzo/icons'

import { IconTrendingDown } from 'lib/elements/icons'
import { Link } from 'lib/elements/Link'

import { themeLogic } from '~/layout/navigation-3000/themeLogic'
import { ExperimentStatsMethod } from '~/types'

import { experimentLogic } from '../../experimentLogic'

export function HowToReadTooltip(): JSX.Element {
    const { statsMethod } = useValues(experimentLogic)
    const { isDarkModeOn } = useValues(themeLogic)

    return (
        <>
            <Divider vertical className="mx-2" />
            <Tooltip
                title={
                    <div className="p-2">
                        <p className="mb-3 font-semibold">Is my variant significant?</p>
                        <p className="mb-3">
                            Look at the <strong>Delta column</strong> for each variant:
                        </p>
                        <div className="mb-3 space-y-2">
                            <div className="flex items-center gap-3">
                                <span
                                    className="inline-flex items-center gap-1 w-20 font-semibold"
                                    style={{ color: isDarkModeOn ? '#388600' : 'rgb(5, 223, 114)' }}
                                >
                                    <IconTrending className="w-3 h-3" />
                                    Green
                                </span>
                                <span>Variant won</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    className="inline-flex items-center gap-1 w-20 font-semibold"
                                    style={{ color: isDarkModeOn ? '#df4b20' : 'rgb(255, 102, 102)' }}
                                >
                                    <IconTrendingDown className="w-3 h-3" />
                                    Red
                                </span>
                                <span>Variant lost</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1 w-20 font-semibold">No color</span>
                                <span>Not statistically significant</span>
                            </div>
                        </div>
                        <p className="mb-3">
                            The bars show{' '}
                            {statsMethod === ExperimentStatsMethod.Bayesian
                                ? '95% credible intervals'
                                : '95% confidence intervals'}
                            . When an interval doesn't cross the 0% line, the result is significant.
                        </p>
                        <p className="mb-0">
                            Insights uses its own statistical methods. Results may differ from other tools.
                        </p>
                    </div>
                }
            >
                <Link
                    to="https://hanzo.ai/docs/experiments/analyzing-results"
                    target="_blank"
                    className="text-xs text-secondary cursor-help"
                    onClick={(e) => e.stopPropagation()}
                >
                    How to read
                </Link>
            </Tooltip>
        </>
    )
}
