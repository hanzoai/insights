import { useState } from 'react'

import { Checkbox } from 'lib/elements/Checkbox'

interface GAPromotionDialogContentProps {
    onChange: (checked: boolean) => void
}

export function GAPromotionDialogContent({ onChange }: GAPromotionDialogContentProps): JSX.Element {
    const [checked, setChecked] = useState(false)
    return (
        <div className="mt-2">
            <Checkbox
                checked={checked}
                onChange={(value) => {
                    setChecked(value)
                    onChange(value)
                }}
                label="Roll out to all users — include users who previously opted out"
                fullWidth
            />
        </div>
    )
}
