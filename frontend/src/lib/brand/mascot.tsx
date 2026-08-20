// The app-facing entry point for the illustrations that used to sit beside empty
// states, error screens and onboarding copy.
//
// None of them render. The artwork was upstream's mascot, licensed to us for
// neither commercial use nor redistribution, and it was never part of what this
// product is. The factory stays because ~106 call sites place an illustration
// next to real content and size it with their own classes; a component that
// renders nothing removes the picture and leaves those layouts intact, which
// deleting the module would not. This mirrors `lib/components/mascots.tsx`,
// which retired an earlier set the same way.
//
// Keeping the factory is also what stops the artwork coming back: converging
// with upstream restores the illustrations and the code that draws them, and a
// frontend that compiles looks like one that is correct.
//
//     const MascotJudge = pngMascot()
//     <MascotJudge className="w-20 h-20" />
import { ComponentType, SVGAttributes } from 'react'

/**
 * The prop surface call sites type against — the illustrations were SVG
 * components before they were `<img>`s, and the call sites still pass that
 * shape.
 */
export interface AssetSvgProps extends SVGAttributes<SVGElement> {
    size?: string | number
    title?: string
}

/** An illustration slot that draws nothing. */
export function pngMascot(): ComponentType<AssetSvgProps> {
    return function NullMascot(props: AssetSvgProps): JSX.Element | null {
        void props
        return null
    }
}
