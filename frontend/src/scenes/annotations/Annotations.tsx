import { useActions, useValues } from 'kea'

import { IconPencil } from '@hanzo/icons'
import { Select, Link } from '@hanzo/elements'

import { AppShortcut } from 'lib/components/AppShortcuts/AppShortcut'
import { keyBinds } from 'lib/components/AppShortcuts/shortcuts'
import { TextContent } from 'lib/components/Cards/TextCard/TextCard'
import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { TZLabel } from 'lib/components/TZLabel'
import { MicrophoneMascot } from 'lib/components/mascots'
import { Button } from 'lib/elements/Button'
import { Table, TableColumn, TableColumns } from 'lib/elements/Table'
import { createdAtColumn } from 'lib/elements/Table/columnUtils'
import { Tag } from 'lib/elements/Tag/Tag'
import { ProfilePicture } from 'lib/elements/ProfilePicture'
import { Tooltip } from 'lib/elements/Tooltip'
import { cn } from 'lib/utils/css-classes'
import { organizationLogic } from 'scenes/organizationLogic'
import { Scene, SceneExport } from 'scenes/sceneTypes'
import { sceneConfigurations } from 'scenes/scenes'
import { teamLogic } from 'scenes/teamLogic'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { annotationsModel } from '~/models/annotationsModel'
import { ProductKey } from '~/queries/schema/schema-general'
import { AnnotationScope, AnnotationType, InsightShortId } from '~/types'

import { AnnotationModal } from './AnnotationModal'
import { annotationModalLogic, annotationScopeToLevel, annotationScopeToName } from './annotationModalLogic'
import { annotationScopesMenuOptions, annotationsLogic } from './annotationsLogic'

export const scene: SceneExport = {
    component: Annotations,
    logic: annotationsLogic,
    productKey: ProductKey.ANNOTATIONS,
}

