import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconEllipsis, IconPlusSmall } from '@hanzo/icons'
import {
    Button,
    Dialog,
    Input,
    Label,
    Menu,
    Modal,
    Select,
    Table,
    TableColumns,
} from '@hanzo/elements'

import { PropertyFilters } from 'lib/components/PropertyFilters/PropertyFilters'
import { RestrictionScope, useRestrictedArea } from 'lib/components/RestrictedArea'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { TaxonomicStringPopover } from 'lib/components/TaxonomicPopover/TaxonomicPopover'
import { TestAccountFilterSwitch } from 'lib/components/TestAccountFiltersSwitch'
import { TeamMembershipLevel } from 'lib/constants'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { groupsAccessLogic } from 'lib/introductions/groupsAccessLogic'
import { Field } from 'lib/elements/Field'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'
import { ActionFilter } from 'scenes/insights/filters/ActionFilter/ActionFilter'
import { MathAvailability } from 'scenes/insights/filters/ActionFilter/ActionFilterRow/ActionFilterRow'

import { AnyPropertyFilter, EntityTypes, FilterType } from '~/types'

import type { GroupUsageMetricApi } from 'products/customer_analytics/frontend/generated/api.schemas'

import {
    UsageMetricFiltersDataWarehouse,
    UsageMetricFormData,
    actionFilterValueToSavedFilters,
    getMetricSource,
    savedFiltersToActionFilterValue,
    usageMetricsConfigLogic,
} from './usageMetricsConfigLogic'

