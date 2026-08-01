import { useActions, useValues } from 'kea'
import { useState } from 'react'

import { IconPlus, IconTrash } from '@hanzo/icons'
import {
    Badge,
    Banner,
    Button,
    Dialog,
    Input,
    Modal,
    SegmentedButton,
    Switch,
} from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { PropertyFilters } from 'lib/components/PropertyFilters/PropertyFilters'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'

import { AccessControlLevel, AccessControlResourceType, type AnyPropertyFilter } from '~/types'

import { clusteringJobsLogic } from './clusteringJobsLogic'
import type { ClusteringJob, ClusteringLevel } from './types'

// Per-team cap. Must stay in sync with MAX_JOBS_PER_TEAM in
// products/ai_observability/backend/api/clustering_job.py — the backend enforces
// the real limit and returns 400 past it; this only drives the "Add job" disable
// state. Raised to 10 when evaluation was added as a third level so users can
// comfortably run per-evaluator clustering alongside trace + generation jobs.
const MAX_JOBS = 10

/** Short level tag shown in the jobs list — 'Trace', 'Gen', or 'Eval'. */
function levelBadge(level: ClusteringLevel): string {
    if (level === 'generation') {
        return 'Gen'
    }
    if (level === 'evaluation') {
        return 'Eval'
    }
    return 'Trace'
}

function JobEditor({
    job,
    onSave,
    onCancel,
    saving,
}: {
    job: Partial<ClusteringJob>
    onSave: (data: Partial<ClusteringJob>) => void
    onCancel: () => void
    saving: boolean
}): JSX.Element {
    const [name, setName] = useState(job.name ?? '')
    const [analysisLevel, setAnalysisLevel] = useState<ClusteringLevel>(job.analysis_level ?? 'trace')
    const [eventFilters, setEventFilters] = useState<AnyPropertyFilter[]>(
        (job.event_filters as AnyPropertyFilter[] | undefined) ?? []
    )
    const [enabled, setEnabled] = useState(job.enabled ?? true)

    return (
        <div className="space-y-4">
            <div>
                <label className="font-semibold text-sm mb-1 block">Name</label>
                <Input value={name} onChange={setName} placeholder="e.g. Production GPT-4o" fullWidth />
            </div>
            <div>
                <label className="font-semibold text-sm mb-1 block">Analysis level</label>
                <SegmentedButton
                    value={analysisLevel}
                    onChange={(value) => setAnalysisLevel(value as ClusteringLevel)}
                    options={[
                        { value: 'trace', label: 'Traces' },
                        { value: 'generation', label: 'Generations' },
                        { value: 'evaluation' as const, label: 'Evaluations' },
                    ]}
                    size="small"
                />
            </div>
            <div>
                <label className="font-semibold text-sm mb-1 block">Event filters</label>
                <div className="text-xs text-muted mb-2">
                    Only include items matching these criteria. Leave empty to include all.
                </div>
                <PropertyFilters
                    propertyFilters={eventFilters}
                    onChange={(properties) => setEventFilters(properties)}
                    pageKey={`llma-clustering-job-editor-${job.id ?? 'new'}`}
                    taxonomicGroupTypes={[
                        TaxonomicFilterGroupType.EventProperties,
                        TaxonomicFilterGroupType.EventMetadata,
                        TaxonomicFilterGroupType.PersonProperties,
                        TaxonomicFilterGroupType.Cohorts,
                    ]}
                    addText="Add filter"
                    hasRowOperator={false}
                    sendAllKeyUpdates
                    allowRelativeDateOptions={false}
                />
            </div>
            <div className="flex items-center gap-2">
                <Switch checked={enabled} onChange={setEnabled} />
                <span className="text-sm">Enabled</span>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="secondary" data-attr="llma-clustering-job-cancel" onClick={onCancel}>
                    Cancel
                </Button>
                <AccessControlAction
                    resourceType={AccessControlResourceType.AiObservabilityClusters}
                    minAccessLevel={AccessControlLevel.Editor}
                >
                    {({ disabledReason: accessDisabledReason }) => (
                        <Button
                            type="primary"
                            data-attr="llma-clustering-job-save"
                            disabledReason={!name.trim() ? 'Name is required' : accessDisabledReason}
                            loading={saving}
                            onClick={() =>
                                onSave({
                                    ...(job.id ? { id: job.id } : {}),
                                    name: name.trim(),
                                    analysis_level: analysisLevel,
                                    event_filters: eventFilters as Record<string, unknown>[],
                                    enabled,
                                })
                            }
                        >
                            {job.id ? 'Save' : 'Create'}
                        </Button>
                    )}
                </AccessControlAction>
            </div>
        </div>
    )
}

