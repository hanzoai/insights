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

export const BigLeaguesHog = NullMascot
export const BurningMoneyHog = NullMascot
export const ClimberHog1 = NullMascot
export const ClimberHog2 = NullMascot
export const ExplorerHog = NullMascot
export const FeatureFlagHog = NullMascot
export const HeartHog = NullMascot
export const HogWelder = NullMascot
export const MailHog = NullMascot
export const SleepingHog = NullMascot
export const StarHog = NullMascot
export const SupermanHog = NullMascot
export const SupportHeroHog = NullMascot
export const WarningHog = NullMascot
export const WavingHog = NullMascot
