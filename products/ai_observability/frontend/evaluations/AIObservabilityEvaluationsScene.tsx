import { BindLogic, useActions, useMountedLogic, useValues } from 'kea'
import { combineUrl, router } from 'kea-router'
import { useEffect, useRef, useState } from 'react'

import {
    IconArrowLeft,
    IconEye,
    IconFolder,
    IconHide,
    IconPencil,
    IconPlus,
    IconSearch,
    IconTrash,
    IconWarning,
} from '@hanzo/icons'
import {
    Banner,
    Button,
    Dialog,
    Input,
    Menu,
    Modal,
    Switch,
    Tab,
    Table,
    Tabs,
    Tag,
    Link,
    Tooltip,
} from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { DateFilter } from 'lib/components/DateFilter/DateFilter'
import { FEATURE_FLAGS } from 'lib/constants'
import { TableColumns } from 'lib/elements/Table'
import { ProfilePicture } from 'lib/elements/ProfilePicture'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { useAttachedLogic } from 'lib/logic/scenes/useAttachedLogic'
import { getAccessControlDisabledReason } from 'lib/utils/accessControlUtils'
import { removeProjectIdIfPresent } from 'lib/utils/kea-router'
import { fullName } from 'lib/utils/strings'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'
import { ProductKey } from '~/queries/schema/schema-general'
import { AccessControlLevel, AccessControlResourceType } from '~/types'

import type { EvaluationDirectoryApi } from '../generated/api.schemas'
import { LLMProviderKey } from '../settings/llmProviderKeysLogic'
import {
    getUnhealthyProviderKey,
    providerKeyStateIssueDescription,
    providerKeyStateLabel,
    providerLabel,
} from '../settings/providerKeyStateUtils'
import {
    EvaluationMetrics,
    PASS_RATE_SUCCESS_THRESHOLD,
    PASS_RATE_WARNING_THRESHOLD,
} from './components/EvaluationMetrics'
import { OfflineEvaluationsTab } from './components/OfflineEvaluationsTab'
import { evaluationTypeUsesProviderKey } from './evaluationCapabilities'
import { EvaluationStats, evaluationMetricsLogic } from './evaluationMetricsLogic'
import { EvaluationTemplatesEmptyState } from './EvaluationTemplates'
import { llmEvaluationsLogic } from './llmEvaluationsLogic'
import { statusReasonLabel } from './statusDisplay'
import { EvaluationConfig } from './types'

export const scene: SceneExport = {
    component: AIObservabilityEvaluationsScene,
    logic: llmEvaluationsLogic,
    productKey: ProductKey.AI_OBSERVABILITY,
}

function getActiveTab(
    pathname: string,
    searchParams: Record<string, unknown>,
    showOfflineEvals: boolean
): 'online-evals' | 'offline-evals' {
    if (!showOfflineEvals) {
        return 'online-evals'
    }

    const normalizedPathname = removeProjectIdIfPresent(pathname)
    const offlineEvaluationsPath = urls.aiObservabilityOfflineEvaluations()
    if (normalizedPathname === offlineEvaluationsPath || normalizedPathname.startsWith(`${offlineEvaluationsPath}/`)) {
        return 'offline-evals'
    }

    const tab = searchParams.tab
    return tab === 'offline-evals' || tab === 'offline' ? 'offline-evals' : 'online-evals'
}

function getProviderKeyIssue(evaluation: EvaluationConfig, providerKeys: LLMProviderKey[]): LLMProviderKey | null {
    if (!evaluationTypeUsesProviderKey(evaluation.evaluation_type)) {
        return null
    }

    return getUnhealthyProviderKey(providerKeys, evaluation.model_configuration?.provider_key_id)
}

function getEvaluationMethodLabel(evaluation: EvaluationConfig): string {
    if (evaluation.evaluation_type === 'script') {
        return 'Script'
    }
    if (evaluation.evaluation_type === 'sentiment') {
        return 'Sentiment'
    }
    return 'LLM judge'
}

function getEvaluationMethodTagType(evaluation: EvaluationConfig): 'option' | 'highlight' | 'caution' {
    if (evaluation.evaluation_type === 'script') {
        return 'option'
    }
    if (evaluation.evaluation_type === 'sentiment') {
        return 'highlight'
    }
    return 'caution'
}

function getEvaluationConfigPreview(evaluation: EvaluationConfig): string {
    if (evaluation.evaluation_type === 'script') {
        return evaluation.evaluation_config.source
    }
    if (evaluation.evaluation_type === 'sentiment') {
        return 'User messages'
    }
    return evaluation.evaluation_config.prompt
}

