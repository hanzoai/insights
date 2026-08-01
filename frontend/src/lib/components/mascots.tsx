// Legacy Insights mascot illustrations.
//
// ⚠️ We're migrating away from these hand-rolled hogs to the shared `@hanzo/brand`
// hoggie library, rendered via its PNG exports — see `pngHoggie` in lib/brand/hoggies.
// Do NOT add new usages of anything exported here; reach for a `@hanzo/brand` hoggie
// instead.
// Everything left below is still rendered somewhere, and we'll slowly remove all of
// them as the remaining usages are migrated over. Tracked by:
//   - https://github.com/Insights/hanzo.ai/issues/17972
//   - https://github.com/Insights/hanzo.ai/issues/17973
//   - https://github.com/Insights/hanzo.ai/issues/17974
//   - https://github.com/Insights/hanzo.ai/issues/17975
//   - https://github.com/Insights/hanzo.ai/issues/17976
//   - https://github.com/Insights/hanzo.ai/issues/17977
//   - https://github.com/Insights/hanzo.ai/issues/17978
//   - https://github.com/Insights/hanzo.ai/issues/17979
//   - https://github.com/Insights/hanzo.ai/issues/17980
//   - https://github.com/Insights/hanzo.ai/issues/17981
//   - https://github.com/Insights/hanzo.ai/issues/17982
//   - https://github.com/Insights/hanzo.ai/issues/17983
import React, { ImgHTMLAttributes } from 'react'

import bigLeaguesHog from 'public/mascot/big-leagues.png'
import burningMoneyHog from 'public/mascot/burning-money-script.png'
import climberHog1 from 'public/mascot/climber-script-01.png'
import climberHog2 from 'public/mascot/climber-script-02.png'
import explorerHog from 'public/mascot/explorer-script.png'
import featureFlagHog from 'public/mascot/feature-flag-script.png'
import heartHog from 'public/mascot/heart-script.png'
import hogWelder from 'public/mascot/script-welder.png'
import mailHog from 'public/mascot/mail-script.png'
import sleepingHog from 'public/mascot/sleeping-script.png'
import starHog from 'public/mascot/star-script.png'
import supermanHog from 'public/mascot/superman-script.png'
import supportHeroHog from 'public/mascot/support-hero-script.png'
import warningHog from 'public/mascot/warning-script.png'
import wavingHog from 'public/mascot/waving-script.png'

type MascotProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>

// w400 x h400
const SquaredMascot = React.forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>(
    function SquaredMascot(props, ref): JSX.Element {
        return <img src={props.src} width={400} height={400} alt="Insights mascot" {...props} ref={ref} />
    }
)
// any width x h400
const RectangularMascot = React.forwardRef<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>>(
    function RectangularMascot(props, ref): JSX.Element {
        return <img src={props.src} height={400} alt="Insights mascot" {...props} ref={ref} />
    }
)

/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const HogWelder = (props: MascotProps): JSX.Element => {
    return <RectangularMascot src={hogWelder} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const ExplorerHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={explorerHog} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const HeartHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={heartHog} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const StarHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={starHog} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const SleepingHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={sleepingHog} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const SupportHeroHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={supportHeroHog} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const MailHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={mailHog} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const FeatureFlagHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={featureFlagHog} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const WarningHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={warningHog} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const WavingHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={wavingHog} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const BurningMoneyHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={burningMoneyHog} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const SupermanHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={supermanHog} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const ClimberHog1 = (props: MascotProps): JSX.Element => {
    return <RectangularMascot src={climberHog1} width={378} height={417} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const ClimberHog2 = (props: MascotProps): JSX.Element => {
    return <RectangularMascot src={climberHog2} width={518} height={1586} {...props} />
}
/** @deprecated Migrating to `@hanzo/brand` (see file header) — don't add new usages. */
export const BigLeaguesHog = (props: MascotProps): JSX.Element => {
    return <SquaredMascot src={bigLeaguesHog} {...props} />
}
