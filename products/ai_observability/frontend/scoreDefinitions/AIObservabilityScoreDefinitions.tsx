import { useActions, useMountedLogic, useValues } from 'kea'

import {
    Banner,
    Button,
    Input,
    Modal,
    Select,
    Table,
    TableColumn,
    TableColumns,
    Tag,
    TextArea,
} from '@hanzo/elements'

import { AccessControlAction } from 'lib/components/AccessControlAction'
import { More } from 'lib/elements/Button/More'
import { ModalContent, ModalFooter, ModalHeader } from 'lib/elements/Modal/Modal'

import { updatedAtColumn } from '~/lib/elements/Table/columnUtils'
import { AccessControlLevel, AccessControlResourceType } from '~/types'

import type {
    ExperimentMetricKindEnumApi as ScoreDefinitionKind,
    ScoreDefinitionApi as ScoreDefinition,
} from '../generated/api.schemas'
import {
    aiObservabilityScoreDefinitionsLogic,
    SCORE_DEFINITIONS_PER_PAGE,
} from './aiObservabilityScoreDefinitionsLogic'
import { scoreDefinitionModalLogic } from './scoreDefinitionModalLogic'
import {
    CATEGORICAL_SELECTION_MODE_OPTIONS,
    formatKindLabel,
    formatNumericInputValue,
    getIntegerInputValue,
    getNumericInputValue,
    type CategoricalSelectionMode,
    type ScoreDefinitionModalMode,
} from './scoreDefinitionModalUtils'

const KIND_OPTIONS: { label: string; value: ScoreDefinitionKind | '' }[] = [
    { label: 'All kinds', value: '' },
    { label: 'Categorical', value: 'categorical' },
    { label: 'Numeric', value: 'numeric' },
    { label: 'Boolean', value: 'boolean' },
]

const ARCHIVED_OPTIONS: { label: string; value: '' | 'false' | 'true' }[] = [
    { label: 'Active only', value: 'false' },
    { label: 'All scorers', value: '' },
    { label: 'Archived only', value: 'true' },
]