export function Annotations(): JSX.Element {
    const { currentTeam } = useValues(teamLogic)

    const { currentOrganization } = useValues(organizationLogic)

    const { openModalToCreateAnnotation } = useActions(annotationModalLogic)

    const { filteredAnnotations, shouldShowEmptyState, annotationsLoading, scope } = useValues(annotationsLogic)
    const { setScope } = useActions(annotationsLogic)

    const { loadingNext, next } = useValues(annotationsModel)
    const { loadAnnotationsNext } = useActions(annotationsModel)

    const columns: TableColumns<AnnotationType> = [
        {
            title: 'Annotation',
            key: 'annotation',
            width: '30%',
            render: function RenderAnnotation(_, annotation: AnnotationType): JSX.Element {
                let renderedContent = <>{annotation.content ?? ''}</>
                if ((annotation.content || '').trim().length > 30) {
                    renderedContent = (
                        <Tooltip
                            title={
                                <TextContent
                                    text={annotation.content ?? ''}
                                    data-attr="annotation-scene-comment-title-rendered-content"
                                />
                            }
                        >
                            {(annotation.content ?? '').slice(0, 27) + '...'}
                        </Tooltip>
                    )
                }
                return (
                    <div className="font-semibold">
                        <Link subtle to={urls.annotation(annotation.id)}>
                            {renderedContent}
                        </Link>
                    </div>
                )
            },
        },
        {
            title: `Timestamp`,
            dataIndex: 'date_marker',
            render: function RenderDateMarker(_, annotation: AnnotationType): JSX.Element | null {
                return annotation.date_marker ? <TZLabel time={annotation.date_marker} /> : null
            },
            sorter: (a, b) => a.date_marker?.diff(b.date_marker) || 1,
        },
        {
            title: 'Scope',
            key: 'scope',
            render: function RenderType(_, annotation: AnnotationType): JSX.Element {
                const scopeName = annotationScopeToName[annotation.scope]
                const tooltip =
                    annotation.scope === AnnotationScope.Insight
                        ? `This annotation only applies to the "${annotation.insight_name}" insight`
                        : annotation.scope === AnnotationScope.Dashboard
                          ? `This annotation applies to all insights on the ${annotation.dashboard_name} dashboard`
                          : annotation.scope === AnnotationScope.Project
                            ? `This annotation applies to all insights in the ${currentTeam?.name} project`
                            : `This annotation applies to all insights in the ${currentOrganization?.name} organization`
                return (
                    <Tooltip title={tooltip} placement="right">
                        <Tag className="uppercase">
                            {annotation.scope === AnnotationScope.Insight ? (
                                <Link
                                    to={urls.insightView(annotation.insight_short_id as InsightShortId)}
                                    className="flex items-center"
                                    target="_blank"
                                    targetBlankIcon
                                >
                                    {scopeName}
                                </Link>
                            ) : (
                                scopeName
                            )}
                        </Tag>
                    </Tooltip>
                )
            },
            sorter: (a, b) => annotationScopeToLevel[a.scope] - annotationScopeToLevel[b.scope],
        },
        {
            title: 'Created by',
            dataIndex: 'created_by',
            render: function Render(_: any, item) {
                const { created_by, creation_type } = item
                return (
                    <div className="flex flex-row items-center">
                        <ProfilePicture
                            user={creation_type === 'GIT' ? { first_name: 'GitHub Actions' } : created_by}
                            showName
                            size="md"
                            type={creation_type === 'GIT' ? 'bot' : 'person'}
                        />
                    </div>
                )
            },
            sorter: (a, b) =>
                (a.created_by?.first_name || a.created_by?.email || '').localeCompare(
                    b.created_by?.first_name || b.created_by?.email || ''
                ),
        },
        createdAtColumn() as TableColumn<AnnotationType, keyof AnnotationType | undefined>,
        {
            key: 'actions',
            width: 0,
            render: function RenderActions(_, annotation): JSX.Element {
                return <Button icon={<IconPencil />} size="small" to={urls.annotation(annotation.id)} />
            },
        },
    ]

    return (
        <SceneContent>
            <SceneTitleSection
                name={sceneConfigurations[Scene.Annotations].name}
                description={sceneConfigurations[Scene.Annotations].description}
                resourceType={{
                    type: sceneConfigurations[Scene.Annotations].iconType || 'default_icon_type',
                }}
                actions={
                    <AppShortcut
                        name="NewAnnotation"
                        keybind={[keyBinds.new]}
                        intent="New annotation"
                        interaction="click"
                        scope={Scene.Annotations}
                    >
                        <Button
                            type="primary"
                            onClick={() => openModalToCreateAnnotation()}
                            size="small"
                            tooltip="New annotation"
                        >
                            New annotation
                        </Button>
                    </AppShortcut>
                }
            />
            <div className="flex flex-row items-center gap-2 justify-end">
                <div>Scope:</div>
                <Select options={annotationScopesMenuOptions()} value={scope} onSelect={setScope} />
            </div>
            <div data-attr="annotations-content">
                <div className={cn('mt-4 mb-0 empty:hidden')}>
                    <ProductIntroduction
                        productName="Annotations"
                        productKey={ProductKey.ANNOTATIONS}
                        thingName="annotation"
                        description="Annotations allow you to mark when certain changes happened so you can easily see how they impacted your metrics."
                        docsURL="https://hanzo.ai/docs/data/annotations"
                        action={() => openModalToCreateAnnotation()}
                        isEmpty={shouldShowEmptyState}
                        customInsights={MicrophoneMascot}
                    />
                </div>
                {!shouldShowEmptyState && (
                    <>
                        <Table
                            data-attr="annotations-table"
                            rowKey="id"
                            dataSource={filteredAnnotations}
                            columns={columns}
                            defaultSorting={{
                                columnKey: 'date_marker',
                                order: -1,
                            }}
                            noSortingCancellation
                            loading={annotationsLoading}
                            emptyState="No annotations yet"
                        />
                        {next && (
                            <div className="flex justify-center mt-6">
                                <Button
                                    type="primary"
                                    loading={loadingNext}
                                    onClick={(): void => {
                                        loadAnnotationsNext()
                                    }}
                                >
                                    Load more annotations
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
            <AnnotationModal />
        </SceneContent>
    )
}
