import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import {
    Button,
    CalendarSelectInput,
    Modal,
    ModalProps,
    Select,
    SelectOptions,
    TextAreaMarkdown,
    Link,
} from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { shortTimeZone } from 'lib/utils'
import { urls } from 'scenes/urls'

import { AnnotationScope, AnnotationType } from '~/types'

import { annotationModalLogic, annotationScopeToName } from './annotationModalLogic'

export function NewAnnotationButton(): JSX.Element {
    const { openModalToCreateAnnotation } = useActions(annotationModalLogic)
    return (
        <Button type="primary" data-attr="create-annotation" onClick={() => openModalToCreateAnnotation()}>
            New annotation
        </Button>
    )
}

export function AnnotationModal({
    overlayRef,
    contentRef,
}: Pick<ModalProps, 'overlayRef' | 'contentRef'>): JSX.Element {
    const {
        isModalOpen,
        existingModalAnnotation,
        annotationModal,
        isAnnotationModalSubmitting,
        onSavedInsight,
        timezone,
    } = useValues(annotationModalLogic)
    const { closeModal, deleteAnnotation, submitAnnotationModal } = useActions(annotationModalLogic)

    const scopeOptions: SelectOptions<AnnotationType['scope'] | null> = [
        {
            value: AnnotationScope.Insight,
            label: annotationScopeToName[AnnotationScope.Insight],
            tooltip: existingModalAnnotation?.insight_name ? (
                existingModalAnnotation.insight_name
            ) : existingModalAnnotation?.insight_derived_name ? (
                <i>{existingModalAnnotation.insight_derived_name}</i>
            ) : undefined,
            disabledReason:
                (!onSavedInsight && 'You need to save the insight first.') ||
                // if existing annotation data in db (for backwards compatibility) doesn't have insight id set on it
                // we can't let them change scope to insight as we don't know which insight to map to
                (existingModalAnnotation
                    ? !existingModalAnnotation?.dashboard_item &&
                      'To select this scope, open this annotation on the target insight'
                    : undefined),
            sideIcon: existingModalAnnotation?.insight_short_id ? (
                <Link
                    to={urls.insightView(existingModalAnnotation?.insight_short_id)}
                    target="_blank"
                    targetBlankIcon
                />
            ) : null,
        },
        {
            value: AnnotationScope.Dashboard,
            label: annotationScopeToName[AnnotationScope.Dashboard],
            tooltip: existingModalAnnotation?.dashboard_name,
            disabledReason:
                (!annotationModal.dashboardId &&
                    'To select this scope, open this annotation on the target dashboard') ||
                (existingModalAnnotation?.scope === AnnotationScope.Dashboard && 'Already scoped to dashboard') ||
                (existingModalAnnotation && existingModalAnnotation?.dashboard_name
                    ? annotationModal.dashboardId != existingModalAnnotation.dashboard_id &&
                      `To select this scope, open this annotation on the ${existingModalAnnotation?.dashboard_name} dashboard`
                    : undefined),
            sideIcon:
                existingModalAnnotation?.dashboard_id &&
                existingModalAnnotation?.scope !== AnnotationScope.Dashboard &&
                existingModalAnnotation.dashboard_id !== annotationModal.dashboardId ? (
                    <Link to={urls.dashboard(existingModalAnnotation?.dashboard_id)} target="_blank" targetBlankIcon />
                ) : null,
        },
        {
            value: AnnotationScope.Project,
            label: annotationScopeToName[AnnotationScope.Project],
        },
        {
            value: AnnotationScope.Organization,
            label: annotationScopeToName[AnnotationScope.Organization],
        },
    ]

    return (
        <Modal
            overlayRef={overlayRef}
            contentRef={contentRef}
            isOpen={isModalOpen}
            onClose={closeModal}
            title={existingModalAnnotation ? 'Edit annotation' : 'New annotation'}
            description="Use annotations to comment on insights, dashboards"
            footer={
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {existingModalAnnotation && (
                            <Button
                                form="annotation-modal-form"
                                type="secondary"
                                status="danger"
                                onClick={() => {
                                    deleteAnnotation(existingModalAnnotation)
                                    closeModal()
                                }}
                                data-attr="delete-annotation"
                            >
                                Delete annotation
                            </Button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button form="annotation-modal-form" type="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button
                            form="annotation-modal-form"
                            htmlType="submit"
                            type="primary"
                            loading={isAnnotationModalSubmitting}
                            data-attr="create-annotation-submit"
                        >
                            Save
                        </Button>
                    </div>
                </div>
            }
            width={512}
        >
            <Form
                logic={annotationModalLogic}
                formKey="annotationModal"
                id="annotation-modal-form"
                enableFormOnSubmit
                className="deprecated-space-y-4"
            >
                <div className="flex gap-2">
                    <Field
                        name="dateMarker"
                        label={
                            <span>
                                Date and time (
                                <Link to={urls.settings('environment-customization', 'date-and-time')} target="_blank">
                                    {shortTimeZone(timezone)}
                                </Link>
                                )
                            </span>
                        }
                        className="flex-1"
                    >
                        <CalendarSelectInput granularity="minute" />
                    </Field>
                    <Field name="scope" label="Scope" className="flex-1">
                        <Select options={scopeOptions} fullWidth />
                    </Field>
                </div>
                <Field name="content" label="Content">
                    <TextAreaMarkdown
                        placeholder="What's this annotation about?"
                        onPressCmdEnter={submitAnnotationModal}
                        data-attr="create-annotation-input"
                        maxLength={400}
                    />
                </Field>
            </Form>
        </Modal>
    )
}
