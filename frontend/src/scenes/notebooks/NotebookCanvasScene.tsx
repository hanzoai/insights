import { useActions } from 'kea'
import { useMemo } from 'react'

import { IconEllipsis } from '@hanzo/icons'
import { Button, Menu, toast } from '@hanzo/elements'

import { uuid } from 'lib/utils'
import { copyToClipboard } from 'lib/utils/copyToClipboard'
import { getTextFromFile, selectFiles } from 'lib/utils/file-utils'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'

import { Notebook } from './Notebook/Notebook'
import { NotebookLogicProps, notebookLogic } from './Notebook/notebookLogic'

export const scene: SceneExport = {
    component: NotebookCanvas,
}

export function NotebookCanvas(): JSX.Element {
    const id = useMemo(() => uuid(), [])

    const logicProps: NotebookLogicProps = {
        shortId: `canvas-${id}`,
        mode: 'canvas',
    }

    const { duplicateNotebook, exportJSON, setLocalContent } = useActions(notebookLogic(logicProps))

    return (
        <SceneContent className="h-full">
            <SceneTitleSection
                name="Canvas"
                resourceType={{
                    type: 'notebook',
                }}
                forceBackTo={{
                    path: urls.notebooks(),
                    name: 'Notebooks',
                    key: 'notebooks',
                }}
                actions={
                    <>
                        <Menu
                            items={[
                                {
                                    label: 'Clear canvas',
                                    onClick: () => setLocalContent({ type: 'doc', content: [] }, true),
                                },
                                {
                                    label: 'Export as JSON',
                                    onClick: () => exportJSON(),
                                },
                                {
                                    label: 'Load from JSON',
                                    onClick: () => {
                                        void selectFiles({
                                            contentType: 'application/json',
                                            multiple: false,
                                        })
                                            .then((files) => getTextFromFile(files[0]))
                                            .then((text) => {
                                                const data = JSON.parse(text)
                                                if (data.type !== 'doc') {
                                                    throw new Error('Not a notebook')
                                                }
                                                // Looks like a notebook
                                                setLocalContent(data, true)
                                            })
                                            .catch((e) => {
                                                toast.error(e.message)
                                            })
                                    },
                                },
                            ]}
                        >
                            <Button icon={<IconEllipsis />} size="small" />
                        </Menu>
                        <Button
                            type="secondary"
                            onClick={() => {
                                void copyToClipboard(window.location.href, 'Canvas URL')
                            }}
                            size="small"
                        >
                            Share
                        </Button>
                        <Button type="primary" onClick={duplicateNotebook} size="small">
                            Save as Notebook
                        </Button>
                    </>
                }
            />
            <div className="relative flex-1">
                <Notebook {...logicProps} />
            </div>
        </SceneContent>
    )
}
