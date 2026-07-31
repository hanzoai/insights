import { useActions, useValues } from 'kea'

import { Button, Divider } from '@hanzo/elements'

import { More } from 'lib/elements/Button/More'
import { Dialog } from 'lib/elements/Dialog'
import { Snack } from 'lib/elements/Snack/Snack'
import { Table, TableColumns } from 'lib/elements/Table'
import { DashboardTemplateEditor } from 'scenes/dashboard/DashboardTemplateEditor'
import { dashboardTemplateEditorLogic } from 'scenes/dashboard/dashboardTemplateEditorLogic'
import { dashboardTemplatesLogic } from 'scenes/dashboard/dashboards/templates/dashboardTemplatesLogic'
import { userLogic } from 'scenes/userLogic'

import { DashboardTemplateType } from '~/types'

export const DashboardTemplatesTable = (): JSX.Element | null => {
    const { allTemplates, allTemplatesLoading } = useValues(dashboardTemplatesLogic)

    const { openDashboardTemplateEditor, setDashboardTemplateId, deleteDashboardTemplate, updateDashboardTemplate } =
        useActions(dashboardTemplateEditorLogic)

    const { user } = useValues(userLogic)

    const columns: TableColumns<DashboardTemplateType> = [
        {
            title: 'Name',
            dataIndex: 'template_name',
            render: (_, { template_name }) => {
                return <>{template_name}</>
            },
        },
        {
            title: 'Description',
            dataIndex: 'dashboard_description',
            render: (_, { dashboard_description }) => {
                return <>{dashboard_description}</>
            },
        },
        {
            title: 'Type',
            dataIndex: 'team_id',
            render: (_, { scope }) => {
                if (scope === 'global') {
                    return <Snack>Official</Snack>
                }
                return <Snack>Team</Snack>
            },
        },
        {
            width: 0,
            render: (_, { id, scope }: DashboardTemplateType) => {
                if (!user?.is_staff) {
                    return null
                }
                return (
                    <More
                        overlay={
                            <>
                                <Button
                                    onClick={() => {
                                        if (id === undefined) {
                                            console.error('Dashboard template id not defined')
                                            return
                                        }
                                        setDashboardTemplateId(id)
                                        openDashboardTemplateEditor()
                                    }}
                                    fullWidth
                                >
                                    Edit
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (id === undefined) {
                                            console.error('Dashboard template id not defined')
                                            return
                                        }
                                        updateDashboardTemplate({
                                            id,
                                            dashboardTemplateUpdates: {
                                                scope: scope === 'global' ? 'team' : 'global',
                                            },
                                        })
                                    }}
                                    fullWidth
                                >
                                    Make visible to {scope === 'global' ? 'this team only' : 'everyone'}
                                </Button>

                                <Divider />
                                <Button
                                    onClick={() => {
                                        if (id === undefined) {
                                            console.error('Dashboard template id not defined')
                                            return
                                        }
                                        Dialog.open({
                                            title: 'Delete dashboard template?',
                                            description: 'This action cannot be undone.',
                                            primaryButton: {
                                                status: 'danger',
                                                children: 'Delete',
                                                onClick: () => {
                                                    deleteDashboardTemplate(id)
                                                },
                                            },
                                        })
                                    }}
                                    fullWidth
                                    status="danger"
                                    disabledReason={
                                        scope === 'global'
                                            ? 'Cannot delete global dashboard templates, make them team only first'
                                            : undefined
                                    }
                                >
                                    Delete dashboard
                                </Button>
                            </>
                        }
                    />
                )
            },
        },
    ]

    return (
        <>
            <Table
                data-attr="dashboards-template-table"
                pagination={{ pageSize: 10 }}
                dataSource={Object.values(allTemplates)}
                columns={columns}
                loading={allTemplatesLoading}
                defaultSorting={{
                    columnKey: 'name',
                    order: 1,
                }}
                emptyState={<>There are no dashboard templates.</>}
                nouns={['template', 'templates']}
            />
            <DashboardTemplateEditor />
        </>
    )
}
