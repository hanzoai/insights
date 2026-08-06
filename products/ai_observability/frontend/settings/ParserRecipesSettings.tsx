import { useActions, useValues } from 'kea'

import { Button, Modal, TextArea, Spinner } from '@hanzo/elements'

import { Dialog } from 'lib/elements/Dialog'
import { Input } from 'lib/elements/Input'

import { CustomRecipeItem, parserRecipesLogic } from './parserRecipesLogic'

export function ParserRecipesSettings(): JSX.Element {
    const { customItems, storedRecipesLoading } = useValues(parserRecipesLogic)
    const { openEditorForNew } = useActions(parserRecipesLogic)

    if (storedRecipesLoading) {
        return <Spinner />
    }

    return (
        <div className="flex flex-col gap-2">
            {customItems.length === 0 ? (
                <p className="text-muted">
                    No custom recipes yet. Add one to normalize a provider shape the built-in recipes miss.
                </p>
            ) : (
                <div className="flex flex-col gap-1">
                    {customItems.map((item) => (
                        <RecipeRow key={item.id} item={item} />
                    ))}
                </div>
            )}
            <div>
                <Button type="primary" onClick={openEditorForNew}>
                    Add recipe
                </Button>
            </div>
            <RecipeEditorModal />
        </div>
    )
}

function RecipeRow({ item }: { item: CustomRecipeItem }): JSX.Element {
    const { openEditorForItem, deleteItem } = useActions(parserRecipesLogic)

    return (
        <div className="flex items-center gap-2 border rounded p-2 bg-bg-light">
            <span className="font-medium flex-1 ph-no-capture">{item.name}</span>
            <Button size="small" type="secondary" onClick={() => openEditorForItem(item)}>
                Edit
            </Button>
            <Button
                size="small"
                type="secondary"
                status="danger"
                onClick={() =>
                    Dialog.open({
                        title: 'Delete recipe?',
                        description: `This permanently deletes "${item.name}". This cannot be undone.`,
                        primaryButton: {
                            children: 'Delete',
                            status: 'danger',
                            onClick: () => deleteItem(item),
                        },
                        secondaryButton: { children: 'Cancel' },
                    })
                }
            >
                Delete
            </Button>
        </div>
    )
}

function RecipeEditorModal(): JSX.Element {
    const { editor, savingEditor, editorCompileError } = useValues(parserRecipesLogic)
    const { closeEditor, setEditorName, setEditorSource, submitEditor } = useActions(parserRecipesLogic)

    const nameMissing = !editor?.name.trim()

    return (
        <Modal
            isOpen={!!editor}
            onClose={closeEditor}
            title={editor?.rowId ? 'Edit recipe' : 'New recipe'}
            width={720}
            footer={
                <>
                    <Button type="secondary" onClick={closeEditor}>
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={submitEditor}
                        loading={savingEditor}
                        disabledReason={
                            nameMissing
                                ? 'Recipe name is required'
                                : editorCompileError
                                  ? 'Recipe YAML does not compile'
                                  : undefined
                        }
                    >
                        Save
                    </Button>
                </>
            }
        >
            {editor && (
                <div className="flex flex-col gap-2 w-full">
                    <Input placeholder="Recipe name" value={editor.name} onChange={setEditorName} />
                    <TextArea
                        className="font-mono"
                        value={editor.source}
                        onChange={setEditorSource}
                        minRows={12}
                        placeholder="Recipe YAML"
                    />
                    {editorCompileError && <p className="text-danger text-sm m-0">{editorCompileError}</p>}
                </div>
            )}
        </Modal>
    )
}
