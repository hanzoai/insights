import { useActions, useValues } from 'kea'
import { useId } from 'react'

import { Button, ButtonProps, Dropdown, DropdownProps, Input } from '@hanzo/elements'

import { tagSelectLogic } from './tagSelectLogic'

export type TagSelectProps = {
    defaultLabel?: string
    value: string[]
    onChange: (value: string[]) => void
    children?: (selectedTags: string[]) => DropdownProps['children']
    /** Distinguishes the logic instance so multiple selects on one page keep independent open/search state. */
    logicKey?: string
}

export function TagSelect({
    defaultLabel = 'Any tags',
    value,
    onChange,
    children,
    logicKey,
    ...buttonProps
}: TagSelectProps & Pick<ButtonProps, 'type' | 'size'>): JSX.Element {
    const fallbackKey = useId()
    const logic = tagSelectLogic({ logicKey: logicKey ?? fallbackKey })
    const { filteredTags, search, showPopover } = useValues(logic)
    const { setSearch, setShowPopover } = useActions(logic)

    const _onChange = (newTags: string[]): void => {
        onChange(newTags)
    }

    const handleTagToggle = (tag: string): void => {
        const selected = new Set(value || [])
        if (selected.has(tag)) {
            selected.delete(tag)
        } else {
            selected.add(tag)
        }
        _onChange(Array.from(selected))
    }

    const handleClear = (): void => {
        _onChange([])
        setShowPopover(false)
    }

    const selectedCount = value?.length || 0
    const buttonClass = selectedCount > 0 ? 'min-w-26' : 'w-26'

    return (
        <Dropdown
            closeOnClickInside={false}
            visible={showPopover}
            matchWidth={false}
            actionable
            onVisibilityChange={setShowPopover}
            overlay={
                <div className="max-w-100 deprecated-space-y-2">
                    <Input
                        type="search"
                        placeholder="Search tags"
                        autoFocus
                        value={search}
                        onChange={setSearch}
                        fullWidth
                        className="max-w-full"
                    />
                    <ul className="deprecated-space-y-px">
                        {filteredTags.map((tag: string) => (
                            <li key={tag}>
                                <Button
                                    fullWidth
                                    role="menuitem"
                                    size="small"
                                    onClick={() => handleTagToggle(tag)}
                                >
                                    <span className="flex items-center justify-between gap-2 flex-1">
                                        <span className="flex items-center gap-2 max-w-full">
                                            <input
                                                type="checkbox"
                                                className="cursor-pointer"
                                                checked={value?.includes(tag) || false}
                                                readOnly
                                            />
                                            <span>{tag}</span>
                                        </span>
                                    </span>
                                </Button>
                            </li>
                        ))}

                        {filteredTags.length === 0 ? (
                            <div className="p-2 text-secondary italic truncate border-t">
                                {search ? <span>No matching tags</span> : <span>No tags</span>}
                            </div>
                        ) : null}

                        {selectedCount > 0 && (
                            <>
                                <div className="my-1 border-t" />
                                <li>
                                    <Button
                                        fullWidth
                                        role="menuitem"
                                        size="small"
                                        onClick={handleClear}
                                        type="secondary"
                                    >
                                        Clear selection
                                    </Button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            }
        >
            {children ? (
                children(value)
            ) : (
                <Button size="small" type="secondary" className={buttonClass} {...buttonProps}>
                    {selectedCount > 0 ? `${selectedCount} selected` : defaultLabel}
                </Button>
            )}
        </Dropdown>
    )
}