export function ClusteringJobsPanel(): JSX.Element {
    const { isJobsPanelOpen, jobs, jobsLoading, editingJob } = useValues(clusteringJobsLogic)
    const { closeJobsPanel, setEditingJob, createJob, updateJob, deleteJob } = useActions(clusteringJobsLogic)

    const visibleJobs = jobs

    return (
        <Modal
            isOpen={isJobsPanelOpen}
            onClose={closeJobsPanel}
            title="Clustering jobs"
            description="Define independent clustering configurations for different subpopulations."
            width={600}
        >
            {editingJob ? (
                <JobEditor
                    job={editingJob}
                    saving={jobsLoading}
                    onCancel={() => setEditingJob(null)}
                    onSave={(data) => {
                        if (data.id) {
                            updateJob(data as Partial<ClusteringJob> & { id: number })
                        } else {
                            createJob(data)
                        }
                    }}
                />
            ) : (
                <div className="space-y-3">
                    {visibleJobs.map((job: ClusteringJob) => (
                        <div
                            key={job.id}
                            className="flex items-center justify-between border rounded p-3 hover:bg-surface-secondary transition-colors"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium truncate">{job.name}</span>
                                <Badge.Number count={job.event_filters.length} />
                                <Badge content={levelBadge(job.analysis_level)} size="small" />
                                {!job.enabled && <span className="text-xs text-muted">Disabled</span>}
                            </div>
                            <div className="flex items-center gap-1">
                                <AccessControlAction
                                    resourceType={AccessControlResourceType.AiObservabilityClusters}
                                    minAccessLevel={AccessControlLevel.Editor}
                                >
                                    <Button
                                        size="small"
                                        type="secondary"
                                        data-attr="llma-clustering-job-edit"
                                        onClick={() => setEditingJob(job)}
                                    >
                                        Edit
                                    </Button>
                                </AccessControlAction>
                                <AccessControlAction
                                    resourceType={AccessControlResourceType.AiObservabilityClusters}
                                    minAccessLevel={AccessControlLevel.Editor}
                                >
                                    <Button
                                        size="small"
                                        type="secondary"
                                        status="danger"
                                        icon={<IconTrash />}
                                        data-attr="llma-clustering-job-delete"
                                        onClick={() => {
                                            Dialog.open({
                                                title: 'Delete clustering job?',
                                                description: `Are you sure you want to delete "${job.name}"? This cannot be undone.`,
                                                primaryButton: {
                                                    children: 'Delete',
                                                    type: 'primary',
                                                    status: 'danger',
                                                    onClick: () => deleteJob(job.id),
                                                },
                                                secondaryButton: {
                                                    children: 'Cancel',
                                                    type: 'secondary',
                                                },
                                            })
                                        }}
                                        tooltip="Delete job"
                                    />
                                </AccessControlAction>
                            </div>
                        </div>
                    ))}

                    {visibleJobs.length === 0 && !jobsLoading && (
                        <div className="text-center text-muted p-4">No clustering jobs configured yet.</div>
                    )}

                    <Banner type="info">
                        Jobs run automatically during the next scheduled clustering and summarization cycle.
                    </Banner>

                    <AccessControlAction
                        resourceType={AccessControlResourceType.AiObservabilityClusters}
                        minAccessLevel={AccessControlLevel.Editor}
                    >
                        {({ disabledReason: accessDisabledReason }) => (
                            <Button
                                type="secondary"
                                icon={<IconPlus />}
                                data-attr="llma-clustering-job-add"
                                onClick={() => setEditingJob({})}
                                disabledReason={
                                    jobs.length >= MAX_JOBS ? `Maximum of ${MAX_JOBS} jobs` : accessDisabledReason
                                }
                                fullWidth
                                center
                            >
                                Add job
                            </Button>
                        )}
                    </AccessControlAction>
                </div>
            )}
        </Modal>
    )
}
