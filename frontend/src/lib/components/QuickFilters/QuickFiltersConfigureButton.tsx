import { useActions } from 'kea'

import { IconGear } from '@hanzo/icons'
import { Button } from '@hanzo/elements'

import { QuickFiltersModal } from './QuickFiltersModal'
import { QuickFiltersLogicProps } from './quickFiltersLogic'
import { quickFiltersModalLogic } from './quickFiltersModalLogic'

export function QuickFiltersConfigureButton({ context }: QuickFiltersLogicProps): JSX.Element {
    const { openModal } = useActions(quickFiltersModalLogic({ context }))

    return (
        <>
            <QuickFiltersModal context={context} />
            <Button size="small" icon={<IconGear />} onClick={openModal} tooltip="Configure quick filters" />
        </>
    )
}
