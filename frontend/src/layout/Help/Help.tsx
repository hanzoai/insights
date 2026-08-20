import { useActions, useValues } from 'kea'

import { Button, Divider, Popover, SegmentedButton } from '@hanzo/elements'
import { IconBook, IconDay, IconLaptop, IconNight, IconQuestion, IconSparkles, IconTextWidth } from '@hanzo/icons'

import { Density, TextSize } from 'scenes/settings/user/Appearance'
import { userLogic } from 'scenes/userLogic'

import { SidePanelTab } from '~/types'

import { sidePanelStateLogic } from '../navigation-3000/sidepanel/sidePanelStateLogic'
import { helpLogic } from './helpLogic'

const DOCS_URL = 'https://hanzo.ai/docs'

function Row({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
    return (
        <div className="flex items-center justify-between gap-4 py-1">
            <span className="text-sm">{label}</span>
            {children}
        </div>
    )
}

function HelpContent(): JSX.Element {
    const { themeMode } = useValues(userLogic)
    const { updateUser } = useActions(userLogic)
    const { openSidePanel } = useActions(sidePanelStateLogic)
    const { close } = useActions(helpLogic)

    const go = (tab: SidePanelTab): void => {
        openSidePanel(tab)
        close()
    }

    return (
        <div className="w-72 flex flex-col gap-1">
            <h5 className="mb-1">Help</h5>
            <Button icon={<IconQuestion />} fullWidth onClick={() => go(SidePanelTab.Support)}>
                Get help
            </Button>
            <Button icon={<IconBook />} fullWidth to={DOCS_URL} targetBlank>
                Docs
            </Button>
            <Button icon={<IconSparkles />} fullWidth onClick={() => go(SidePanelTab.Max)}>
                Ask Insights AI
            </Button>

            <Divider className="my-2" />

            <h5 className="mb-1">Preferences</h5>
            <Row label="Theme">
                <SegmentedButton
                    size="small"
                    value={themeMode ?? 'system'}
                    onChange={(value) => updateUser({ theme_mode: value })}
                    options={[
                        { value: 'system', icon: <IconLaptop />, tooltip: 'Sync with system' },
                        { value: 'light', icon: <IconDay />, tooltip: 'Light mode' },
                        { value: 'dark', icon: <IconNight />, tooltip: 'Dark mode' },
                    ]}
                />
            </Row>
            <Row label="Text size">
                <TextSize />
            </Row>
            <Row label="Density">
                <Density />
            </Row>
            <p className="text-xs text-secondary mt-1 mb-0">
                <IconTextWidth className="mr-1" />
                Text size and density apply on this device.
            </p>
        </div>
    )
}

/** The one help and preferences surface, anchored to the app rather than to a scene. */
export function Help(): JSX.Element {
    const { visible } = useValues(helpLogic)
    const { toggle, close } = useActions(helpLogic)

    return (
        <Popover
            visible={visible}
            onClickOutside={close}
            overlay={<HelpContent />}
            placement="top-start"
            className="z-top"
        >
            <Button
                type="secondary"
                icon={<IconQuestion />}
                onClick={toggle}
                aria-label="Help and preferences"
                className="fixed bottom-2 left-2 z-top rounded-full"
                size="small"
            />
        </Popover>
    )
}
