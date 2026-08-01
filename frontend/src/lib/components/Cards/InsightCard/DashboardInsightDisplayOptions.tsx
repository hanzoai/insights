import { Button } from 'lib/elements/Button'
import { Divider } from 'lib/elements/Divider'
import { Menu, MenuItems } from 'lib/elements/Menu'

// Items are computed in InsightMeta (always mounted) and passed down to avoid mounting
// useInsightDisplayOptions lazily inside the More popover overlay, which triggers kea logic
// mounts that cascade and close the popover before the user can interact with it.
export function DashboardInsightDisplayOptions({ items }: { items: MenuItems }): JSX.Element | null {
    if (items.length === 0) {
        return null
    }

    return (
        <>
            <Divider />
            <Menu
                items={items}
                closeOnClickInside={false}
                placement="right-start"
                fallbackPlacements={['left-start']}
            >
                <Button fullWidth>Display options</Button>
            </Menu>
        </>
    )
}
