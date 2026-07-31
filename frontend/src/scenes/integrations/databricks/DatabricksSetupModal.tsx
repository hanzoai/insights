import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input, Modal } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { IconDatabricks } from 'lib/elements/icons'

import { DatabricksSetupModalLogicProps, databricksSetupModalLogic } from './databricksSetupModalLogic'

export const DatabricksSetupModal = (props: DatabricksSetupModalLogicProps): JSX.Element => {
    const { isDatabricksIntegrationSubmitting } = useValues(databricksSetupModalLogic(props))
    const { submitDatabricksIntegration } = useActions(databricksSetupModalLogic(props))

    return (
        <Modal
            isOpen={props.isOpen}
            title={
                <div className="flex items-center gap-2">
                    <IconDatabricks />
                    <span>Configure Databricks integration</span>
                </div>
            }
            onClose={props.onComplete}
        >
            <Form logic={databricksSetupModalLogic} formKey="databricksIntegration">
                <div className="gap-4 flex flex-col">
                    <Field name="serverHostname" label="Server Hostname">
                        <Input type="text" placeholder="dbc-xxxxxxxxx-xxxx.cloud.databricks.com" />
                    </Field>
                    <Field name="clientId" label="Client ID">
                        <Input type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                    </Field>
                    <Field name="clientSecret" label="Client Secret">
                        <Input type="password" />
                    </Field>
                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isDatabricksIntegrationSubmitting}
                            onClick={submitDatabricksIntegration}
                        >
                            Connect
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    )
}