export function AIObservabilityScoreDefinitions(): JSX.Element {
    const logic = useMountedLogic(aiObservabilityScoreDefinitionsLogic())
    const { setFilters, openModal, closeModal, toggleArchive } = useActions(logic)
    const {
        scoreDefinitions,
        scoreDefinitionsLoading,
        sorting,
        pagination,
        filters,
        scoreDefinitionCountLabel,
        modalMode,
        selectedDefinition,
        isArchivingDefinition,
    } = useValues(logic)
    const modalProps =
        modalMode === null || (modalMode !== 'create' && selectedDefinition === null)
            ? null
            : {
                  mode: modalMode,
                  scoreDefinition: selectedDefinition,
              }

    const columns: TableColumns<ScoreDefinition> = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: '25%',
            render: function renderName(_, scoreDefinition) {
                return (
                    <div className="space-y-1">
                        <div className="font-semibold">{scoreDefinition.name}</div>
                        {scoreDefinition.description ? (
                            <div className="max-w-xl truncate text-muted-alt">{scoreDefinition.description}</div>
                        ) : (
                            <div className="text-muted">No description</div>
                        )}
                    </div>
                )
            },
        },
        {
            title: 'Kind',
            dataIndex: 'kind',
            key: 'kind',
            render: function renderKind(kind) {
                return <Tag type="muted">{formatKindLabel(kind as ScoreDefinitionKind)}</Tag>
            },
        },
        {
            title: 'Version',
            dataIndex: 'current_version',
            key: 'current_version',
            render: function renderVersion(version) {
                return <span className="font-mono text-xs">v{String(version)}</span>
            },
        },
        {
            title: 'Status',
            dataIndex: 'archived',
            key: 'archived',
            render: function renderArchived(archived) {
                return archived ? (
                    <Tag type="muted">Archived</Tag>
                ) : (
                    <Tag type="success">Active</Tag>
                )
            },
        },
        updatedAtColumn<ScoreDefinition>() as TableColumn<ScoreDefinition, keyof ScoreDefinition | undefined>,
        {
            width: 0,
            render: function renderActions(_, scoreDefinition) {
                return (
                    <AccessControlAction
                        resourceType={AccessControlResourceType.LlmAnalytics}
                        minAccessLevel={AccessControlLevel.Editor}
                    >
                        <More
                            overlay={
                                <>
                                    <Button
                                        fullWidth
                                        onClick={() => openModal('metadata', scoreDefinition)}
                                        data-attr="llma-scorer-edit-metadata"
                                    >
                                        Edit metadata
                                    </Button>
                                    <Button
                                        fullWidth
                                        onClick={() => openModal('config', scoreDefinition)}
                                        data-attr="llma-scorer-edit-config"
                                    >
                                        Edit config
                                    </Button>
                                    <Button
                                        fullWidth
                                        onClick={() => openModal('duplicate', scoreDefinition)}
                                        data-attr="llma-scorer-duplicate"
                                    >
                                        Duplicate
                                    </Button>
                                    <Button
                                        status={scoreDefinition.archived ? 'default' : 'danger'}
                                        fullWidth
                                        onClick={() => toggleArchive(scoreDefinition)}
                                        disabled={isArchivingDefinition(scoreDefinition.id)}
                                        data-attr="llma-scorer-archive-toggle"
                                    >
                                        {scoreDefinition.archived ? 'Unarchive' : 'Archive'}
                                    </Button>
                                </>
                            }
                        />
                    </AccessControlAction>
                )
            },
        },
    ]

    return (
        <div className="space-y-4">
            <div className="flex gap-x-4 gap-y-2 items-center flex-wrap py-4 mb-4 border-b justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                    <Input
                        type="search"
                        placeholder="Search scorers..."
                        value={filters.search}
                        onChange={(value) => setFilters({ search: value })}
                        className="min-w-64"
                        data-attr="llma-scorers-search-input"
                    />
                    <Select<ScoreDefinitionKind | ''>
                        value={filters.kind}
                        onChange={(value) => setFilters({ kind: value || '' })}
                        options={KIND_OPTIONS}
                        data-attr="llma-scorers-kind-filter"
                    />
                    <Select<'' | 'false' | 'true'>
                        value={filters.archived}
                        onChange={(value) => setFilters({ archived: value === '' ? '' : value || 'false' })}
                        options={ARCHIVED_OPTIONS}
                        data-attr="llma-scorers-archived-filter"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="text-muted-alt">{scoreDefinitionCountLabel}</div>
                    <AccessControlAction
                        resourceType={AccessControlResourceType.LlmAnalytics}
                        minAccessLevel={AccessControlLevel.Editor}
                    >
                        <Button
                            type="primary"
                            size="small"
                            onClick={() => openModal('create')}
                            data-attr="llma-scorers-create-button"
                        >
                            New scorer
                        </Button>
                    </AccessControlAction>
                </div>
            </div>

            <Table
                loading={scoreDefinitionsLoading}
                columns={columns}
                dataSource={scoreDefinitions.results}
                pagination={pagination}
                noSortingCancellation
                sorting={sorting}
                onSort={(newSorting) =>
                    setFilters({
                        order_by: newSorting
                            ? `${newSorting.order === -1 ? '-' : ''}${newSorting.columnKey}`
                            : undefined,
                    })
                }
                rowKey="id"
                loadingSkeletonRows={SCORE_DEFINITIONS_PER_PAGE}
                nouns={['scorer', 'scorers']}
            />

            {modalProps && (
                <ScoreDefinitionModal
                    mode={modalProps.mode}
                    scoreDefinition={modalProps.scoreDefinition}
                    onClose={closeModal}
                />
            )}
        </div>
    )
}

