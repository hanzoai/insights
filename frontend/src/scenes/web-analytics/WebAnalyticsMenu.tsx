import { useActions, useValues } from 'kea'

import { IconEllipsis, IconSearch } from '@hanzo/icons'

import { FEATURE_FLAGS } from 'lib/constants'
import { useFeatureFlag } from 'lib/hooks/useFeatureFlag'
import { Button } from 'lib/elements/Button'
import { Menu, MenuSection } from 'lib/elements/Menu'
import { Switch } from 'lib/elements/Switch'
import { Link } from 'lib/elements/Link'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { ButtonPrimitive } from 'lib/ui/Button/ButtonPrimitives'
import { urls } from 'scenes/urls'
import { webAnalyticsLogic } from 'scenes/web-analytics/webAnalyticsLogic'

import { ScenePanel, ScenePanelActionsSection, ScenePanelDivider, ScenePanelLabel } from '~/layout/scenes/SceneLayout'

import { ProductTab, TILE_LABELS, TileId } from './common'

const ANALYTICS_TILES = [
    TileId.OVERVIEW,
    TileId.GRAPHS,
    TileId.PATHS,
    TileId.SOURCES,
    TileId.DEVICES,
    TileId.GEOGRAPHY,
    TileId.ACTIVE_HOURS,
    TileId.RETENTION,
    TileId.GOALS,
    TileId.REPLAY,
    TileId.ERROR_TRACKING,
    TileId.FRUSTRATING_PAGES,
]

export const WebAnalyticsMenu = (): JSX.Element => {
    const { shouldFilterTestAccounts, hiddenTiles, productTab } = useValues(webAnalyticsLogic)
    const { featureFlags } = useValues(featureFlagLogic)

    const { setShouldFilterTestAccounts, setTileVisibility, resetTileVisibility } = useActions(webAnalyticsLogic)

    const showTileToggles = featureFlags[FEATURE_FLAGS.WEB_ANALYTICS_TILE_TOGGLES]
    const availableTiles = productTab === ProductTab.ANALYTICS ? ANALYTICS_TILES : []
    const isRemovingSidePanelFlag = useFeatureFlag('UX_REMOVE_SIDEPANEL')

    const sections: MenuSection[] = [
        {
            items: [
                {
                    label: 'Session Attribution Explorer',
                    to: urls.sessionAttributionExplorer(),
                    icon: <IconSearch />,
                },
            ],
        },
        {
            items: [
                {
                    label: () => (
                        <Switch
                            checked={shouldFilterTestAccounts}
                            onChange={() => {
                                setShouldFilterTestAccounts(!shouldFilterTestAccounts)
                            }}
                            fullWidth={true}
                            label="Filter out internal and test users"
                        />
                    ),
                },
            ],
        },
    ]

    if (showTileToggles && availableTiles.length > 0) {
        sections.push({
            title: 'Visible tiles',
            items: availableTiles.map((tileId) => ({
                label: () => (
                    <Switch
                        checked={!hiddenTiles.includes(tileId)}
                        onChange={() => {
                            setTileVisibility(tileId, hiddenTiles.includes(tileId))
                        }}
                        fullWidth={true}
                        label={TILE_LABELS[tileId]}
                    />
                ),
            })),
        })

        if (hiddenTiles.length > 0) {
            sections.push({
                items: [
                    {
                        label: 'Reset to defaults',
                        onClick: resetTileVisibility,
                    },
                ],
            })
        }
    }

    if (isRemovingSidePanelFlag) {
        return (
            <ScenePanel>
                <ScenePanelActionsSection>
                    <Link to={urls.sessionAttributionExplorer()} buttonProps={{ menuItem: true }}>
                        <IconSearch /> Session Attribution Explorer
                    </Link>
                </ScenePanelActionsSection>
                <ScenePanelDivider />
                <ScenePanelActionsSection>
                    <ButtonPrimitive
                        menuItem
                        onClick={() => {
                            setShouldFilterTestAccounts(!shouldFilterTestAccounts)
                        }}
                    >
                        <Switch checked={shouldFilterTestAccounts} size="xsmall" />
                        Filter out internal and test users
                    </ButtonPrimitive>
                </ScenePanelActionsSection>
                <ScenePanelDivider />
                <ScenePanelActionsSection>
                    <ScenePanelLabel title="Visible tiles" className="px-1.5">
                        {availableTiles.map((tileId) => (
                            <ButtonPrimitive
                                key={tileId}
                                menuItem
                                onClick={() => {
                                    setTileVisibility(tileId, hiddenTiles.includes(tileId))
                                }}
                            >
                                <Switch checked={!hiddenTiles.includes(tileId)} size="xsmall" />
                                {TILE_LABELS[tileId]}
                            </ButtonPrimitive>
                        ))}
                    </ScenePanelLabel>
                </ScenePanelActionsSection>
            </ScenePanel>
        )
    }

    return (
        <>
            <Menu items={sections} closeOnClickInside={false}>
                <Button icon={<IconEllipsis />} size="small" />
            </Menu>
        </>
    )
}
