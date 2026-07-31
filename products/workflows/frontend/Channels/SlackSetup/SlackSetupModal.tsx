import { useValues } from 'kea'

import { Button, Modal, Link } from '@hanzo/elements'

import api from 'lib/api'
import { IconSlack } from 'lib/elements/icons'

import { SlackSetupModalLogicProps, slackSetupModalLogic } from './slackSetupModalLogic'

export const SlackSetupModal = (props: SlackSetupModalLogicProps): JSX.Element => {
    const logic = slackSetupModalLogic(props)
    const { slackAvailable } = useValues(logic)

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <IconSlack />
                    <span>Configure Slack integration</span>
                </div>
            }
            footer={
                <div className="flex justify-end">
                    <Button type="secondary" onClick={props.onClose}>
                        Close
                    </Button>
                </div>
            }
            onClose={props.onClose}
        >
            <div className="max-w-[400px]">
                {slackAvailable ? (
                    <Link
                        to={api.integrations.authorizeUrl({ kind: 'slack' })}
                        onClick={() => props.onComplete()}
                        disableClientSideRouting
                    >
                        <img
                            alt="Connect to Slack workspace"
                            height="40"
                            width="139"
                            src="https://platform.slack-edge.com/img/add_to_slack.png"
                            srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                        />
                    </Link>
                ) : (
                    <p className="text-secondary">
                        This Insights instance is not configured for Slack. Please contact the instance owner to
                        configure it.
                    </p>
                )}
            </div>
        </Modal>
    )
}
