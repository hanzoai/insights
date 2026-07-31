import { useActions, useValues } from 'kea'
import { useState } from 'react'

import {
    IconBookmark,
    IconBookmarkSolid,
    IconCheck,
    IconPencil,
    IconPin,
    IconPinFilled,
    IconPlus,
    IconTrash,
    IconX,
} from '@hanzo/icons'
import {
    Button,
    Divider,
    Input,
    Modal,
    Skeleton,
    TextArea,
    Popover,
} from '@hanzo/elements'

import { IconSync } from 'lib/elements/icons'

import { WebAnalyticsFilterPresetType } from '~/types'

import { webAnalyticsFilterPresetsLogic } from './webAnalyticsFilterPresetsLogic'

export const FilterPresetsDropdown = (): JSX.Element => {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const {
        pinnedPresets,
        recentPresets,
        presetsLoading,
        activePreset,
        hasPresets,
        presetToDelete,
        hasUnsavedChanges,
    } = useValues(webAnalyticsFilterPresetsLogic)
    const {
        applyPreset,
        deletePreset,
        updatePreset,
        openSaveModal,
        clearPreset,
        openDeleteModal,
        closeDeleteModal,
        openEditModal,
        updateAppliedPresetFilters,
    } = useActions(webAnalyticsFilterPresetsLogic)

    const handleTogglePin = (preset: WebAnalyticsFilterPresetType, e: React.MouseEvent): void => {
        e.stopPropagation()
        updatePreset(preset.short_id, { pinned: !preset.pinned })
    }

    const handleDelete = (preset: WebAnalyticsFilterPresetType, e: React.MouseEvent): void => {
        e.stopPropagation()
        setDropdownOpen(false)
        openDeleteModal(preset)
    }

    const handleEdit = (preset: WebAnalyticsFilterPresetType, e: React.MouseEvent): void => {
        e.stopPropagation()
        setDropdownOpen(false)
        openEditModal(preset)
    }

    const renderPresetItem = (preset: WebAnalyticsFilterPresetType): JSX.Element => {
        const isActive = activePreset?.short_id === preset.short_id

        return (
            <div
                key={preset.short_id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-bg-light rounded cursor-pointer group"
                onClick={() => {
                    applyPreset(preset)
                    setDropdownOpen(false)
                }}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isActive && <IconCheck className="text-success shrink-0 text-base" />}
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{preset.name}</div>
                        {preset.description && <div className="text-xs text-muted truncate">{preset.description}</div>}
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        size="xsmall"
                        icon={preset.pinned ? <IconPinFilled /> : <IconPin />}
                        onClick={(e) => handleTogglePin(preset, e)}
                        tooltip={preset.pinned ? 'Unpin' : 'Pin'}
                    />
                    <Button
                        size="xsmall"
                        icon={<IconPencil />}
                        onClick={(e) => handleEdit(preset, e)}
                        tooltip="Edit"
                    />
                    <Button
                        size="xsmall"
                        icon={<IconTrash />}
                        onClick={(e) => handleDelete(preset, e)}
                        tooltip="Delete"
                        status="danger"
                    />
                </div>
            </div>
        )
    }

    const dropdownContent = (
        <div className="w-72 max-h-96 overflow-y-auto">
            <div className="px-2 pt-2 pb-1 ">
                {activePreset && hasUnsavedChanges ? (
                    <>
                        <Button
                            fullWidth
                            size="small"
                            type="primary"
                            icon={<IconSync />}
                            onClick={() => {
                                setDropdownOpen(false)
                                updateAppliedPresetFilters()
                            }}
                        >
                            Update "{activePreset.name}"
                        </Button>
                        <Divider className="mt-2 mb-2" />
                        <Button
                            fullWidth
                            size="small"
                            type="tertiary"
                            icon={<IconPlus />}
                            onClick={() => {
                                setDropdownOpen(false)
                                openSaveModal()
                            }}
                        >
                            Save as new preset
                        </Button>
                    </>
                ) : (
                    <Button
                        fullWidth
                        size="small"
                        icon={<IconPlus />}
                        onClick={() => {
                            setDropdownOpen(false)
                            openSaveModal()
                        }}
                    >
                        Save current filters
                    </Button>
                )}
            </div>

            {presetsLoading ? (
                <div className="p-3 space-y-2">
                    <Skeleton className="h-8" />
                    <Skeleton className="h-8" />
                </div>
            ) : !hasPresets ? (
                <div className="px-3 pb-3 text-center text-muted text-sm">
                    No saved presets yet.
                    <br />
                    Save your current filters to create one.
                </div>
            ) : (
                <>
                    {pinnedPresets.length > 0 && (
                        <>
                            <Divider />
                            <div className="px-2 py-1">
                                <div className="text-xs font-semibold text-muted uppercase px-2 py-1">Pinned</div>
                                {pinnedPresets.map(renderPresetItem)}
                            </div>
                        </>
                    )}

                    {recentPresets.length > 0 && (
                        <>
                            <Divider />
                            <div className="px-2 py-1">
                                <div className="text-xs font-semibold text-muted uppercase px-2 py-1">Recent</div>
                                {recentPresets.map(renderPresetItem)}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    )

    const bookmarkIcon = activePreset ? <IconBookmarkSolid className="text-yellow-400" /> : <IconBookmark />
    return (
        <>
            <Popover
                visible={dropdownOpen}
                onClickOutside={() => setDropdownOpen(false)}
                placement="bottom-start"
                fallbackPlacements={['bottom-end']}
                overlay={dropdownContent}
            >
                <Button
                    type="secondary"
                    size="small"
                    icon={bookmarkIcon}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    data-attr="web-analytics-filter-presets"
                    active={!!activePreset}
                    sideAction={
                        activePreset
                            ? {
                                  icon: <IconX />,
                                  tooltip: 'Clear preset',
                                  onClick: (e) => {
                                      e.stopPropagation()
                                      clearPreset()
                                  },
                              }
                            : undefined
                    }
                >
                    {activePreset ? (
                        <span className="flex items-center gap-1">
                            <span className="max-w-32 truncate">{activePreset.name}</span>
                            {hasUnsavedChanges && <span className="text-warning shrink-0">(modified)</span>}
                        </span>
                    ) : (
                        'Presets'
                    )}
                </Button>
            </Popover>
            <SaveFilterPresetModal />
            <DeletePresetModal
                preset={presetToDelete}
                onClose={closeDeleteModal}
                onConfirm={() => presetToDelete && deletePreset(presetToDelete)}
            />
        </>
    )
}

const SaveFilterPresetModal = (): JSX.Element | null => {
    const {
        saveModalOpen,
        savedPresetLoading,
        presetFormName,
        presetFormDescription,
        canSavePreset,
        isEditMode,
        editingPreset,
    } = useValues(webAnalyticsFilterPresetsLogic)
    const { closeSaveModal, saveCurrentFiltersAsPreset, setPresetFormName, setPresetFormDescription, updatePreset } =
        useActions(webAnalyticsFilterPresetsLogic)

    const handleSave = (): void => {
        if (canSavePreset) {
            if (isEditMode && editingPreset) {
                updatePreset(editingPreset.short_id, {
                    name: presetFormName.trim(),
                    description: presetFormDescription.trim() || undefined,
                })
            } else {
                saveCurrentFiltersAsPreset(presetFormName.trim(), presetFormDescription.trim() || undefined)
            }
        }
    }

    const isOpen = saveModalOpen || isEditMode

    return (
        <Modal
            isOpen={isOpen}
            onClose={closeSaveModal}
            title={isEditMode ? `Edit "${editingPreset?.name}"` : 'Save filter preset'}
            footer={
                <>
                    <Button type="secondary" onClick={closeSaveModal}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleSave}
                        loading={savedPresetLoading}
                        disabledReason={!canSavePreset ? 'Name is required' : undefined}
                    >
                        {isEditMode ? 'Update preset' : 'Save preset'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input
                        value={presetFormName}
                        onChange={setPresetFormName}
                        placeholder="e.g., US Mobile Traffic"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">Description (optional)</label>
                    <TextArea
                        value={presetFormDescription}
                        onChange={setPresetFormDescription}
                        placeholder="Describe what this preset filters for..."
                        rows={2}
                    />
                </div>
            </div>
        </Modal>
    )
}

const DeletePresetModal = ({
    preset,
    onClose,
    onConfirm,
}: {
    preset: WebAnalyticsFilterPresetType | null
    onClose: () => void
    onConfirm: () => void
}): JSX.Element => {
    return (
        <Modal
            isOpen={!!preset}
            onClose={onClose}
            title={`Delete "${preset?.name}"?`}
            description="This preset will be permanently deleted."
            overlayClassName="!items-center"
            footer={
                <>
                    <Button type="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="primary" status="danger" onClick={onConfirm}>
                        Delete
                    </Button>
                </>
            }
        />
    )
}
