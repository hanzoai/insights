import { actions, kea, key, path, props, reducers } from 'kea'

import type { bannerLogicType } from './bannerLogicType'

export type BannerLogicProps = {
    /** The key to be used for persisting the fact this modal is dismissed */
    dismissKey: string
}

export const bannerLogic = kea<bannerLogicType>([
    path((key) => ['components', 'banner', 'bannerLogic', key]),
    key(({ dismissKey }) => dismissKey),
    props({} as BannerLogicProps),
    actions({
        dismiss: true,
        resetDismissKey: true,
    }),
    reducers({
        isDismissed: [
            false,
            { persist: true },
            {
                dismiss: () => true,
                resetDismissKey: () => false,
            },
        ],
    }),
])
