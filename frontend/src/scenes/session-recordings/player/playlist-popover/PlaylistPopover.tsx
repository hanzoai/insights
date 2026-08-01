import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconPin, IconPlus } from '@hanzo/icons'
import { Checkbox, Divider } from '@hanzo/elements'

import { IconOpenInNew, IconWithCount } from 'lib/elements/icons'
import { Button, ButtonProps } from 'lib/elements/Button'
import { Field } from 'lib/elements/Field'
import { Input } from 'lib/elements/Input/Input'
import { Skeleton } from 'lib/elements/Skeleton'
import { Popover } from 'lib/elements/Popover'
import { Spinner } from 'lib/elements/Spinner'
import { urls } from 'scenes/urls'

import { sessionRecordingsPlaylistLogic } from '../../playlist/sessionRecordingsPlaylistLogic'
import { sessionRecordingPlayerLogic } from '../sessionRecordingPlayerLogic'
import { playlistPopoverLogic } from './playlistPopoverLogic'

export function PlaylistPopoverButton({
    setPinnedInCurrentPlaylist,
    ...buttonProps
}: { setPinnedInCurrentPlaylist?: (pinned: boolean) => void } & ButtonProps): JSX.Element {
    const { sessionRecordingId, logicProps } = useValues(sessionRecordingPlayerLogic)
    const {
        logicProps: { logicKey: currentPlaylistId },
    } = useValues(sessionRecordingsPlaylistLogic)

    const logic = playlistPopoverLogic(logicProps)
    const {
        playlistsLoading,
        searchQuery,
        newFormShowing,
        showPlaylistPopover,
        allPlaylists,
        currentPlaylistsLoading,
        modifyingPlaylist,
        pinnedCount,
    } = useValues(logic)
    const { setSearchQuery, setNewFormShowing, setShowPlaylistPopover, addToPlaylist, removeFromPlaylist } =
        useActions(logic)
    return (
        <IconWithCount showZero={false} count={pinnedCount}>
            <Popover
                visible={showPlaylistPopover}
                onClickOutside={() => setShowPlaylistPopover(false)}
                actionable
                overlay={
                    <div className="deprecated-space-y-1 w-100">
                        <div className="shrink-0 deprecated-space-y-1">
                            {newFormShowing ? (
                                <Form
                                    formKey="newPlaylist"
                                    logic={playlistPopoverLogic}
                                    props={{ sessionRecordingId, playerKey: logicProps.playerKey }}
                                    enableFormOnSubmit
                                    className="deprecated-space-y-1"
                                >
                                    <Field name="name">
                                        <Input placeholder="Collection name" fullWidth />
                                    </Field>
                                    <div className="flex items-center gap-2 justify-end">
                                        <Button
                                            type="secondary"
                                            status="danger"
                                            onClick={() => setNewFormShowing(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="primary" htmlType="submit" icon={<IconPlus />}>
                                            Create and add to list
                                        </Button>
                                    </div>
                                </Form>
                            ) : (
                                <>
                                    <Input
                                        type="search"
                                        placeholder="Search collections..."
                                        value={searchQuery}
                                        onChange={setSearchQuery}
                                        fullWidth
                                    />
                                    <Button fullWidth icon={<IconPlus />} onClick={() => setNewFormShowing(true)}>
                                        New collection
                                    </Button>
                                </>
                            )}
                        </div>

                        <Divider className="my-1" />

                        {allPlaylists.length ? (
                            <div className="max-h-60 overflow-auto">
                                {allPlaylists?.map(({ selected, playlist }) => (
                                    <div key={playlist.short_id} className="flex items-center gap-1">
                                        <Button
                                            className="flex-1"
                                            icon={
                                                currentPlaylistsLoading &&
                                                modifyingPlaylist?.short_id === playlist.short_id ? (
                                                    <Spinner className="text-sm" />
                                                ) : (
                                                    <Checkbox className="pointer-events-none" checked={selected} />
                                                )
                                            }
                                            onClick={() => {
                                                if (
                                                    setPinnedInCurrentPlaylist &&
                                                    playlist.short_id === currentPlaylistId
                                                ) {
                                                    return setPinnedInCurrentPlaylist(!selected)
                                                }

                                                !selected ? addToPlaylist(playlist) : removeFromPlaylist(playlist)
                                            }}
                                        >
                                            {playlist.name || playlist.derived_name}
                                        </Button>

                                        <Button
                                            icon={<IconOpenInNew />}
                                            to={urls.replayPlaylist(playlist.short_id)}
                                            targetBlank
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : playlistsLoading ? (
                            <Skeleton className="my-2 h-4" repeat={3} />
                        ) : (
                            <div className="p-2 text-center text-secondary">No collections found</div>
                        )}
                    </div>
                }
            >
                <Button
                    icon={<IconPin />}
                    active={showPlaylistPopover}
                    onClick={() => setShowPlaylistPopover(!showPlaylistPopover)}
                    sideIcon={null}
                    {...buttonProps}
                />
            </Popover>
        </IconWithCount>
    )
}
