import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { createRef } from 'react'

import { IconImage } from '@hanzo/icons'
import { Skeleton, Tag } from '@hanzo/elements'

import { PropertyStatusControl } from 'lib/components/DefinitionPopover/DefinitionPopoverContents'
import { FlaggedFeature } from 'lib/components/FlaggedFeature'
import { ImageCarousel } from 'lib/components/ImageCarousel/ImageCarousel'
import { NotFound } from 'lib/components/NotFound'
import { ObjectTags } from 'lib/components/ObjectTags/ObjectTags'
import { PayGateMini } from 'lib/components/PayGateMini/PayGateMini'
import { PropertyKeyInfo } from 'lib/components/PropertyKeyInfo'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { TaxonomicPopover } from 'lib/components/TaxonomicPopover/TaxonomicPopover'
import { FEATURE_FLAGS } from 'lib/constants'
import { useUploadFiles } from 'lib/hooks/useUploadFiles'
import { Button } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { FileInput } from 'lib/elements/FileInput/FileInput'
import { Label } from 'lib/elements/Label/Label'
import { Select } from 'lib/elements/Select'
import { TextArea } from 'lib/elements/TextArea/TextArea'
import { toast } from 'lib/elements/Toast/Toast'
import { getPrimaryPropertyForEvent, hasTaxonomyPrimaryProperty } from 'lib/utils/events'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { definitionEditLogic } from 'scenes/data-management/definition/definitionEditLogic'
import {
    DefinitionLogicProps,
    decodeDefinitionId,
    definitionLogic,
} from 'scenes/data-management/definition/definitionLogic'
import { PropertyAccessControl } from 'scenes/data-management/definition/PropertyAccessControl'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { SceneExport } from 'scenes/sceneTypes'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneDivider } from '~/layout/scenes/components/SceneDivider'
import { SceneSection } from '~/layout/scenes/components/SceneSection'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { tagsModel } from '~/models/tagsModel'
import { isCoreFilter } from '~/taxonomy/helpers'
import { AvailableFeature, ObjectMediaPreview } from '~/types'

import { getEventDefinitionIcon, getPropertyDefinitionIcon } from '../events/DefinitionHeader'

export const scene: SceneExport<DefinitionLogicProps> = {
    component: DefinitionEdit,
    logic: definitionLogic,
    paramsToProps: ({ params: { id } }) => ({ id: decodeDefinitionId(id) }),
}

