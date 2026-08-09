// Upstream's mascot illustrations are not part of this product's identity, so
// none of them render. The exports stay because ~45 call sites place a mascot
// as decoration beside real content; a null component removes the artwork and
// leaves those layouts intact, which deleting the module would not.
//
// This is why the artwork keeps coming back: converging with upstream restores
// both the PNGs and the components that draw them, and a frontend that compiles
// looks like one that is correct. Rendering is what catches it.
import { ImgHTMLAttributes } from 'react'

type MascotProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>

function NullMascot(props: MascotProps): JSX.Element | null {
    void props
    return null
}

export const BigLeaguesScript = NullMascot
export const BurningMoneyScript = NullMascot
export const ClimberScript1 = NullMascot
export const ClimberScript2 = NullMascot
export const ExplorerScript = NullMascot
export const FeatureFlagScript = NullMascot
export const HeartScript = NullMascot
export const ScriptWelder = NullMascot
export const MailScript = NullMascot
export const SleepingScript = NullMascot
export const StarScript = NullMascot
export const SupermanScript = NullMascot
export const SupportHeroScript = NullMascot
export const WarningScript = NullMascot
export const WavingScript = NullMascot
