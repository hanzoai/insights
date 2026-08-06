import { useActions, useValues } from 'kea'

import { IconPlus } from '@hanzo/icons'
import { Banner } from '@hanzo/elements'

import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { IconOpenInNew } from 'lib/elements/icons'
import { Button } from 'lib/elements/Button'
import { Input } from 'lib/elements/Input'
import { Link } from 'lib/elements/Link'
import { Spinner } from 'lib/elements/Spinner'

import { ToolbarMenu } from '~/toolbar/bar/ToolbarMenu'
import { ExperimentsEditingToolbarMenu } from '~/toolbar/experiments/ExperimentsEditingToolbarMenu'
import { ExperimentsListView } from '~/toolbar/experiments/ExperimentsListView'
import { experimentsLogic } from '~/toolbar/experiments/experimentsLogic'
import { experimentsTabLogic } from '~/toolbar/experiments/experimentsTabLogic'
import { toolbarConfigLogic } from '~/toolbar/toolbarConfigLogic'
import { urls } from '~/toolbar/urls'
import { joinWithUiHost } from '~/toolbar/utils'

const ExperimentsListToolbarMenu = (): JSX.Element => {
    const { searchTerm } = useValues(experimentsLogic)
    const { newExperiment } = useActions(experimentsTabLogic)
    const { setSearchTerm, getExperiments } = useActions(experimentsLogic)
    const { allExperiments, sortedExperiments, allExperimentsLoading } = useValues(experimentsLogic)
    const { uiHost } = useValues(toolbarConfigLogic)

    useOnMountEffect(getExperiments)

    const isWebExperimentsDisabled = Boolean(window?.parent?.insights?.config?.disable_web_experiments)

    return (
        <ToolbarMenu>
            {allExperiments.length > 10 && (
                <ToolbarMenu.Header className="px-3 mt-2">
                    <Input
                        autoFocus={true}
                        fullWidth={true}
                        placeholder="Search"
                        type="search"
                        value={searchTerm}
                        onChange={(s) => setSearchTerm(s)}
                    />
                </ToolbarMenu.Header>
            )}
            <ToolbarMenu.Body>
                <div className="px-1 deprecated-space-y-px py-2">
                    {isWebExperimentsDisabled && (
                        <div className="pb-2">
                            <Banner type="warning">
                                Web experiments are disabled in your Insights web snippet configuration. To run
                                experiments, add <code>disable_web_experiments: false</code> to your configuration.{' '}
                                <Link
                                    target="_blank"
                                    targetBlankIcon
                                    to="https://hanzo.ai/docs/experiments/no-code-web-experiments"
                                >
                                    Learn more
                                </Link>
                            </Banner>
                        </div>
                    )}
                    {allExperiments.length === 0 && allExperimentsLoading ? (
                        <div className="text-center my-4">
                            <Spinner />
                        </div>
                    ) : (
                        <ExperimentsListView experiments={sortedExperiments} />
                    )}
                </div>
            </ToolbarMenu.Body>
            <ToolbarMenu.Footer>
                <div className="flex items-center justify-between flex-1">
                    <Link to={joinWithUiHost(uiHost, urls.experiments())} target="_blank">
                        View &amp; edit all experiments <IconOpenInNew />
                    </Link>
                    <Button type="primary" size="small" onClick={() => newExperiment()} icon={<IconPlus />}>
                        New experiment
                    </Button>
                </div>
            </ToolbarMenu.Footer>
        </ToolbarMenu>
    )
}

export const ExperimentsToolbarMenu = (): JSX.Element => {
    const { selectedExperiment } = useValues(experimentsTabLogic)
    return selectedExperiment ? <ExperimentsEditingToolbarMenu /> : <ExperimentsListToolbarMenu />
}
