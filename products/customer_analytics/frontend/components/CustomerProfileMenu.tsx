import { useActions, useValues } from 'kea'

import { IconGear } from '@hanzo/icons'
import { Button, Menu, MenuSection, Switch } from '@hanzo/elements'

import { customerProfileLogic } from '../customerProfileLogic'

export function CustomerProfileMenu(): JSX.Element | null {
    const { changed, isProfileConfigEnabled, defaultContent, content } = useValues(customerProfileLogic)
    const { removeNode, addNode, resetToDefaults, saveChanges } = useActions(customerProfileLogic)

    const handleChange = (nodeType: string | undefined, checked: boolean): void => {
        if (nodeType === undefined) {
            return
        }
        checked ? addNode(nodeType) : removeNode(nodeType)
    }

    const items: MenuSection[] = [
        {
            title: 'Visible tiles',
            items: defaultContent.map((node) => ({
                label: () => (
                    <Switch
                        key={node.type}
                        label={node?.attrs?.title || node.type}
                        checked={content.some((c) => c.type === node.type)}
                        onChange={(checked) => handleChange(node?.type, checked)}
                        fullWidth
                    />
                ),
            })),
        },
    ]

    if (!isProfileConfigEnabled) {
        return null
    }

    return (
        <div className="flex flex-row items-center">
            <Menu items={items} closeOnClickInside={false}>
                <Button type="secondary" icon={<IconGear />} children="Edit profile" sideIcon={null} />
            </Menu>
            {changed && (
                <>
                    <Button
                        type="primary"
                        className="ml-2"
                        children="Save changes"
                        sideIcon={null}
                        onClick={() => saveChanges()}
                    />
                    <Button
                        type="secondary"
                        className="ml-2"
                        children="Cancel"
                        sideIcon={null}
                        onClick={() => resetToDefaults()}
                    />
                </>
            )}
        </div>
    )
}
