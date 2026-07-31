import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconSort } from '@hanzo/icons'
import { Button, Table, Tag } from '@hanzo/elements'

import { FlaggedFeature } from 'lib/components/FlaggedFeature'
import { TZLabel } from 'lib/components/TZLabel'
import { FEATURE_FLAGS } from 'lib/constants'
import { dayjs } from 'lib/dayjs'
import { CalendarSelectInput } from 'lib/elements/Calendar/CalendarSelect'
import { Checkbox } from 'lib/elements/Checkbox'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input'
import { Progress } from 'lib/elements/Progress'
import { Select } from 'lib/elements/Select'
import { ProfilePicture } from 'lib/elements/ProfilePicture'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'

import { type ManagedMigrationForm, managedMigrationLogic } from './managedMigrationLogic'
import { type ManagedMigration } from './types'

const STATUS_COLORS = {
    running: 'primary',
    completed: 'success',
    paused: 'danger',
    waiting_to_start: 'muted',
} as const

const STATUS_LABELS: Record<string, string> = {
    waiting_to_start: 'Waiting to start',
}

function StatusTag({ status }: { status: string }): JSX.Element {
    const label = STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1)
    return <Tag type={STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'default'}>{label}</Tag>
}

function AmplitudeImportOptions({
    managedMigration,
    setManagedMigrationValue,
}: {
    managedMigration: ManagedMigrationForm
    setManagedMigrationValue: (key: string, value: any) => void
}): JSX.Element {
    return (
        <FlaggedFeature flag={FEATURE_FLAGS.AMPLITUDE_BATCH_IMPORT_OPTIONS}>
            <Field name="import_events">
                <Checkbox
                    checked={managedMigration.import_events !== false}
                    onChange={(checked) => setManagedMigrationValue('import_events', checked)}
                    label="Import events from Amplitude"
                />
            </Field>

            <Field name="generate_identify_events">
                <Checkbox
                    checked={managedMigration.generate_identify_events !== false}
                    onChange={(checked) => setManagedMigrationValue('generate_identify_events', checked)}
                    label="Generate identify events to link user IDs with device IDs"
                />
            </Field>

            <Field name="generate_group_identify_events">
                <Checkbox
                    checked={managedMigration.generate_group_identify_events === true}
                    onChange={(checked) => setManagedMigrationValue('generate_group_identify_events', checked)}
                    label="Generate group identify events from group property changes"
                />
            </Field>
        </FlaggedFeature>
    )
}

