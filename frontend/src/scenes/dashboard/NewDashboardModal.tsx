import { useActions, useMountedLogic, useValues } from 'kea'

import { Button, Input } from '@hanzo/elements'

import { Modal } from 'lib/elements/Modal'
import { pluralize } from 'lib/utils'
import { dashboardTemplatesLogic } from 'scenes/dashboard/dashboards/templates/dashboardTemplatesLogic'
import { newDashboardLogic } from 'scenes/dashboard/newDashboardLogic'

import { DashboardTemplateChooser } from './DashboardTemplateChooser'
import { DashboardTemplateVariables } from './DashboardTemplateVariables'
import { dashboardTemplateVariablesLogic } from './dashboardTemplateVariablesLogic'

export function NewDashboardModal(): JSX.Element {
    const builtLogic = useMountedLogic(newDashboardLogic)
    const { hideNewDashboardModal, clearActiveDashboardTemplate, createDashboardFromTemplate } =
        useActions(newDashboardLogic)
    const { newDashboardModalVisible, activeDashboardTemplate, variableSelectModalVisible } =
        useValues(newDashboardLogic)
    const { variables } = useValues(dashboardTemplateVariablesLogic)

    const templatesLogic = dashboardTemplatesLogic({
        scope: builtLogic.props.featureFlagId ? 'feature_flag' : 'default',
    })
    const { templateFilter } = useValues(templatesLogic)
    const { setTemplateFilter } = useActions(templatesLogic)

    const _dashboardTemplateChooser = builtLogic.props.featureFlagId ? (
        <DashboardTemplateChooser scope="feature_flag" />
    ) : (
        <DashboardTemplateChooser />
    )

    return (
        <Modal
            onClose={hideNewDashboardModal}
            isOpen={newDashboardModalVisible}
            title={activeDashboardTemplate ? 'Choose your events' : 'Create a dashboard'}
            data-attr="new-dashboard-chooser"
            description={
                activeDashboardTemplate ? (
                    <p>
                        The <i>{activeDashboardTemplate.template_name}</i> template requires you to choose{' '}
                        {pluralize((activeDashboardTemplate.variables || []).length, 'event', 'events', true)}.
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div>Choose a template or start with a blank slate</div>
                        <div>
                            <Input
                                type="search"
                                placeholder="Filter templates"
                                onChange={setTemplateFilter}
                                value={templateFilter}
                                fullWidth={true}
                                autoFocus
                            />
                        </div>
                    </div>
                )
            }
            footer={
                activeDashboardTemplate ? (
                    <>
                        {variableSelectModalVisible ? (
                            <div />
                        ) : (
                            <Button onClick={clearActiveDashboardTemplate} type="secondary">
                                Back
                            </Button>
                        )}
                        <Button
                            onClick={() => {
                                activeDashboardTemplate &&
                                    createDashboardFromTemplate(activeDashboardTemplate, variables)
                            }}
                            type="primary"
                        >
                            Create
                        </Button>
                    </>
                ) : null
            }
        >
            <div className="NewDashboardModal">
                {activeDashboardTemplate ? <DashboardTemplateVariables /> : _dashboardTemplateChooser}
            </div>
        </Modal>
    )
}
