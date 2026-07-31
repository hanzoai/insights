import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconGitLab } from '@hanzo/icons'
import { Button, Input, Modal, Link } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { GitLabSetupModalLogicProps, gitlabSetupModalLogic } from './gitlabSetupModalLogic'

export const GitLabSetupModal = (props: GitLabSetupModalLogicProps): JSX.Element => {
    const logic = gitlabSetupModalLogic(props)
    const { isGitlabIntegrationSubmitting } = useValues(logic)
    const { submitGitlabIntegration } = useActions(logic)

    return (
        <Modal
            isOpen={props.isOpen}
            title={
                <div className="flex items-center gap-2">
                    <IconGitLab />
                    <span>Configure GitLab integration</span>
                </div>
            }
            onClose={props.onComplete}
        >
            <Form logic={gitlabSetupModalLogic} props={props} formKey="gitlabIntegration">
                <div className="gap-4 flex flex-col">
                    <Field name="hostname" label="Hostname">
                        <Input type="text" placeholder="https://gitlab.com" />
                    </Field>
                    <Field
                        name="projectId"
                        label="Project ID"
                        help={
                            <Link
                                target="_blank"
                                to="https://docs.gitlab.com/user/project/working_with_projects/#find-the-project-id"
                            >
                                Find your Project ID
                            </Link>
                        }
                    >
                        <Input type="text" placeholder="1234567" />
                    </Field>
                    <Field
                        name="projectAccessToken"
                        label="Project access token"
                        help={
                            <>
                                Learn how to{' '}
                                <Link
                                    target="_blank"
                                    to="https://docs.gitlab.com/user/project/settings/project_access_tokens"
                                >
                                    create a project access token
                                </Link>
                            </>
                        }
                    >
                        <Input
                            type="password"
                            placeholder="xxxxx-x_xxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxx.xx.xxxxxxxxx"
                        />
                    </Field>
                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isGitlabIntegrationSubmitting}
                            onClick={submitGitlabIntegration}
                        >
                            Connect
                        </Button>
                    </div>
                </div>
            </Form>
        </Modal>
    )
}