function UsageMetricsTable(): JSX.Element {
    const { usageMetrics, usageMetricsLoading } = useValues(usageMetricsConfigLogic)
    const { removeUsageMetric, openModal, setUsageMetricValues } = useActions(usageMetricsConfigLogic)
    const { reportUsageMetricsUpdateButtonClicked } = useActions(eventUsageLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    const columns: TableColumns<GroupUsageMetricApi> = [
        {
            title: 'Name',
            key: 'name',
            dataIndex: 'name',
        },
        {
            title: 'Format',
            key: 'format',
            dataIndex: 'format',
        },
        {
            title: 'Interval',
            key: 'interval',
            dataIndex: 'interval',
        },
        {
            title: 'Display',
            key: 'display',
            render: function Render(_, metric) {
                return metric.display === 'sparkline' ? 'Sparkline' : 'Number'
            },
        },
        {
            title: 'Source',
            key: 'source',
            render: function Render(_, metric) {
                const source = getMetricSource(metric.filters as UsageMetricFormData['filters'])
                if (source === 'data_warehouse') {
                    const dwFilters = metric.filters as UsageMetricFiltersDataWarehouse
                    return `Warehouse · ${dwFilters?.table_name ?? '(unknown table)'}`
                }
                return 'Events'
            },
        },
        {
            title: 'Calculation',
            key: 'math',
            render: function Render(_, metric) {
                if (metric.math === 'sum') {
                    return `Sum of ${metric.math_property ?? '(unknown)'}`
                }
                return 'Count'
            },
        },
        {
            title: '',
            key: 'actions',
            width: 24,
            render: function Render(_, metric) {
                return (
                    <Menu
                        items={[
                            {
                                label: 'Edit',
                                onClick: () => {
                                    openModal()
                                    setUsageMetricValues({ ...metric, filters: (metric.filters ?? {}) as FilterType })
                                    reportUsageMetricsUpdateButtonClicked()
                                },
                                disabledReason: restrictedReason,
                            },
                            {
                                label: 'Delete',
                                status: 'danger',
                                onClick: () => {
                                    Dialog.open({
                                        title: 'Delete usage metric',
                                        description: `Are you sure you want to delete "${metric.name}"? This action cannot be undone.`,
                                        primaryButton: {
                                            children: 'Delete',
                                            status: 'danger',
                                            onClick: () => {
                                                removeUsageMetric(metric.id)
                                            },
                                            disabledReason: restrictedReason,
                                        },
                                        secondaryButton: {
                                            children: 'Cancel',
                                        },
                                    })
                                },
                                disabledReason: restrictedReason,
                            },
                        ]}
                    >
                        <Button size="small" icon={<IconEllipsis />} />
                    </Menu>
                )
            },
        },
    ]

    return <Table columns={columns} dataSource={usageMetrics} loading={usageMetricsLoading} />
}

function UsageMetricsForm(): JSX.Element {
    const { usageMetric } = useValues(usageMetricsConfigLogic)
    const { setUsageMetricValue } = useActions(usageMetricsConfigLogic)
    const taxonomicGroupTypes = [
        TaxonomicFilterGroupType.EventProperties,
        TaxonomicFilterGroupType.EventMetadata,
        TaxonomicFilterGroupType.InsightsQLExpression,
    ]
    const source = getMetricSource(usageMetric.filters)

    return (
        <Form id="usageMetric" logic={usageMetricsConfigLogic} formKey="usageMetric" enableFormOnSubmit>
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <Field name="name" label="Name">
                        <Input placeholder="Events" />
                    </Field>

                    <Field name="interval" label="Interval">
                        <Select
                            options={[
                                { value: 7, label: '7d' },
                                { value: 30, label: '30d' },
                                { value: 90, label: '90d' },
                            ]}
                        />
                    </Field>

                    <Field name="format" label="Format">
                        <Select
                            options={[
                                { value: 'currency', label: 'Currency' },
                                { value: 'numeric', label: 'Numeric' },
                            ]}
                        />
                    </Field>

                    <Field name="display" label="Display">
                        <Select
                            options={[
                                { value: 'number', label: 'Number' },
                                { value: 'sparkline', label: 'Sparkline' },
                            ]}
                        />
                    </Field>

                    <Field name="math" label="Calculation">
                        {({ value, onChange }) => (
                            <Select
                                value={value}
                                options={[
                                    {
                                        value: 'count',
                                        label: source === 'data_warehouse' ? 'Count of rows' : 'Count of events',
                                    },
                                    {
                                        value: 'sum',
                                        label: source === 'data_warehouse' ? 'Sum of column' : 'Sum of property',
                                    },
                                ]}
                                onChange={(newValue) => {
                                    onChange(newValue)
                                    if (newValue === 'count') {
                                        setUsageMetricValue('math_property', null)
                                    }
                                }}
                            />
                        )}
                    </Field>

                    {usageMetric.math === 'sum' && (
                        <Field
                            name="math_property"
                            label={source === 'data_warehouse' ? 'Column to sum' : 'Property to sum'}
                        >
                            {({ value, onChange }) =>
                                source === 'data_warehouse' ? (
                                    <Input
                                        value={value ?? ''}
                                        onChange={(newValue) => onChange(newValue || null)}
                                        placeholder="amount"
                                        data-attr="usage-metric-math-property"
                                    />
                                ) : (
                                    <TaxonomicStringPopover
                                        groupType={TaxonomicFilterGroupType.NumericalEventProperties}
                                        value={value}
                                        onChange={onChange}
                                        placeholder="Select property"
                                        data-attr="usage-metric-math-property"
                                        selectingKeyOnly
                                    />
                                )
                            }
                        </Field>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <Field
                        name="filters"
                        label="Match events or data warehouse table"
                        help={
                            source === 'data_warehouse'
                                ? 'Data warehouse metrics are limited to a single table and currently only render on group profiles.'
                                : 'Pick events to match, or switch to a data warehouse table. Only one source can be active per metric.'
                        }
                    >
                        {({ value, onChange }) => {
                            const actionFilterValue = savedFiltersToActionFilterValue(value)
                            return (
                                <>
                                    <ActionFilter
                                        bordered
                                        filters={actionFilterValue}
                                        setFilters={(payload) => {
                                            onChange(actionFilterValueToSavedFilters(payload, source))
                                        }}
                                        typeKey="usage-metric-filters"
                                        mathAvailability={MathAvailability.None}
                                        hideRename
                                        hideDuplicate
                                        showNestedArrow={false}
                                        entitiesLimit={source === 'data_warehouse' ? 1 : undefined}
                                        actionsTaxonomicGroupTypes={[
                                            TaxonomicFilterGroupType.Events,
                                            TaxonomicFilterGroupType.DataWarehouse,
                                        ]}
                                        propertiesTaxonomicGroupTypes={taxonomicGroupTypes}
                                        propertyFiltersPopover
                                        dataWarehousePopoverFields={[
                                            { key: 'timestamp_field', label: 'Timestamp column', allowInsightsQL: true },
                                            { key: 'key_field', label: 'Group key column' },
                                        ]}
                                        addFilterDefaultOptions={{
                                            id: '$pageview',
                                            name: '$pageview',
                                            type: EntityTypes.EVENTS,
                                        }}
                                        buttonCopy={
                                            (actionFilterValue?.events ?? []).length > 0
                                                ? 'Add event'
                                                : 'Match event or data warehouse table'
                                        }
                                    />
                                    {source === 'events' && (
                                        <>
                                            <div className="flex gap-2 justify-between w-full">
                                                <Label>Filters</Label>
                                            </div>
                                            <PropertyFilters
                                                propertyFilters={
                                                    (actionFilterValue?.properties ?? []) as AnyPropertyFilter[]
                                                }
                                                taxonomicGroupTypes={taxonomicGroupTypes}
                                                onChange={(properties: AnyPropertyFilter[]) => {
                                                    onChange(
                                                        actionFilterValueToSavedFilters(
                                                            { ...actionFilterValue, properties },
                                                            source
                                                        )
                                                    )
                                                }}
                                                pageKey="UsageMetricsConfig"
                                            />
                                            <TestAccountFilterSwitch
                                                checked={actionFilterValue?.filter_test_accounts ?? false}
                                                onChange={(filter_test_accounts) => {
                                                    onChange(
                                                        actionFilterValueToSavedFilters(
                                                            { ...actionFilterValue, filter_test_accounts },
                                                            source
                                                        )
                                                    )
                                                }}
                                                fullWidth
                                            />
                                        </>
                                    )}
                                </>
                            )
                        }}
                    </Field>
                </div>
            </div>
        </Form>
    )
}

export function UsageMetricsConfig(): JSX.Element {
    const { openModal } = useActions(usageMetricsConfigLogic)
    const { groupsEnabled } = useValues(groupsAccessLogic)
    const { reportUsageMetricsSettingsViewed } = useActions(eventUsageLogic)
    const restrictedReason = useRestrictedArea({
        scope: RestrictionScope.Project,
        minimumAccessLevel: TeamMembershipLevel.Admin,
    })

    useOnMountEffect(() => {
        reportUsageMetricsSettingsViewed()
    })

    return (
        <>
            <p>
                Define what usage means for your product based on one or more events.
                <br />
                Usage metrics are displayed in the person {groupsEnabled ? 'and group profiles' : 'profile'}.
            </p>
            <div className="flex flex-col gap-2 items-start">
                <Button
                    type="primary"
                    size="small"
                    onClick={openModal}
                    icon={<IconPlusSmall />}
                    disabledReason={restrictedReason}
                >
                    Add metric
                </Button>
                <UsageMetricsTable />
                <UsageMetricsModal />
            </div>
        </>
    )
}

export function UsageMetricsModal(): JSX.Element {
    const { isModalOpen } = useValues(usageMetricsConfigLogic)
    const { closeModal } = useActions(usageMetricsConfigLogic)

    return (
        <Modal
            title="Add usage metric"
            isOpen={isModalOpen}
            onClose={closeModal}
            children={<UsageMetricsForm />}
            footer={
                <>
                    <Button
                        htmlType="submit"
                        form="usageMetric"
                        type="primary"
                        children="Save"
                        data-attr="create-usage-metric"
                    />
                    <Button children="Cancel" onClick={closeModal} data-attr="cancel-create-usage-metric" />
                </>
            }
        />
    )
}
