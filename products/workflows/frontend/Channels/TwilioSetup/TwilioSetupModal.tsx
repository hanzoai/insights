import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Input, Modal } from '@hanzo/elements'

import { IconTwilio } from 'lib/elements/icons'
import { Field } from 'lib/elements/Field'

import { TwilioSetupModalLogicProps, twilioSetupModalLogic } from './twilioSetupModalLogic'

export const TwilioSetupModal = (props: TwilioSetupModalLogicProps): JSX.Element => {
    const { isTwilioIntegrationSubmitting } = useValues(twilioSetupModalLogic(props))
    const { submitTwilioIntegration } = useActions(twilioSetupModalLogic(props))

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <IconTwilio />
                    <span>Configure Twilio SMS channel</span>
                </div>
            }
            onClose={props.onClose}
        >
            <Form logic={twilioSetupModalLogic} formKey="twilioIntegration">
                <div className="gap-4 flex flex-col">
                    <Field name="accountSid" label="Account SID">
                        <Input type="text" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                    </Field>
                    <Field name="authToken" label="Auth token">
                        <Input type="password" />
                    </Field>
                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isTwilioIntegrationSubmitting}
                            onClick={submitTwilioIntegration}
                        >
                            Connect
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    )
}
