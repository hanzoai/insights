import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Button, Divider, Spinner } from '@hanzo/elements'

import { More } from 'lib/elements/Button/More'
import { useAttachedLogic } from 'lib/logic/scenes/useAttachedLogic'
import { EmailTemplater, TemplatePickerModal } from 'scenes/insights-functions/email-templater/EmailTemplater'
import { emailTemplaterLogic } from 'scenes/insights-functions/email-templater/emailTemplaterLogic'
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
    const {
        submitTemplate,
        resetTemplate,
        setTemplateValue,
        duplicateTemplate,
        deleteTemplate,
        setTemplatePickerOpen,
    } = useActions(logic)
    const {
        template,
        originalTemplate,
        isTemplateSubmitting,
        templateChanged,
        messageLoading,
        templateLoading,
        templatePickerOpen,
    } = useValues(logic)

    const { setIsSaveTemplateModalOpen } = useActions(emailTemplaterLogic)

    // Attach template logic to scene logic so it persists across tab switches
    useAttachedLogic(logic, sceneLogic)

    return (
        <Form
            logic={messageTemplateLogic}
            formKey="template"
            props={props}
            {...{ className: 'flex flex-col grow h-full' }}
        >
            <SceneContent className="h-full flex flex-col grow">
                <SceneTitleSection
                    name={template.name}
                    description={template.description}
                    resourceType={{ type: 'template' }}
                    canEdit
                    descriptionAlwaysVisible
                    isLoading={messageLoading || templateLoading}
                    onNameChange={(name) => setTemplateValue('name', name)}
                    onDescriptionChange={(description) => setTemplateValue('description', description)}
                    actions={
                        <>
                            <Divider vertical />
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
                                disabledReason={
                                    !templateChanged
                                        ? 'No changes to save'
                                        : !template.name
                                          ? 'Name is required'
                                          : undefined
                                }
                                size="small"
                            >
                                {props.id === 'new' ? 'Create' : 'Save'}
                            </Button>
                            <More
                                size="small"
                                overlay={
                                    <>
                                        <Button
                                            data-attr="save-as-new-template"
                                            fullWidth
                                            onClick={() => setIsSaveTemplateModalOpen(true)}
                                        >
                                            Save as new template
                                        </Button>
                                        {props.id !== 'new' && (
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
                                        )}
                                    </>
                                }
                            />
                        </>
                    }
                />

                <TemplatePickerModal isOpen={templatePickerOpen} onClose={() => setTemplatePickerOpen(false)} />

                <div className="flex flex-col flex-1 gap-2 min-h-0 relative">
                    {messageLoading || templateLoading ? (
                        <Spinner className="text-lg" />
                    ) : (
                        <EmailTemplater
                            value={template?.content.email}
                            onChange={(value) => setTemplateValue('content.email', value)}
                            onChangeTemplating={(templating) =>
                                setTemplateValue('content.email.templating', templating)
                            }
                            type="native_email_template"
                            layout="inline"
                        />
                    )}
                </div>
            </SceneContent>
        </Form>
    )
}
