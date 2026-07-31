import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button } from 'lib/elements/Button'
import { Checkbox } from 'lib/elements/Checkbox'
import { Field } from 'lib/elements/Field'
import { Modal } from 'lib/elements/Modal'
import { deleteDashboardLogic } from 'scenes/dashboard/deleteDashboardLogic'

export function DeleteDashboardModal(): JSX.Element {
    const { hideDeleteDashboardModal } = useActions(deleteDashboardLogic)
    const { isDeleteDashboardSubmitting, deleteDashboardModalVisible } = useValues(deleteDashboardLogic)

    return (
        <Modal
            title="Delete dashboard"
            onClose={hideDeleteDashboardModal}
            isOpen={deleteDashboardModalVisible}
            footer={
                <>
                    <Button
                        form="delete-dashboard-form"
                        type="secondary"
                        data-attr="dashboard-delete"
                        disabled={isDeleteDashboardSubmitting}
                        onClick={hideDeleteDashboardModal}
                    >
                        Cancel
                    </Button>
                    <Button
                        form="delete-dashboard-form"
                        htmlType="submit"
                        type="secondary"
                        status="danger"
                        data-attr="dashboard-delete-submit"
                        loading={isDeleteDashboardSubmitting}
                        disabled={isDeleteDashboardSubmitting}
                    >
                        Delete dashboard
                    </Button>
                </>
            }
        >
            <Form
                logic={deleteDashboardLogic}
                formKey="deleteDashboard"
                id="delete-dashboard-form"
                enableFormOnSubmit
                className="deprecated-space-y-2"
            >
                <Field
                    name="deleteInsights"
                    help="This will only delete insights if they're not on any other dashboards."
                >
                    {({ value, onChange }) => (
                        <Checkbox
                            data-attr="delete-dashboard-insights-checkbox"
                            checked={value}
                            label="Delete this dashboard's insights"
                            onChange={onChange}
                        />
                    )}
                </Field>
            </Form>
        </Modal>
    )
}
