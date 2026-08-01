import { useActions, useValues } from 'kea'

import { IconArrowLeft, IconLightBulb } from '@hanzo/icons'
import { Button, Link } from '@hanzo/elements'

import { cn } from 'lib/utils/css-classes'
import { urls } from 'scenes/urls'

import { ExperimentWizardGuide } from './ExperimentWizardGuide'
import { experimentWizardLogic } from './experimentWizardLogic'
import { ExperimentWizardStepper } from './ExperimentWizardStepper'
import { AboutStep } from './steps/AboutStep'
import { AnalyticsStep } from './steps/AnalyticsStep'
import { VariantsStep } from './steps/VariantsStep'

export function ExperimentWizard(): JSX.Element {
    const {
        currentStep,
        isLastStep,
        isFirstStep,
        isExperimentSubmitting,
        showGuide,
        stepValidationErrors,
        hasFormErrors,
    } = useValues(experimentWizardLogic)
    const { nextStep, prevStep, setStep, saveExperiment, toggleGuide } = useActions(experimentWizardLogic)

    const header = (
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <Button type="tertiary" size="small" icon={<IconArrowLeft />} to={urls.experiments()}>
                    Experiments
                </Button>
                <h1 className="text-2xl font-semibold">New experiment</h1>
            </div>
            {!showGuide && (
                <Button type="secondary" size="small" icon={<IconLightBulb />} onClick={toggleGuide}>
                    Show guide
                </Button>
            )}
        </div>
    )

    const stepper = (
        <div className="flex justify-center">
            <ExperimentWizardStepper
                currentStep={currentStep}
                onStepClick={setStep}
                stepErrors={stepValidationErrors}
            />
        </div>
    )

    const body = (
        <div className="bg-surface-primary border border-border rounded-lg p-6">
            {currentStep === 'about' && <AboutStep />}
            {currentStep === 'variants' && <VariantsStep />}
            {currentStep === 'analytics' && <AnalyticsStep />}
        </div>
    )

    const footer = (
        <>
            <div className="flex items-center justify-between">
                <div>
                    {!isFirstStep && (
                        <Button type="secondary" onClick={prevStep}>
                            Back
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {isLastStep ? (
                        <Button
                            type="primary"
                            onClick={saveExperiment}
                            loading={isExperimentSubmitting}
                            disabledReason={hasFormErrors ? 'Please fix all errors before saving' : undefined}
                        >
                            Save as draft
                        </Button>
                    ) : (
                        <Button type="primary" onClick={nextStep}>
                            Continue
                        </Button>
                    )}
                </div>
            </div>

            <div className="text-center text-xs text-muted">
                <p>
                    Looking for no-code? They are created using the toolbar,{' '}
                    <Link
                        target="_blank"
                        targetBlankIcon
                        to="https://hanzo.ai/docs/experiments/no-code-web-experiments"
                    >
                        see no-code docs
                    </Link>
                </p>
            </div>
        </>
    )

    return (
        <div className="flex-1 bg-bg-light">
            <div className={cn('mx-auto px-6 py-6 space-y-6', showGuide ? 'max-w-5xl' : 'max-w-3xl')}>
                {header}

                {showGuide ? (
                    <div className="grid grid-cols-[1fr_280px] gap-6">
                        <div className="space-y-6">
                            {stepper}
                            {body}
                            {footer}
                        </div>
                        <ExperimentWizardGuide />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {stepper}
                        {body}
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