export function DefinitionEdit(rawProps: DefinitionLogicProps): JSX.Element {
    // The app renders scene components with raw route params, so decode the id like paramsToProps does
    const props = { ...rawProps, id: decodeDefinitionId(rawProps.id) }
    const logic = definitionEditLogic(props)
    const definitionLogicInstance = definitionLogic(props)
    const { definitionLoading, definitionMissing, isProperty, singular } = useValues(definitionLogicInstance)
    const { editDefinition } = useValues(logic)
    const { saveDefinition } = useActions(logic)
    const { tags, tagsLoading } = useValues(tagsModel)
    const { currentTeamId } = useValues(teamLogic)
    const { objectStorageAvailable } = useValues(preflightLogic)
    const { reportMediaPreviewUploaded } = useActions(eventUsageLogic)

    const allowVerification = !isCoreFilter(editDefinition.name) && 'verified' in editDefinition

    const showHiddenOption = 'hidden' in editDefinition

    const { previews, previewsLoading } = useValues(definitionLogicInstance)
    const { createMediaPreview, deleteMediaPreview } = useActions(definitionLogicInstance)

    const { setFilesToUpload, filesToUpload, uploading } = useUploadFiles({
        onUpload: (_url, _fileName, uploadedMediaId) => {
            createMediaPreview(uploadedMediaId)
            reportMediaPreviewUploaded('definition_edit')
        },
        onError: (detail) => {
            toast.error(`Error uploading image: ${detail}`)
        },
    })

    const mediaPreviewDragTarget = createRef<HTMLDivElement>()

    if (definitionMissing) {
        return <NotFound object={singular} />
    }
    return (
        <Form logic={definitionEditLogic} props={props} formKey="editDefinition">
            <SceneContent>
                <SceneTitleSection
                    name={editDefinition.name}
                    resourceType={{
                        type: isProperty ? 'property definition' : 'event definition',
                        forceIcon: isProperty
                            ? getPropertyDefinitionIcon(editDefinition)
                            : getEventDefinitionIcon(editDefinition),
                    }}
                    forceBackTo={
                        isProperty
                            ? {
                                  path: urls.propertyDefinitions(),
                                  name: 'Property definitions',
                                  key: 'properties',
                              }
                            : {
                                  path: urls.eventDefinitions(),
                                  name: 'Event definitions',
                                  key: 'events',
                              }
                    }
                    actions={
                        <>
                            <Button
                                data-attr="save-definition"
                                type="primary"
                                size="small"
                                onClick={() => {
                                    saveDefinition({})
                                }}
                                disabledReason={definitionLoading ? 'Loading...' : undefined}
                            >
                                Save
                            </Button>
                            <Button
                                data-attr="cancel-definition"
                                type="secondary"
                                size="small"
                                to={
                                    !isProperty
                                        ? urls.eventDefinition(editDefinition.id)
                                        : urls.propertyDefinition(editDefinition.id)
                                }
                                disabledReason={definitionLoading ? 'Loading...' : undefined}
                            >
                                Cancel
                            </Button>
                        </>
                    }
                />

                {definitionLoading ? (
                    <div className="deprecated-space-y-4">
                        <Skeleton className="h-10 w-1/3" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-30 w-1/2" />
                    </div>
                ) : (
                    <div className="deprecated-space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-secondary">
                            <div>{isProperty ? 'Property' : 'Event'} name:</div>
                            <Tag className="font-mono">{editDefinition.name}</Tag>
                        </div>
                        {'tags' in editDefinition && (
                            <div className="ph-ignore-input">
                                <Field name="tags" label="Tags" data-attr="definition-tags">
                                    {({ value, onChange }) => (
                                        <ObjectTags
                                            className="definition-tags"
                                            saving={definitionLoading || tagsLoading}
                                            tags={value || []}
                                            onChange={(tags) => onChange(tags)}
                                            style={{ marginBottom: 4 }}
                                            tagsAvailable={tags}
                                        />
                                    )}
                                </Field>
                            </div>
                        )}

                        <div className="ph-ignore-input">
                            <Field name="description" label="Description" data-attr="definition-description">
                                <TextArea value={editDefinition.description} />
                            </Field>
                        </div>

                        {/* Allow uploading media previews only for custom events; not that useful for properties or autocapture events */}
                        <FlaggedFeature flag={FEATURE_FLAGS.EVENT_MEDIA_PREVIEWS}>
                            {objectStorageAvailable && !isProperty && !isCoreFilter(editDefinition.name) && (
                                <div className="ph-ignore-input">
                                    <Field
                                        name="media_preview"
                                        label={
                                            <Label info="Previews show where a client side event is triggered. Upload a screenshot or design.">
                                                Media preview
                                            </Label>
                                        }
                                    >
                                        <div>
                                            <div
                                                ref={mediaPreviewDragTarget}
                                                className="mb-4 border-2 border-dashed rounded p-4 flex items-center justify-center cursor-pointer"
                                                onClick={(e) => {
                                                    if (e.target === e.currentTarget) {
                                                        const input = mediaPreviewDragTarget.current?.querySelector(
                                                            'input[type="file"]'
                                                        ) as HTMLInputElement
                                                        input?.click()
                                                    }
                                                }}
                                            >
                                                <FileInput
                                                    accept="image/*"
                                                    multiple={false}
                                                    onChange={setFilesToUpload}
                                                    loading={uploading}
                                                    value={filesToUpload}
                                                    alternativeDropTargetRef={mediaPreviewDragTarget}
                                                    callToAction={
                                                        <div className="flex items-center gap-2">
                                                            <IconImage />
                                                            <span>Click or drag and drop to upload an image</span>
                                                        </div>
                                                    }
                                                />
                                            </div>

                                            {(previewsLoading || (previews && previews.length > 0)) && (
                                                <ImageCarousel
                                                    loading={previewsLoading}
                                                    imageUrls={
                                                        previews?.map((p: ObjectMediaPreview) => p.media_url) ?? []
                                                    }
                                                    onDelete={(url: string) => {
                                                        const preview = previews.find(
                                                            (p: ObjectMediaPreview) => p.media_url === url
                                                        )
                                                        if (preview) {
                                                            deleteMediaPreview(preview.id)
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </Field>
                                </div>
                            )}
                        </FlaggedFeature>

                        {(allowVerification || showHiddenOption) && (
                            <div className="ph-ignore-input">
                                <Field name="verified" label="Status" data-attr="definition-status">
                                    {({ value: verified, onChange }) => (
                                        <Field name="hidden">
                                            {({ value: hidden, onChange: onHiddenChange }) => (
                                                <PropertyStatusControl
                                                    isProperty={isProperty}
                                                    verified={!!verified}
                                                    hidden={!!hidden}
                                                    showHiddenOption={showHiddenOption}
                                                    allowVerification={allowVerification}
                                                    onChange={({ verified: newVerified, hidden: newHidden }) => {
                                                        onChange(newVerified)
                                                        onHiddenChange(newHidden)
                                                    }}
                                                />
                                            )}
                                        </Field>
                                    )}
                                </Field>
                            </div>
                        )}

                        {isProperty && (
                            <div className="ph-ignore-input">
                                <Field name="property_type" label="Property Type" data-attr="property-type">
                                    {({ value, onChange }) => (
                                        <Select
                                            onChange={(val) => onChange(val)}
                                            value={value as 'DateTime' | 'String' | 'Numeric' | 'Boolean'}
                                            options={[
                                                { value: 'DateTime', label: 'DateTime' },
                                                { value: 'String', label: 'String' },
                                                { value: 'Numeric', label: 'Numeric' },
                                                { value: 'Boolean', label: 'Boolean' },
                                            ]}
                                        />
                                    )}
                                </Field>
                            </div>
                        )}

                        {!isProperty &&
                            hasTaxonomyPrimaryProperty(editDefinition.name) &&
                            (() => {
                                const taxonomyValue = getPrimaryPropertyForEvent(editDefinition.name)
                                if (!taxonomyValue) {
                                    return null
                                }
                                return (
                                    <div className="ph-ignore-input">
                                        <Label info="This event has a built-in primary property that Insights ships with — it can't be overridden on a per-team basis.">
                                            Primary property
                                        </Label>
                                        <div
                                            className="flex items-center gap-2 mt-1"
                                            data-attr="definition-primary-property-builtin"
                                        >
                                            <PropertyKeyInfo
                                                value={taxonomyValue}
                                                type={TaxonomicFilterGroupType.EventProperties}
                                                disableIcon
                                            />
                                            <Tag type="muted" size="small">
                                                Built-in
                                            </Tag>
                                        </div>
                                    </div>
                                )
                            })()}

                        {!isProperty && !hasTaxonomyPrimaryProperty(editDefinition.name) && (
                            <FlaggedFeature flag={FEATURE_FLAGS.PROMOTED_EVENT_PROPERTIES_EDIT}>
                                <div className="ph-ignore-input">
                                    <Field
                                        name="primary_property"
                                        label={
                                            <Label info="When set, Insights surfaces like the session replay inspector show this property's value alongside the event. Choose the single property that best summarizes each occurrence of the event.">
                                                Primary property
                                            </Label>
                                        }
                                        data-attr="definition-primary-property"
                                    >
                                        {({ value, onChange }) => (
                                            <TaxonomicPopover<string>
                                                allowClear
                                                data-attr="definition-primary-property-picker"
                                                groupType={TaxonomicFilterGroupType.EventProperties}
                                                eventNames={[editDefinition.name]}
                                                value={value ?? null}
                                                onChange={(changedValue) =>
                                                    onChange(typeof changedValue === 'string' ? changedValue : null)
                                                }
                                                placeholder="Select a primary property"
                                                selectingKeyOnly
                                            />
                                        )}
                                    </Field>
                                </div>
                            </FlaggedFeature>
                        )}
                    </div>
                )}

                {isProperty && editDefinition.id !== 'new' && currentTeamId && (
                    <FlaggedFeature flag={FEATURE_FLAGS.PROPERTY_ACCESS_CONTROL}>
                        <SceneDivider />
                        <SceneSection
                            title="Access control"
                            description="Control who can see this property's values, and who can edit them from the Insights UI."
                        >
                            <PayGateMini feature={AvailableFeature.PROPERTY_ACCESS_CONTROL}>
                                <PropertyAccessControl
                                    propertyDefinitionId={editDefinition.id}
                                    teamId={currentTeamId}
                                />
                            </PayGateMini>
                        </SceneSection>
                    </FlaggedFeature>
                )}
            </SceneContent>
        </Form>
    )
}
