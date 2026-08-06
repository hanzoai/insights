import { useValues } from 'kea'
import type { ReactNode } from 'react'

import { themeLogic } from '~/layout/navigation-3000/themeLogic'

const KEYBOARD_GARDEN = {
    light: { baseColor: '#eeefe9' },
    dark: { baseColor: '#1d1f27' },
}

// Auth wallpaper: a flat base color behind the content. themeLogic forces light mode on
// unauthenticated scenes, so the dark value stays dormant on the auth pages for now.
export function KeyboardGardenBackground({ children }: { children?: ReactNode }): JSX.Element {
    const { isDarkModeOn } = useValues(themeLogic)
    const assets = isDarkModeOn ? KEYBOARD_GARDEN.dark : KEYBOARD_GARDEN.light

    return (
        <div className="relative min-h-screen w-full overflow-hidden" style={{ backgroundColor: assets.baseColor }}>
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">{children}</div>
        </div>
    )
}