function EvaluationDescription({ description }: { description: string }): JSX.Element {
    const [expanded, setExpanded] = useState(false)
    const [isClamped, setIsClamped] = useState(false)
    const textRef = useRef<HTMLDivElement | null>(null)

    // line-clamp-1 constrains clientHeight to a single line; if scrollHeight exceeds it the text is
    // truncated and worth a toggle. Only measure while collapsed — expanded, scrollHeight === clientHeight.
    useEffect(() => {
        if (textRef.current && !expanded) {
            setIsClamped(textRef.current.scrollHeight > textRef.current.clientHeight)
        }
    }, [description, expanded])

    return (
        <div className="flex items-start gap-1">
            <div ref={textRef} className={`text-muted text-sm ${expanded ? '' : 'line-clamp-1'}`}>
                {description}
            </div>
            {(isClamped || expanded) && (
                <Button
                    size="xsmall"
                    onClick={() => setExpanded(!expanded)}
                    data-attr="toggle-evaluation-description"
                >
                    {expanded ? 'Show less' : 'Show more'}
                </Button>
            )}
        </div>
    )
}

function AIObservabilityEvaluationsContent(): JSX.Element {
    const evaluationsLogic = llmEvaluationsLogic()
    const metricsLogic = evaluationMetricsLogic()
    const {
        evaluations,
        displayedEvaluations,
        evaluationsLoading,
        evaluationsFilter,
        showDisabledEvaluations,
        dateFilter,
        providerKeys,
        unhealthyProviderKeysUsedByEvaluations,
        canEnableEvaluation,
        evaluationDirectories,
        evaluationDirectoriesLoading,
        selectedDirectory,
        selectedDirectoryId,
        directoryEditor,
        submitDirectoryLoading,
        deletingDirectoryId,
        movingEvaluationId,
    } = useValues(evaluationsLogic)
    const {
        setEvaluationsFilter,
        setShowDisabledEvaluations,
        toggleEvaluationEnabled,
        setDates,
        openCreateDirectory,
        openRenameDirectory,
        closeDirectoryEditor,
        setDirectoryEditorName,
        submitDirectory,
        deleteDirectory,
        moveEvaluation,
        selectDirectory,
        deleteEvaluation,
    } = useActions(evaluationsLogic)
    const { evaluationsWithMetrics } = useValues(metricsLogic)
    const { push } = useActions(router)
    const { searchParams } = useValues(router)
    const evaluationUrl = (id: string): string => combineUrl(urls.aiObservabilityEvaluation(id), searchParams).url
    const settingsUrl = urls.settings('project-ai-observability', 'ai-observability-byok')
    const moveEvaluationDisabledReason = getAccessControlDisabledReason(
        AccessControlResourceType.LlmAnalytics,
        AccessControlLevel.Editor
    )

    const filteredEvaluationsWithMetrics = evaluationsWithMetrics.filter((evaluation: EvaluationConfig) =>
        displayedEvaluations.some((filtered) => filtered.id === evaluation.id)
    )
    const directoryById = new Map(evaluationDirectories.map((directory) => [directory.id, directory]))

    const columns: TableColumns<EvaluationConfig> = [
        {
            title: 'Name',
            key: 'name',
            render: (_, evaluation) => (
                <div className="flex flex-col">
                    <Link to={evaluationUrl(evaluation.id)} className="font-semibold text-primary">
                        {evaluation.name}
                    </Link>
                    {evaluation.description && <EvaluationDescription description={evaluation.description} />}
                </div>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Directory',
            key: 'directory',
            render: (_, evaluation) =>
                evaluation.directory_id ? directoryById.get(evaluation.directory_id)?.name : 'Top level',
            sorter: (a, b) => {
                const directoryName = (evaluation: EvaluationConfig): string =>
                    evaluation.directory_id ? directoryById.get(evaluation.directory_id)?.name || '' : ''
                return directoryName(a).localeCompare(directoryName(b))
            },
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, evaluation) => {
                // When the system has marked an eval as errored, the toggle is misleading — flipping it
                // would just fail. Show an error pill instead so the row is visibly different and users
                // click through to the detail page to see what's wrong and how to fix it.
                if (evaluation.status === 'error') {
                    return (
                        <Tooltip title={`${statusReasonLabel(evaluation.status_reason)}. Open to fix.`}>
                            <Tag
                                type="danger"
                                icon={<IconWarning />}
                                forceClickable
                                onClick={() => push(evaluationUrl(evaluation.id))}
                                data-attr="evaluation-status-error"
                            >
                                Error
                            </Tag>
                        </Tooltip>
                    )
                }
                const providerKeyIssue = evaluation.enabled ? getProviderKeyIssue(evaluation, providerKeys) : null
                if (providerKeyIssue) {
                    return (
                        <Tooltip
                            title={`Paused because API key ${providerKeyIssue.name} ${providerKeyStateIssueDescription(
                                providerKeyIssue.state
                            )}. Open settings to fix.`}
                        >
                            <Tag
                                type="warning"
                                icon={<IconWarning />}
                                forceClickable
                                onClick={() => push(settingsUrl)}
                                data-attr="evaluation-status-key-issue"
                            >
                                Key issue
                            </Tag>
                        </Tooltip>
                    )
                }
                const canEnable = canEnableEvaluation(evaluation)
                const isBlocked = !canEnable && !evaluation.enabled
                const blockedReason = 'Add a provider API key to enable this evaluation.'
                return (
                    <div className="flex items-center gap-2">
                        <AccessControlAction
                            resourceType={AccessControlResourceType.LlmAnalytics}
                            minAccessLevel={AccessControlLevel.Editor}
                        >
                            <Tooltip title={isBlocked ? blockedReason : undefined}>
                                <span>
                                    <Switch
                                        checked={evaluation.enabled}
                                        onChange={() => toggleEvaluationEnabled(evaluation.id)}
                                        size="small"
                                        disabled={isBlocked}
                                        data-attr="toggle-evaluation-enabled"
                                    />
                                </span>
                            </Tooltip>
                        </AccessControlAction>
                        <span className={evaluation.enabled ? 'text-success' : 'text-muted'}>
                            {evaluation.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                )
            },
            // Sort: errors first (most attention-demanding), then enabled, then paused.
            sorter: (a, b) => {
                const rank = (e: EvaluationConfig): number => (e.status === 'error' ? 0 : e.enabled ? 1 : 2)
                return rank(a) - rank(b)
            },
        },
        {
            title: 'Method',
            key: 'method',
            render: (_, evaluation) => (
                <Tag type={getEvaluationMethodTagType(evaluation)}>
                    {getEvaluationMethodLabel(evaluation)}
                </Tag>
            ),
        },
        {
            title: 'Config',
            key: 'config',
            render: (_, evaluation) => {
                const preview = getEvaluationConfigPreview(evaluation)
                return (
                    <div className="max-w-md">
                        <div className="text-sm font-mono bg-bg-light border rounded px-2 py-1 truncate">
                            {preview || '(empty)'}
                        </div>
                    </div>
                )
            },
        },
        {
            title: 'Triggers',
            key: 'conditions',
            render: (_, evaluation) => (
                <div className="flex flex-wrap gap-1">
                    {evaluation.conditions.map((condition) => {
                        const propertyCount = condition.properties?.length ?? 0
                        return (
                            <Tag key={condition.id} type="option">
                                {parseFloat((condition.rollout_percentage ?? 0).toFixed(2))}%
                                {propertyCount > 0 &&
                                    ` when ${propertyCount} condition${propertyCount !== 1 ? 's' : ''}`}
                            </Tag>
                        )
                    })}
                    {evaluation.conditions.length === 0 && <span className="text-muted text-sm">No triggers</span>}
                </div>
            ),
        },
        {
            title: 'Runs',
            key: 'recent_stats',
            render: (_, evaluation: EvaluationConfig & { stats?: EvaluationStats }) => {
                const stats = evaluation.stats
                if (!stats || stats.runs_count === 0) {
                    return <span className="text-muted text-sm">No runs</span>
                }

                // Sentiment evals classify rather than pass/fail, so a pass rate is meaningless
                if (evaluation.evaluation_type === 'sentiment') {
                    return (
                        <div className="text-sm">
                            {stats.runs_count} run{stats.runs_count !== 1 ? 's' : ''}
                        </div>
                    )
                }

                const passRateColor =
                    stats.pass_rate >= PASS_RATE_SUCCESS_THRESHOLD
                        ? 'text-success'
                        : stats.pass_rate >= PASS_RATE_WARNING_THRESHOLD
                          ? 'text-warning'
                          : 'text-danger'

                return (
                    <div className="flex flex-col items-center">
                        <div className="text-sm">
                            {stats.runs_count} run{stats.runs_count !== 1 ? 's' : ''}
                        </div>
                        <div className={`font-semibold ${passRateColor}`}>
                            {parseFloat(stats.pass_rate.toFixed(2))}%
                        </div>
                    </div>
                )
            },
        },
        {
            title: 'Created by',
            key: 'created_by',
            render: (_, evaluation) =>
                evaluation.created_by ? (
                    <ProfilePicture user={evaluation.created_by} size="md" showName />
                ) : (
                    <span className="text-muted text-sm">–</span>
                ),
            sorter: (a, b) => {
                // Match the displayed identity: full name, falling back to email when no name is set.
                const sortKey = (e: EvaluationConfig): string =>
                    e.created_by ? fullName(e.created_by) || e.created_by.email : ''
                return sortKey(a).localeCompare(sortKey(b))
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, evaluation) => (
                <div className="flex gap-1">
                    <Menu
                        items={[
                            {
                                icon: <IconFolder />,
                                label: 'Top level',
                                onClick: () => moveEvaluation(evaluation.id, null),
                                disabledReason:
                                    !evaluation.directory_id || movingEvaluationId === evaluation.id
                                        ? 'Evaluation is already here'
                                        : undefined,
                            },
                            ...evaluationDirectories.map((directory) => ({
                                icon: <IconFolder />,
                                label: directory.name,
                                onClick: () => moveEvaluation(evaluation.id, directory.id),
                                disabledReason:
                                    evaluation.directory_id === directory.id || movingEvaluationId === evaluation.id
                                        ? 'Evaluation is already here'
                                        : undefined,
                            })),
                        ]}
                    >
                        <Button
                            size="small"
                            type="secondary"
                            icon={<IconFolder />}
                            tooltip="Move evaluation"
                            loading={movingEvaluationId === evaluation.id}
                            disabledReason={moveEvaluationDisabledReason}
                        />
                    </Menu>
                    <AccessControlAction
                        resourceType={AccessControlResourceType.LlmAnalytics}
                        minAccessLevel={AccessControlLevel.Editor}
                    >
                        <Button
                            size="small"
                            type="secondary"
                            icon={<IconPencil />}
                            onClick={() => push(evaluationUrl(evaluation.id))}
                        />
                    </AccessControlAction>
                    <AccessControlAction
                        resourceType={AccessControlResourceType.LlmAnalytics}
                        minAccessLevel={AccessControlLevel.Editor}
                    >
                        <Button
                            size="small"
                            type="secondary"
                            status="danger"
                            icon={<IconTrash />}
                            onClick={() => {
                                Dialog.open({
                                    title: `Delete ${evaluation.name}?`,
                                    description: 'Are you sure you want to delete this evaluation?',
                                    primaryButton: {
                                        children: 'Delete',
                                        type: 'primary',
                                        status: 'danger',
                                        'data-attr': 'confirm-delete-evaluation',
                                        onClick: () => deleteEvaluation(evaluation.id),
                                    },
                                    secondaryButton: {
                                        children: 'Cancel',
                                        type: 'secondary',
                                    },
                                })
                            }}
                        />
                    </AccessControlAction>
                </div>
            ),
        },
    ]

    const directoryColumns: TableColumns<EvaluationDirectoryApi> = [
        {
            title: 'Name',
            key: 'name',
            render: (_, directory) => (
                <Button
                    type="tertiary"
                    icon={<IconFolder />}
                    onClick={() => selectDirectory(directory.id)}
                    data-attr="evaluation-directory-link"
                >
                    {directory.name}
                </Button>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: 'Evaluations',
            key: 'evaluation_count',
            render: (_, directory) => directory.evaluation_count,
            sorter: (a, b) => a.evaluation_count - b.evaluation_count,
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'right',
            width: 0,
            render: (_, directory) => (
                <div className="flex justify-end gap-1">
                    <AccessControlAction
                        resourceType={AccessControlResourceType.LlmAnalytics}
                        minAccessLevel={AccessControlLevel.Editor}
                    >
                        <Button
                            size="small"
                            type="secondary"
                            icon={<IconPencil />}
                            tooltip="Rename directory"
                            onClick={() => openRenameDirectory(directory)}
                        />
                    </AccessControlAction>
                    <AccessControlAction
                        resourceType={AccessControlResourceType.LlmAnalytics}
                        minAccessLevel={AccessControlLevel.Editor}
                    >
                        <Button
                            size="small"
                            type="secondary"
                            status="danger"
                            icon={<IconTrash />}
                            tooltip="Delete directory"
                            loading={deletingDirectoryId === directory.id}
                            onClick={() => {
                                Dialog.open({
                                    title: `Delete ${directory.name}?`,
                                    description: `${directory.evaluation_count} evaluation${
                                        directory.evaluation_count === 1 ? '' : 's'
                                    } will move to the top level.`,
                                    primaryButton: {
                                        children: 'Delete directory',
                                        status: 'danger',
                                        onClick: () => deleteDirectory(directory.id),
                                    },
                                    secondaryButton: {
                                        children: 'Cancel',
                                    },
                                })
                            }}
                        />
                    </AccessControlAction>
                </div>
            ),
        },
    ]

    const showEmptyState =
        !evaluationsLoading &&
        !evaluationDirectoriesLoading &&
        evaluations.length === 0 &&
        evaluationDirectories.length === 0

    return (
        <div className="space-y-4">
            {!showEmptyState && unhealthyProviderKeysUsedByEvaluations.length > 0 && (
                <Banner type="warning">
                    <div className="space-y-2">
                        <p>Some evaluations are using API keys that need attention.</p>
                        <ul className="list-disc pl-5 space-y-1">
                            {unhealthyProviderKeysUsedByEvaluations.map((providerKey) => (
                                <li key={providerKey.id}>
                                    <span className="font-semibold">{providerKey.name}</span> (
                                    {providerLabel(providerKey.provider)}) - {providerKeyStateLabel(providerKey.state)}:{' '}
                                    {providerKey.error_message || 'Unknown error'}
                                </li>
                            ))}
                        </ul>
                        <Link to={settingsUrl}>Go to settings to fix API keys.</Link>
                    </div>
                </Banner>
            )}

            <div className={showEmptyState ? 'hidden' : 'flex justify-between items-start gap-3'}>
                <div className="min-w-0 flex-1">
                    {selectedDirectory ? (
                        <div className="flex items-center gap-2">
                            <Button
                                type="tertiary"
                                size="small"
                                icon={<IconArrowLeft />}
                                onClick={() => selectDirectory(null)}
                            >
                                Online evals
                            </Button>
                            <span className="text-muted">/</span>
                            <h2 className="text-xl font-semibold m-0">{selectedDirectory.name}</h2>
                        </div>
                    ) : (
                        <h2 className="text-xl font-semibold">Online evals</h2>
                    )}
                    <p className="text-muted">
                        Configure evaluation prompts and triggers to automatically assess your AI generations. Each
                        evaluation run is billed as an AI observability event.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {!selectedDirectoryId && (
                        <AccessControlAction
                            resourceType={AccessControlResourceType.LlmAnalytics}
                            minAccessLevel={AccessControlLevel.Editor}
                        >
                            <Button
                                type="secondary"
                                icon={<IconFolder />}
                                onClick={() => openCreateDirectory()}
                                data-attr="create-evaluation-directory-button"
                            >
                                New directory
                            </Button>
                        </AccessControlAction>
                    )}
                    <AccessControlAction
                        resourceType={AccessControlResourceType.LlmAnalytics}
                        minAccessLevel={AccessControlLevel.Editor}
                    >
                        <Button
                            type="primary"
                            icon={<IconPlus />}
                            to={combineUrl(urls.aiObservabilityEvaluationTemplates(), searchParams).url}
                            data-attr="create-evaluation-button"
                            tooltip="Create evaluation"
                        >
                            Create evaluation
                        </Button>
                    </AccessControlAction>
                </div>
            </div>

            {showEmptyState ? (
                <EvaluationTemplatesEmptyState />
            ) : (
                <>
                    <DateFilter dateFrom={dateFilter.dateFrom} dateTo={dateFilter.dateTo} onChange={setDates} />

                    <EvaluationMetrics />

                    <div className="flex items-center gap-2">
                        <Input
                            type="search"
                            placeholder="Search online evals..."
                            value={evaluationsFilter}
                            data-attr="evaluations-search-input"
                            onChange={setEvaluationsFilter}
                            prefix={<IconSearch />}
                            className="max-w-sm"
                        />
                        <Button
                            type="secondary"
                            active={!showDisabledEvaluations}
                            icon={showDisabledEvaluations ? <IconEye /> : <IconHide />}
                            onClick={() => setShowDisabledEvaluations(!showDisabledEvaluations)}
                            data-attr="toggle-show-disabled-evaluations"
                            tooltip={showDisabledEvaluations ? 'Hide disabled evals' : 'Show disabled evals'}
                        >
                            {showDisabledEvaluations ? 'Hide disabled' : 'Show disabled'}
                        </Button>
                    </div>

                    {!evaluationsFilter && !selectedDirectoryId && (
                        <Table
                            columns={directoryColumns}
                            dataSource={evaluationDirectories}
                            loading={evaluationDirectoriesLoading}
                            rowKey="id"
                            nouns={['directory', 'directories']}
                        />
                    )}

                    <Table
                        columns={columns}
                        dataSource={filteredEvaluationsWithMetrics}
                        loading={evaluationsLoading || evaluationDirectoriesLoading}
                        rowKey="id"
                        pagination={{
                            pageSize: 50,
                        }}
                        nouns={['evaluation', 'evaluations']}
                    />
                </>
            )}

            <Modal
                isOpen={!!directoryEditor}
                onClose={closeDirectoryEditor}
                title={directoryEditor?.mode === 'rename' ? 'Rename directory' : 'New directory'}
                width={480}
                footer={
                    <>
                        <Button type="secondary" onClick={closeDirectoryEditor} disabled={submitDirectoryLoading}>
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => submitDirectory()}
                            loading={submitDirectoryLoading}
                            disabledReason={!directoryEditor?.name.trim() ? 'Directory name is required' : undefined}
                            data-attr="save-evaluation-directory"
                        >
                            {directoryEditor?.mode === 'rename' ? 'Save directory' : 'Create directory'}
                        </Button>
                    </>
                }
            >
                <Input
                    value={directoryEditor?.name || ''}
                    onChange={(value) => setDirectoryEditorName(String(value || ''))}
                    placeholder="Directory name"
                    autoFocus
                    fullWidth
                    data-attr="evaluation-directory-name-input"
                />
            </Modal>
        </div>
    )
}

export function AIObservabilityEvaluationsScene(): JSX.Element {
    const { searchParams, location } = useValues(router)
    const { featureFlags } = useValues(featureFlagLogic)
    const evaluationsLogic = useMountedLogic(llmEvaluationsLogic())
    const metricsLogic = evaluationMetricsLogic()
    const showOfflineEvals = !!featureFlags[FEATURE_FLAGS.LLM_ANALYTICS_OFFLINE_EVALS]
    const activeTab = getActiveTab(location.pathname, searchParams, showOfflineEvals)

    useAttachedLogic(metricsLogic, evaluationsLogic)

    const tabs: Tab<string>[] = [
        {
            key: 'online-evals',
            label: 'Online evals',
            content: <AIObservabilityEvaluationsContent />,
            link: combineUrl(urls.aiObservabilityEvaluations(), {
                ...searchParams,
                tab: undefined,
                experiment: undefined,
            }).url,
            'data-attr': 'evaluations-tab',
        },
        ...(showOfflineEvals
            ? [
                  {
                      key: 'offline-evals',
                      label: (
                          <span className="inline-flex items-center gap-1">
                              <span>Offline evals</span>
                              <Tag type="completion" size="small">
                                  Alpha
                              </Tag>
                          </span>
                      ),
                      content: <OfflineEvaluationsTab />,
                      link: combineUrl(urls.aiObservabilityOfflineEvaluations(), {
                          ...searchParams,
                          tab: undefined,
                          experiment: undefined,
                      }).url,
                      'data-attr': 'offline-evals-tab',
                  } as Tab<string>,
              ]
            : []),
        {
            key: 'settings',
            label: 'Settings',
            link: urls.settings('project-ai-observability', 'ai-observability-byok'),
            content: <></>,
            'data-attr': 'settings-tab',
        },
    ]

    return (
        <BindLogic logic={llmEvaluationsLogic} props={{}}>
            <BindLogic logic={evaluationMetricsLogic} props={{}}>
                <SceneContent>
                    <SceneTitleSection
                        name="Evaluations"
                        description="Configure and monitor automated LLM output evaluations."
                        resourceType={{
                            type: 'llm_evaluations',
                        }}
                        actions={
                            <Button
                                to="https://hanzo.ai/docs/ai-evals/evaluations"
                                type="secondary"
                                targetBlank
                                size="small"
                            >
                                Documentation
                            </Button>
                        }
                    />
                    <Tabs activeKey={activeTab} data-attr="evaluations-tabs" tabs={tabs} sceneInset />
                </SceneContent>
            </BindLogic>
        </BindLogic>
    )
}