export function ManagedMigration(): JSX.Element {
    const { managedMigration } = useValues(managedMigrationLogic)
    const { setManagedMigrationValue } = useActions(managedMigrationLogic)

    return (
        <Form logic={managedMigrationLogic} formKey="managedMigration" enableFormOnSubmit className="space-y-4">
            <SceneContent>
                <SceneTitleSection
                    name="New managed migration"
                    resourceType={{ type: 'managed_migration', forceIcon: <IconSort /> }}
                    actions={
                        <Button type="primary" htmlType="submit" size="small">
                            Import Data
                        </Button>
                    }
                    forceBackTo={{
                        path: urls.managedMigration(),
                        key: 'managed_migrations',
                        name: 'Managed migrations',
                    }}
                />
                <Field name="source_type" label="Source">
                    <Select
                        value={managedMigration.source_type}
                        onChange={(value) => {
                            setManagedMigrationValue('source_type', value)
                            if (value === 'mixpanel' || value === 'amplitude') {
                                setManagedMigrationValue('content_type', value)
                            }
                        }}
                        options={[
                            {
                                value: 's3',
                                label: 'S3',
                                icon: (
                                    <img
                                        src="https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico"
                                        className="w-4 h-4"
                                    />
                                ),
                            },
                            {
                                value: 's3_gzip',
                                label: 'S3 (gzipped JSONL)',
                                icon: (
                                    <img
                                        src="https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico"
                                        className="w-4 h-4"
                                    />
                                ),
                            },
                            {
                                value: 'mixpanel',
                                label: 'Mixpanel',
                                icon: <img src="https://mixpanel.com/favicon.ico" className="w-4 h-4" />,
                            },
                            {
                                value: 'amplitude',
                                label: 'Amplitude',
                                icon: <img src="https://amplitude.com/favicon.ico" className="w-4 h-4" />,
                            },
                        ]}
                    />
                </Field>

                {(managedMigration.source_type === 's3' || managedMigration.source_type === 's3_gzip') && (
                    <>
                        <Field name="content_type" label="Content Type">
                            <Select
                                value={managedMigration.content_type}
                                onChange={(value) => setManagedMigrationValue('content_type', value)}
                                options={[
                                    { value: 'captured', label: 'Insights Events' },
                                    { value: 'mixpanel', label: 'Mixpanel Events' },
                                    { value: 'amplitude', label: 'Amplitude Events' },
                                ]}
                            />
                        </Field>
                    </>
                )}

                {(managedMigration.source_type === 's3' || managedMigration.source_type === 's3_gzip') && (
                    <>
                        <div className="flex gap-4">
                            <Field name="s3_region" label="S3 Region" className="flex-1">
                                <Input placeholder="us-east-1" />
                            </Field>

                            <Field name="s3_bucket" label="S3 Bucket" className="flex-1">
                                <Input placeholder="my-bucket" />
                            </Field>
                        </div>

                        <Field name="s3_prefix" label="S3 Prefix (optional)">
                            <Input placeholder="path/to/files/" />
                        </Field>
                    </>
                )}
                {(managedMigration.source_type === 'mixpanel' || managedMigration.source_type === 'amplitude') && (
                    <>
                        <div className="flex gap-4">
                            <Field name="start_date" label="Start Date" className="flex-1">
                                <CalendarSelectInput
                                    granularity={managedMigration.source_type === 'mixpanel' ? 'day' : 'hour'}
                                    value={managedMigration.start_date ? dayjs(managedMigration.start_date) : null}
                                    onChange={(date) =>
                                        setManagedMigrationValue('start_date', date?.format('YYYY-MM-DD HH:mm:ss'))
                                    }
                                />
                            </Field>

                            <Field name="end_date" label="End Date" className="flex-1">
                                <CalendarSelectInput
                                    granularity={managedMigration.source_type === 'mixpanel' ? 'day' : 'hour'}
                                    value={managedMigration.end_date ? dayjs(managedMigration.end_date) : null}
                                    onChange={(date) =>
                                        setManagedMigrationValue('end_date', date?.format('YYYY-MM-DD HH:mm:ss'))
                                    }
                                />
                            </Field>
                        </div>

                        <Field name="is_eu_region">
                            <Checkbox
                                checked={managedMigration.is_eu_region || false}
                                onChange={(checked) => setManagedMigrationValue('is_eu_region', checked)}
                                label="Use EU region endpoint"
                            />
                        </Field>

                        {managedMigration.source_type === 'amplitude' && (
                            <AmplitudeImportOptions
                                managedMigration={managedMigration}
                                setManagedMigrationValue={setManagedMigrationValue}
                            />
                        )}
                    </>
                )}

                {(managedMigration.source_type === 's3' || managedMigration.source_type === 's3_gzip') &&
                    managedMigration.content_type === 'amplitude' && (
                        <AmplitudeImportOptions
                            managedMigration={managedMigration}
                            setManagedMigrationValue={setManagedMigrationValue}
                        />
                    )}

                <div className="flex gap-4">
                    <Field name="access_key" label="Access Key ID" className="flex-1">
                        <Input type="password" />
                    </Field>

                    <Field name="secret_key" label="Secret Access Key" className="flex-1">
                        <Input type="password" />
                    </Field>
                </div>

                <div className="flex justify-end">
                    <Button type="primary" htmlType="submit">
                        Import Data
                    </Button>
                </div>
            </SceneContent>
        </Form>
    )
}

