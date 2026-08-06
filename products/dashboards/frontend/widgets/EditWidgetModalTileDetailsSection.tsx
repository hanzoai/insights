import { TextArea } from '@hanzo/elements'

import { Field } from 'lib/elements/Field/Field'
import { Input } from 'lib/elements/Input/Input'

type EditWidgetModalTileDetailsSectionProps = {
    tileName: string
    tileDescription: string
    defaultTitle: string
    saving: boolean
    setTileName: (value: string) => void
    setTileDescription: (value: string) => void
}

export function EditWidgetModalTileDetailsSection({
    tileName,
    tileDescription,
    defaultTitle,
    saving,
    setTileName,
    setTileDescription,
}: EditWidgetModalTileDetailsSectionProps): JSX.Element {
    return (
        <section className="flex flex-col gap-3">
            <h5 className="text-sm font-semibold m-0">Tile details</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field.Pure
                    className="sm:col-span-2"
                    label="Title"
                    help="Shown on the tile. Leave empty to use the default title."
                >
                    <Input
                        value={tileName}
                        onChange={setTileName}
                        placeholder={defaultTitle}
                        maxLength={400}
                        disabled={saving}
                    />
                </Field.Pure>
                <Field.Pure
                    className="sm:col-span-2"
                    label="Description"
                    help="Shown under the tile title. Supports markdown. Leave empty to hide."
                >
                    <TextArea
                        value={tileDescription}
                        onChange={setTileDescription}
                        placeholder="Enter description (optional)"
                        minRows={2}
                        disabled={saving}
                    />
                </Field.Pure>
            </div>
        </section>
    )
}
