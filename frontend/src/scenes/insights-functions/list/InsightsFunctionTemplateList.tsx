import { useActions, useValues } from 'kea'
import { useEffect } from 'react'

import { IconMegaphone, IconPlusSmall } from '@posthog/icons'
import { LemonButton, LemonInput, LemonTable, Link } from '@posthog/lemon-ui'

import { LemonTableLink } from 'lib/lemon-ui/LemonTable/LemonTableLink'
import { getAccessControlDisabledReason } from 'lib/utils/accessControlUtils'
import { isManagedSourceTemplate } from 'scenes/data-warehouse/utils'

import { AccessControlLevel, AccessControlResourceType } from '~/types'

import { InsightsFunctionIcon } from '../configuration/InsightsFunctionIcon'
import { InsightsFunctionStatusTag } from '../misc/InsightsFunctionStatusTag'
import { insightsFunctionRequestModalLogic } from './insightsFunctionRequestModalLogic'
import { InsightsFunctionTemplateListLogicProps, insightsFunctionTemplateListLogic } from './insightsFunctionTemplateListLogic'

export function InsightsFunctionTemplateList({
    extraControls,
    hideFeedback = false,
    ...props
}: InsightsFunctionTemplateListLogicProps & { extraControls?: JSX.Element; hideFeedback?: boolean }): JSX.Element {
    const { loading, filteredTemplates, filters, templates, urlForTemplate } = useValues(
        insightsFunctionTemplateListLogic(props)
    )
    const { loadInsightsFunctionTemplates, setFilters, resetFilters, registerInterest } = useActions(
        insightsFunctionTemplateListLogic(props)
    )
    const { openFeedbackDialog } = useActions(insightsFunctionRequestModalLogic)

    useEffect(() => loadInsightsFunctionTemplates(), [props.type]) // oxlint-disable-line exhaustive-deps

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
                <LemonInput
                    type="search"
                    placeholder="Search..."
                    value={filters.search ?? ''}
                    onChange={(e) => setFilters({ search: e })}
                />
                {!hideFeedback ? (
                    <Link className="text-sm font-semibold" subtle onClick={() => openFeedbackDialog(props.type)}>
                        Can't find what you're looking for?
                    </Link>
                ) : null}
                <div className="flex-1" />
                {extraControls}
            </div>

            <LemonTable
                dataSource={filteredTemplates}
                size="small"
                loading={loading}
                columns={[
                    {
                        title: '',
                        width: 0,
                        render: function RenderIcon(_, template) {
                            return (
                                <InsightsFunctionIcon
                                    src={template.icon_url}
                                    className={template.icon_class_name}
                                    size="small"
                                />
                            )
                        },
                    },
                    {
                        title: 'Name',
                        sticky: true,
                        sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
                        key: 'name',
                        dataIndex: 'name',
                        render: (_, template) => {
                            const hasAccess =
                                !isManagedSourceTemplate(template) ||
                                !getAccessControlDisabledReason(
                                    AccessControlResourceType.ExternalDataSource,
                                    AccessControlLevel.Editor
                                )
                            return (
                                <LemonTableLink
                                    to={hasAccess ? (urlForTemplate(template) ?? undefined) : undefined}
                                    title={
                                        <>
                                            {template.name}
                                            {template.status && <InsightsFunctionStatusTag status={template.status} />}
                                        </>
                                    }
                                    description={template.description}
                                />
                            )
                        },
                    },

                    {
                        width: 0,
                        render: function Render(_, template) {
                            const dataWarehouseSourceAccessDisabledReason =
                                isManagedSourceTemplate(template) &&
                                getAccessControlDisabledReason(
                                    AccessControlResourceType.ExternalDataSource,
                                    AccessControlLevel.Editor
                                )

                            if (template.status === 'coming_soon') {
                                return (
                                    <LemonButton
                                        type="primary"
                                        data-attr="request-destination"
                                        icon={<IconMegaphone />}
                                        className="whitespace-nowrap"
                                        onClick={() => registerInterest(template)}
                                    >
                                        Notify me
                                    </LemonButton>
                                )
                            }

                            const button = (
                                <LemonButton
                                    type="primary"
                                    data-attr="new-destination"
                                    icon={<IconPlusSmall />}
                                    to={urlForTemplate(template) ?? undefined}
                                    fullWidth
                                    disabledReason={dataWarehouseSourceAccessDisabledReason ?? undefined}
                                >
                                    Create
                                </LemonButton>
                            )
                            return button
                        },
                    },
                ]}
                emptyState={
                    templates.length === 0 && !loading ? (
                        'No results found'
                    ) : (
                        <>
                            Nothing found matching filters. <Link onClick={() => resetFilters()}>Clear filters</Link>
                        </>
                    )
                }
            />
        </div>
    )
}