export function ManagedMigrations(): JSX.Element {
    const { managedMigrationId, migrations, migrationsLoading } = useValues(managedMigrationLogic)
    const { pauseMigration, resumeMigration } = useActions(managedMigrationLogic)

    const calculateProgress = (migration: ManagedMigration): { progress: number; completed: number; total: number } => {
        if (migration.state?.parts && Array.isArray(migration.state.parts)) {
            const parts = migration.state.parts
            const totalParts = parts.length
            const completedParts = parts.filter(
                (part) => part.total_size !== null && part.total_size === part.current_offset
            ).length
            return {
                progress: totalParts > 0 ? (completedParts / totalParts) * 100 : 0,
                completed: completedParts,
                total: totalParts,
            }
        }
        return { progress: 0, completed: 0, total: 0 }
    }

    return (
        <SceneContent>
            {managedMigrationId ? (
                <ManagedMigration />
            ) : (
                <>
                    <SceneTitleSection
                        name="Managed migrations"
                        resourceType={{
                            type: 'managed_migration',
                            forceIcon: <IconSort />,
                        }}
                        actions={
                            <Button
                                data-attr="new-managed-migration"
                                to={urls.managedMigrationNew()}
                                type="primary"
                                size="small"
                            >
                                New migration
                            </Button>
                        }
                    />
                    <Table
                        dataSource={migrations}
                        loading={migrationsLoading}
                        defaultSorting={{
                            columnKey: 'created_at',
                            order: -1,
                        }}
                        columns={[
                            {
                                title: 'Source',
                                dataIndex: 'source_type',
                                render: (_: any, migration: ManagedMigration) => {
                                    let sourceType: string = migration.source_type
                                    if (migration.source_type === 'date_range_export') {
                                        sourceType = migration.content_type
                                    }
                                    const sourceTypeMap = {
                                        s3: {
                                            icon: 'https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico',
                                            label: 'AWS S3',
                                            alt: 'S3',
                                        },
                                        s3_gzip: {
                                            icon: 'https://a0.awsstatic.com/libra-css/images/site/fav/favicon.ico',
                                            label: 'S3 (gzipped JSONL)',
                                            alt: 'S3 Gzip',
                                        },
                                        mixpanel: {
                                            icon: 'https://mixpanel.com/favicon.ico',
                                            label: 'Mixpanel',
                                            alt: 'Mixpanel',
                                        },
                                        amplitude: {
                                            icon: 'https://amplitude.com/favicon.ico',
                                            label: 'Amplitude',
                                            alt: 'Amplitude',
                                        },
                                    }

                                    const config = sourceTypeMap[sourceType as keyof typeof sourceTypeMap]

                                    if (!config) {
                                        return sourceType
                                    }

                                    return (
                                        <div className="flex items-center gap-2">
                                            <img src={config.icon} alt={config.alt} className="w-4 h-4" />
                                            {config.label}
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Content Type',
                                dataIndex: 'content_type',
                                render: (_: any, migration: ManagedMigration) => {
                                    const contentTypeConfig = {
                                        captured: {
                                            icon: '/static/icons/favicon.ico?v=2023-07-07',
                                            alt: 'Insights',
                                        },
                                        mixpanel: {
                                            icon: 'https://mixpanel.com/favicon.ico',
                                            alt: 'Mixpanel',
                                        },
                                        amplitude: {
                                            icon: 'https://amplitude.com/favicon.ico',
                                            alt: 'Amplitude',
                                        },
                                    }

                                    const config =
                                        contentTypeConfig[migration.content_type as keyof typeof contentTypeConfig]

                                    if (!config) {
                                        return migration.content_type
                                    }

                                    return (
                                        <div className="flex items-center justify-center gap-2">
                                            <img src={config.icon} alt={config.alt} className="w-4 h-4" />
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Status',
                                dataIndex: 'display_status',
                                render: (_: any, migration: ManagedMigration) => (
                                    <StatusTag status={migration.display_status} />
                                ),
                            },
                            {
                                title: 'Progress',
                                key: 'progress',
                                render: (_: any, migration: ManagedMigration) => {
                                    const { progress, completed, total } = calculateProgress(migration)
                                    return (
                                        <div className="flex flex-col gap-1">
                                            <Progress
                                                percent={progress}
                                                strokeColor={
                                                    migration.display_status === 'paused' ? 'var(--danger)' : undefined
                                                }
                                            />
                                            <span className="text-xs text-muted">
                                                {migration.display_status === 'completed'
                                                    ? 'Complete'
                                                    : migration.display_status === 'paused'
                                                      ? 'Paused'
                                                      : migration.display_status === 'waiting_to_start'
                                                        ? 'Waiting to start'
                                                        : `${completed}/${total}`}
                                            </span>
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Created by',
                                dataIndex: 'created_by',
                                render: function Render(_: any, migration: ManagedMigration) {
                                    return (
                                        <div className="flex flex-row items-center flex-nowrap">
                                            {migration.created_by && (
                                                <ProfilePicture user={migration.created_by} size="md" showName />
                                            )}
                                        </div>
                                    )
                                },
                            },
                            {
                                title: 'Created',
                                dataIndex: 'created_at',
                                render: function Render(dataValue: any) {
                                    if (typeof dataValue === 'string') {
                                        return (
                                            <div className="whitespace-nowrap text-right">
                                                <TZLabel time={dayjs(dataValue)} />
                                            </div>
                                        )
                                    }
                                    return <span className="text-secondary">—</span>
                                },
                                align: 'right',
                            },
                            {
                                title: 'Status Message',
                                dataIndex: 'status_message',
                                render: (_: any, migration: ManagedMigration) => migration.status_message || '-',
                            },
                            {
                                title: 'Actions',
                                key: 'actions',
                                render: (_: any, migration: ManagedMigration) => {
                                    if (migration.display_status === 'running') {
                                        return (
                                            <Button
                                                type="secondary"
                                                size="small"
                                                onClick={() => pauseMigration(migration.id)}
                                                loading={migrationsLoading}
                                            >
                                                Pause
                                            </Button>
                                        )
                                    } else if (migration.display_status === 'paused') {
                                        return (
                                            <Button
                                                type="primary"
                                                size="small"
                                                onClick={() => resumeMigration(migration.id)}
                                                loading={migrationsLoading}
                                            >
                                                Resume
                                            </Button>
                                        )
                                    }
                                    return null
                                },
                            },
                        ]}
                        emptyState="No migrations found. Create a new migration to get started."
                    />
                </>
            )}
        </SceneContent>
    )
}

export const scene: SceneExport = {
    component: ManagedMigrations,
    logic: managedMigrationLogic,
}
