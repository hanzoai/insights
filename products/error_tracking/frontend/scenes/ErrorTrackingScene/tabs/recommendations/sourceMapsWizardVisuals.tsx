import './sourceMapsWizardVisuals.scss'

import { cn } from 'lib/utils/css-classes'
import { WizardScript as WizardScriptImage } from 'scenes/onboarding/shared/wizardScript'

export function WizardScript({ castKey = 0, className }: { castKey?: number; className?: string }): JSX.Element {
    return (
        <WizardScriptImage
            key={`wizard-script-${castKey}`}
            className={cn('shrink-0 select-none', castKey > 0 && 'SourceMapsWizard__scriptCast', className)}
        />
    )
}
