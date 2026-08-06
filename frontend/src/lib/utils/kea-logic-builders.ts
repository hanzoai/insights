import { BuiltLogic, afterMount } from 'kea'

/**
 * Some kea logics are used heavily across multiple areas so we keep it mounted once loaded with this trick.
 */
export function permanentlyMount(): (logic: BuiltLogic) => void {
    return (logic) => {
        afterMount(() => {
            if (!logic.cache._permanentMount) {
                logic.cache._permanentMount = true
                // `logic`, not `logic.wrapper`: mounting the wrapper builds a second instance
                // without props, which throws for keyed logics. Mounting the built logic raises
                // the mount count on the instance that already exists.
                logic.mount()
            }
        })(logic)
    }
}
