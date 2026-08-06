import { IconChevronDown } from '@hanzo/icons'
import { Button, Checkbox, Menu, MenuItems } from '@hanzo/elements'

import type { ScoutTagOption } from '../../../utils/scoutTags'

export function ScoutTagsFilter({
    options,
    selected,
    onToggle,
    onClear,
}: {
    options: ScoutTagOption[]
    selected: string[]
    onToggle: (tag: string) => void
    onClear: () => void
}): JSX.Element {
    const label = selected.length === 0 ? 'Any tag' : selected.length === 1 ? selected[0] : `${selected.length} tags`
    const items: MenuItems = [
        {
            title: 'Tagged',
            items: options.map((option) => ({
                icon: <Checkbox checked={selected.includes(option.tag)} className="pointer-events-none" />,
                label: (
                    <span className="flex min-w-40 items-center justify-between gap-3">
                        <span className="truncate">{option.tag}</span>
                        <span className="text-muted tabular-nums">{option.count}</span>
                    </span>
                ),
                onClick: () => onToggle(option.tag),
            })),
            footer:
                selected.length > 0 ? (
                    <Button type="tertiary" size="xsmall" fullWidth onClick={onClear}>
                        Clear tags
                    </Button>
                ) : undefined,
        },
    ]

    return (
        <Menu items={items} closeOnClickInside={false} placement="bottom-end">
            <Button
                type="secondary"
                size="xsmall"
                sideIcon={<IconChevronDown />}
                aria-label="Filter scouts by tag"
            >
                {label}
            </Button>
        </Menu>
    )
}
