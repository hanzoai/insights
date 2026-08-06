import { useActions, useValues } from 'kea'
import { router } from 'kea-router'

import { Button, Input, Table, Tag } from '@hanzo/elements'

import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { Shortcut } from 'lib/components/Shortcuts/Shortcut'
import { keyBinds } from 'lib/components/Shortcuts/shortcuts'
import { createdAtColumn } from 'lib/elements/Table/columnUtils'
import { TableLink } from 'lib/elements/Table/TableLink'
import { TableColumn } from 'lib/elements/Table/types'
import { getAccessControlDisabledReason } from 'lib/utils/accessControlUtils'
import { sceneConfigurations } from 'scenes/scenes'
import { Scene, SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { ProductKey } from '~/queries/schema/schema-general'
import { AccessControlLevel, AccessControlResourceType, EarlyAccessFeatureType } from '~/types'

import { AssigneeDisplay, AssigneeResolver } from 'products/error_tracking/frontend/components/Assignee/AssigneeDisplay'

import { earlyAccessFeaturesLogic } from './earlyAccessFeaturesLogic'

export const scene: SceneExport = {
    component: EarlyAccessFeatures,
    logic: earlyAccessFeaturesLogic,
    productKey: ProductKey.EARLY_ACCESS_FEATURES,
}

const STAGES_IN_ORDER: Record<EarlyAccessFeatureType['stage'], number> = {
    draft: 0,
    concept: 1,
    alpha: 2,
    beta: 3,
    'general-availability': 4,
    archived: 5,
}

export function EarlyAccessFeatures(): JSX.Element {
    const { filteredEarlyAccessFeatures, earlyAccessFeaturesLoading, searchTerm } = useValues(earlyAccessFeaturesLogic)
    const { setSearchTerm } = useActions(earlyAccessFeaturesLogic)
    const shouldShowEmptyState = filteredEarlyAccessFeatures.length == 0 && !earlyAccessFeaturesLoading && !searchTerm

    // Creating an early access feature requires editor access to the resource.
    const accessControlDisabledReason = getAccessControlDisabledReason(
        AccessControlResourceType.EarlyAccessFeature,
        AccessControlLevel.Editor
    )

    return (
        <SceneContent>
            <SceneTitleSection
                name={sceneConfigurations[Scene.EarlyAccessFeatures].name}
                description={sceneConfigurations[Scene.EarlyAccessFeatures].description}
                resourceType={{
                    type: sceneConfigurations[Scene.EarlyAccessFeatures].iconType || 'default_icon_type',
                }}
                actions={
                    <Shortcut
                        name="NewEarlyAccessFeature"
                        keybind={[keyBinds.new]}
                        intent="New early access feature"
                        interaction="click"
                        scope={Scene.EarlyAccessFeatures}
                    >
                        <Button
                            size="small"
                            type="primary"
                            to={urls.earlyAccessFeature('new')}
                            tooltip="New feature"
                            data-attr="create-feature"
                            disabledReason={accessControlDisabledReason ?? undefined}
                        >
                            New feature
                        </Button>
                    </Shortcut>
                }
            />

            <ProductIntroduction
                productName="Early access features"
                productKey={ProductKey.EARLY_ACCESS_FEATURES}
                thingName="feature"
                description="Allow your users to individually enable or disable features that are in public beta."
                isEmpty={shouldShowEmptyState}
                docsURL="https://hanzo.ai/docs/feature-flags/early-access-feature-management"
                action={() => router.actions.push(urls.earlyAccessFeature('new'))}
                className="my-0"
                mcpSurfaceKey="early_access_features.create"
            />
            {!shouldShowEmptyState && (
                <>
                    <div className="mb-4">
                        <Input
                            type="search"
                            placeholder="Search early access features..."
                            value={searchTerm}
                            onChange={setSearchTerm}
                            allowClear
                        />
                    </div>
                    <Table
                        loading={earlyAccessFeaturesLoading}
                        columns={[
                            {
                                title: 'Name',
                                key: 'name',
                                render(_, feature) {
                                    return (
                                        <TableLink
                                            title={feature.name}
                                            description={feature.description}
                                            to={urls.earlyAccessFeature(feature.id)}
                                        />
                                    )
                                },
                                sorter: (a, b) => a.name.localeCompare(b.name),
                            },
                            {
                                title: 'Stage',
                                dataIndex: 'stage',
                                render(_, { stage }) {
                                    return (
                                        <Tag
                                            type={
                                                stage === 'beta'
                                                    ? 'warning'
                                                    : stage === 'general-availability'
                                                      ? 'success'
                                                      : 'default'
                                            }
                                            className="uppercase cursor-default"
                                            data-attr="feature-stage"
                                        >
                                            {stage}
                                        </Tag>
                                    )
                                },
                                sorter: (a, b) => STAGES_IN_ORDER[a.stage] - STAGES_IN_ORDER[b.stage],
                            },
                            {
                                title: 'Assignee',
                                key: 'assignee',
                                render(_, { assignee }) {
                                    return (
                                        <AssigneeResolver assignee={assignee ?? null}>
                                            {({ assignee: resolvedAssignee }) => (
                                                <AssigneeDisplay assignee={resolvedAssignee} size="small" />
                                            )}
                                        </AssigneeResolver>
                                    )
                                },
                            },
                            createdAtColumn<EarlyAccessFeatureType>() as TableColumn<
                                EarlyAccessFeatureType,
                                keyof EarlyAccessFeatureType | undefined
                            >,
                        ]}
                        dataSource={filteredEarlyAccessFeatures}
                        emptyState={
                            searchTerm ? (
                                <div className="text-center py-8">No early access features match your search</div>
                            ) : undefined
                        }
                    />
                </>
            )}
        </SceneContent>
    )
}
