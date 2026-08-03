import { BuiltLogic, afterMount } from 'kea'

/**
 * Some kea logics are used heavily across multiple areas so we keep it mounted once loaded with this trick.
 */
export function permanentlyMount(): (logic: BuiltLogic) => void {
    return (logic) => {
        afterMount(() => {
            if (!logic.cache._permanentMount) {
                logic.cache._permanentMount = true
                // `logic`, not `logic.wrapper`. The wrapper is the BUILDER, so mounting it builds
                // a second instance from no props -- fine for a singleton, but a keyed logic has
                // no key without them, and kea throws "[KEA] Undefined key for logic ...". That
                // fired on every visit to the SQL editor, which reaches the keyed endpointLogic.
                //
                // This logic is the one already built with its props, so mounting it is also what
                // "keep it mounted" means: it raises the mount count on the instance that exists
                // rather than conjuring an unkeyed sibling. Same behaviour for the unkeyed logics
                // that make up every other caller.
                logic.mount()
            }
        })(logic)
    }
}
