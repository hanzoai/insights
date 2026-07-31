import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconCode } from '@hanzo/icons'
import { Button, Divider, Input, TextArea, Spinner, Tooltip } from '@hanzo/elements'

import { More } from 'lib/elements/Button/More'
import { Field } from 'lib/elements/Field'
import { useAttachedLogic } from 'lib/logic/scenes/useAttachedLogic'
import { EmailTemplater } from 'scenes/insights-functions/email-templater/EmailTemplater'
import { SceneExport } from 'scenes/sceneTypes'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { ProductKey } from '~/queries/schema/schema-general'

import { messageTemplateLogic } from './messageTemplateLogic'
import { MessageTemplateSceneLogicProps, messageTemplateSceneLogic } from './messageTemplateSceneLogic'

export const scene: SceneExport<MessageTemplateSceneLogicProps> = {
    component: MessageTemplate,
    logic: messageTemplateSceneLogic,
    paramsToProps: ({ params: { id }, searchParams: { messageId } }) => ({
        id: id || 'new',
        messageId,
    }),
    productKey: ProductKey.WORKFLOWS,
}

export function MessageTemplate(props: MessageTemplateSceneLogicProps): JSX.Element {
    const sceneLogic = messageTemplateSceneLogic(props)
    const logic = messageTemplateLogic(props)
    const { submitTemplate, resetTemplate, setTemplateValue, duplicateTemplate, deleteTemplate } = useActions(logic)
    const { template, originalTemplate, isTemplateSubmitting, templateChanged, messageLoading } = useValues(logic)

    // Attach template logic to scene logic so it persists across tab switches
    useAttachedLogic(logic, sceneLogic)

    return (
        <Form logic={messageTemplateLogic} formKey="template" props={props}>
            <SceneContent>
                <SceneTitleSection
                    name={template.name}
                    resourceType={{ type: 'template' }}
                    actions={
                        <>
                            {props.id !== 'new' && (
                                <>
                                    <More
                                        size="small"
                                        overlay={
                                            <>
                                                <Button
                                                    data-attr="duplicate-message-template"
                                                    fullWidth
                                                    onClick={duplicateTemplate}
                                                    disabledReason={
                                                        templateChanged
                                                            ? 'Save your changes before duplicating'
                                                            : undefined
                                                    }
                                                >
                                                    Duplicate
                                                </Button>
                                                <Divider />
                                                <Button
                                                    data-attr="delete-message-template"
                                                    status="danger"
                                                    fullWidth
                                                    onClick={deleteTemplate}
                                                >
                                                    Delete
                                                </Button>
                                            </>
                                        }
                                    />
                                    <Divider vertical />
                                </>
                            )}
                            {templateChanged && (
                                <Button
                                    data-attr="cancel-message-template"
                                    type="secondary"
                                    onClick={() => resetTemplate(originalTemplate)}
                                    size="small"
                                >
                                    Discard changes
                                </Button>
                            )}
                            <Button
                                type="primary"
                                htmlType="submit"
                                form="template"
                                onClick={submitTemplate}
                                loading={isTemplateSubmitting}
                                disabledReason={templateChanged ? undefined : 'No changes to save'}
                                size="small"
                            >
                                {props.id === 'new' ? 'Create' : 'Save'}
                            </Button>
                        </>
                    }
                />

                <div className="flex flex-wrap gap-4 items-start">
                    <div className="flex-1 self-start p-3 space-y-2 rounded border min-w-100 bg-surface-primary">
                        <Field name="name" label="Name">
                            <Input disabled={messageLoading} />
                        </Field>

                        <Field
                            name="description"
                            label="Description"
                            showOptional
                            info="Add a description to share context with other team members"
                        >
                            <TextArea disabled={messageLoading} />
                        </Field>
                    </div>

                    <div className="p-3 space-y-2 rounded border flex-2 min-w-100 bg-surface-primary">
                        <div className="flex justify-between items-center">
                            <h3>Email template</h3>
                            <Tooltip
                                title="You can use Liquid templating in any email text field."
                                docLink="https://liquidjs.com/filters/overview.html"
                            >
                                <span>
                                    <IconCode fontSize={24} />
                                </span>
                            </Tooltip>
                        </div>
                        {messageLoading ? (
                            <Spinner className="text-lg" />
                        ) : (
                            <EmailTemplater
                                value={template?.content.email}
                                onChange={(value) => setTemplateValue('content.email', value)}
                                onChangeTemplating={(templating) =>
                                    setTemplateValue('content.email.templating', templating)
                                }
                                type="native_email_template"
                            />
                        )}
                    </div>
                </div>
            </SceneContent>
        </Form>
    )
}
