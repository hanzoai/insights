import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button } from 'lib/elements/Button'
import { Checkbox } from 'lib/elements/Checkbox'
import { Field } from 'lib/elements/Field'
import { Modal } from 'lib/elements/Modal'
import { duplicateDashboardLogic } from 'scenes/dashboard/duplicateDashboardLogic'

export function DuplicateDashboardModal(): JSX.Element {
    const { hideDuplicateDashboardModal, duplicateAndGoToDashboard } = useActions(duplicateDashboardLogic)
    const { isDuplicateDashboardSubmitting, duplicateDashboardModalVisible } = useValues(duplicateDashboardLogic)

    return (
        <Modal
            title="Duplicate dashboard"
            onClose={hideDuplicateDashboardModal}
            isOpen={duplicateDashboardModalVisible}
            footer={
                <>
                    <Button
                        form="new-dashboard-form"
                        type="secondary"
                        data-attr="dashboard-cancel"
                        disabled={isDuplicateDashboardSubmitting}
                        onClick={hideDuplicateDashboardModal}
                    >
                        Cancel
                    </Button>
                    <Button
                        form="new-dashboard-form"
                        type="secondary"
                        data-attr="dashboard-submit-and-go"
                        disabled={isDuplicateDashboardSubmitting}
                        onClick={duplicateAndGoToDashboard}
                    >
                        Duplicate and go to dashboard
                    </Button>
                    <Button
                        form="duplicate-dashboard-form"
                        htmlType="submit"
                        type="primary"
                        data-attr="duplicate-dashboard-submit"
                        loading={isDuplicateDashboardSubmitting}
                        disabled={isDuplicateDashboardSubmitting}
                    >
                        Duplicate
                    </Button>
                </>
            }
        >
            <Form
                logic={duplicateDashboardLogic}
                formKey="duplicateDashboard"
                id="duplicate-dashboard-form"
                enableFormOnSubmit
                className="deprecated-space-y-2"
            >
                <Field
                    name="duplicateTiles"
                    help="Choose whether to duplicate this dashboard's insights and text or attach them to the new dashboard."
                >
                    {({ value, onChange }) => (
                        <Checkbox checked={value} label="Duplicate this dashboard's tiles" onChange={onChange} />
                    )}
                </Field>
            </Form>
        </Modal>
    )
}