function ScoreDefinitionModal({
    mode,
    scoreDefinition,
    onClose,
}: {
    mode: ScoreDefinitionModalMode
    scoreDefinition: ScoreDefinition | null
    onClose: () => void
}): JSX.Element {
    const logic = useMountedLogic(scoreDefinitionModalLogic({ mode, scoreDefinition }))
    const { submit, setDraftField, updateOptionLabel, addOption, removeOption } = useActions(logic)
    const { draft, isCreateMode, isMetadataMode, isConfigMode, title, submitting } = useValues(logic)

    return (
        <Modal isOpen onClose={onClose} simple maxWidth="42rem">
            <ModalHeader>
                <h3>{title}</h3>
            </ModalHeader>

            <ModalContent className="space-y-4">
                {isConfigMode && scoreDefinition ? (
                    <Banner type="info">
                        Saving these config changes creates version v{scoreDefinition.current_version + 1}. Previous
                        versions remain preserved.
                    </Banner>
                ) : null}

                {!isConfigMode ? (
                    <>
                        <div className="space-y-1">
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={draft.name}
                                onChange={(value) => setDraftField('name', value)}
                                data-attr="llma-scorer-name-input"
                            />
                        </div>

                        {isCreateMode ? (
                            <>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Kind</label>
                                    <Select<ScoreDefinitionKind>
                                        value={draft.kind}
                                        onChange={(value) =>
                                            setDraftField('kind', (value as ScoreDefinitionKind) || 'categorical')
                                        }
                                        options={
                                            KIND_OPTIONS.filter((option) => option.value !== '') as {
                                                label: string
                                                value: ScoreDefinitionKind
                                            }[]
                                        }
                                        data-attr="llma-scorer-kind-select"
                                    />
                                </div>
                            </>
                        ) : scoreDefinition ? (
                            <div className="space-y-1">
                                <div className="text-sm font-medium">Kind</div>
                                <div>{formatKindLabel(scoreDefinition.kind)}</div>
                            </div>
                        ) : null}

                        <div className="space-y-1">
                            <label className="text-sm font-medium">Description</label>
                            <TextArea
                                value={draft.description}
                                onChange={(value) => setDraftField('description', value)}
                                data-attr="llma-scorer-description-input"
                            />
                        </div>
                    </>
                ) : null}

                {!isMetadataMode ? (
                    <>
                        {draft.kind === 'categorical' ? (
                            <div className="space-y-3">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Selection mode</label>
                                        <Select<CategoricalSelectionMode>
                                            value={draft.selectionMode}
                                            onChange={(value) =>
                                                setDraftField(
                                                    'selectionMode',
                                                    (value as CategoricalSelectionMode) || 'single'
                                                )
                                            }
                                            options={CATEGORICAL_SELECTION_MODE_OPTIONS}
                                            data-attr="llma-scorer-selection-mode"
                                        />
                                    </div>

                                    {draft.selectionMode === 'multiple' ? (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium">Min selections</label>
                                                <Input
                                                    type="number"
                                                    value={getIntegerInputValue(draft.categoricalMinSelections)}
                                                    onChange={(value) =>
                                                        setDraftField(
                                                            'categoricalMinSelections',
                                                            formatNumericInputValue(value)
                                                        )
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium">Max selections</label>
                                                <Input
                                                    type="number"
                                                    value={getIntegerInputValue(draft.categoricalMaxSelections)}
                                                    onChange={(value) =>
                                                        setDraftField(
                                                            'categoricalMaxSelections',
                                                            formatNumericInputValue(value)
                                                        )
                                                    }
                                                />
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium">Options</div>
                                    <Button
                                        type="secondary"
                                        size="small"
                                        onClick={addOption}
                                        data-attr="llma-scorer-add-option"
                                    >
                                        Add option
                                    </Button>
                                </div>
                                <div className="text-xs text-muted-alt">
                                    Enter the labels people should choose from. Internal option IDs are generated
                                    automatically.
                                </div>
                                {draft.options.map((option, index) => (
                                    <div key={`${index}-${option.key}`} className="grid gap-2 sm:grid-cols-[1fr,auto]">
                                        <Input
                                            placeholder="Option label"
                                            value={option.label}
                                            onChange={(value) => updateOptionLabel(index, value)}
                                        />
                                        <Button
                                            type="secondary"
                                            status="danger"
                                            onClick={() => removeOption(index)}
                                            disabledReason={
                                                draft.options.length <= 1 ? 'Keep at least one option' : undefined
                                            }
                                            data-attr="llma-scorer-remove-option"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {draft.kind === 'numeric' ? (
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Min</label>
                                    <Input
                                        type="number"
                                        value={getNumericInputValue(draft.numericMin)}
                                        onChange={(value) =>
                                            setDraftField('numericMin', formatNumericInputValue(value))
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Max</label>
                                    <Input
                                        type="number"
                                        value={getNumericInputValue(draft.numericMax)}
                                        onChange={(value) =>
                                            setDraftField('numericMax', formatNumericInputValue(value))
                                        }
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Increment</label>
                                    <Input
                                        type="number"
                                        value={getNumericInputValue(draft.numericStep)}
                                        onChange={(value) =>
                                            setDraftField('numericStep', formatNumericInputValue(value))
                                        }
                                    />
                                    <div className="text-xs text-muted-alt">
                                        Optional amount the score should increase by, for example 1 or 0.5.
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {draft.kind === 'boolean' ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">True label</label>
                                    <Input
                                        value={draft.trueLabel}
                                        onChange={(value) => setDraftField('trueLabel', value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">False label</label>
                                    <Input
                                        value={draft.falseLabel}
                                        onChange={(value) => setDraftField('falseLabel', value)}
                                    />
                                </div>
                            </div>
                        ) : null}
                    </>
                ) : null}
            </ModalContent>

            <ModalFooter>
                <Button type="secondary" onClick={onClose} data-attr="llma-scorer-cancel">
                    Cancel
                </Button>
                <Button type="primary" onClick={() => submit()} loading={submitting} data-attr="llma-scorer-save">
                    {isConfigMode ? 'Create version' : 'Save'}
                </Button>
            </ModalFooter>
        </Modal>
    )
}
