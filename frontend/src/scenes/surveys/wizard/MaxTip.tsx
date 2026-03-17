import { useState } from 'react'

import { DetectiveMascot, MicrophoneMascot, ProfessorMascot, StarMascot } from 'lib/components/mascots'

import { WizardStep } from './surveyWizardLogic'

interface Tip {
    text: string
    Icon: typeof MicrophoneMascot
}

// Tips focused on increasing survey completion rates
const TIPS_BY_STEP: Record<WizardStep, Tip[]> = {
    template: [
        {
            text: 'NPS is best for measuring overall loyalty. Use it quarterly for meaningful trends.',
            Icon: StarMascot,
        },
        {
            text: 'CSAT works great after specific interactions — support, purchase, feature use.',
            Icon: ProfessorMascot,
        },
        {
            text: 'PMF surveys help identify your most valuable users and understand your market fit.',
            Icon: DetectiveMascot,
        },
    ],
    questions: [
        {
            text: 'Shorter surveys get more completions. Every extra question is a chance for someone to drop off.',
            Icon: ProfessorMascot,
        },
        { text: 'Lead with your most important question — some users only answer the first one.', Icon: StarMascot },
        {
            text: 'Rating scales are easier to answer than open text. Save open-ended questions for the end.',
            Icon: MicrophoneMascot,
        },
        {
            text: 'Make your first question dead simple. Save harder questions for engaged respondents.',
            Icon: ProfessorMascot,
        },
        { text: 'Be specific: "How was checkout?" beats "How was your experience?"', Icon: StarMascot },
        { text: 'Every field is friction. Only ask what you truly need to know.', Icon: DetectiveMascot },
    ],
    where: [
        { text: 'Surveys work best after someone takes an action — signup, purchase, feature use.', Icon: StarMascot },
        { text: "Landing pages are usually too early. Users haven't formed opinions yet.", Icon: DetectiveMascot },
        { text: 'Returning visitors are more likely to respond than first-time visitors.', Icon: ProfessorMascot },
        {
            text: 'Exit-intent surveys on pricing pages can capture valuable "why not buy" feedback.',
            Icon: DetectiveMascot,
        },
        {
            text: 'Show NPS surveys after users have experienced value, not immediately after signup.',
            Icon: StarMascot,
        },
        {
            text: 'Dashboard and settings pages catch users who are already engaged with your product.',
            Icon: MicrophoneMascot,
        },
    ],
    when: [
        {
            text: 'Give users a moment to orient before showing a survey. Immediate popups get dismissed reflexively.',
            Icon: ProfessorMascot,
        },
        { text: 'Trigger after success moments — completed tasks, achieved goals, resolved issues.', Icon: StarMascot },
        { text: 'Avoid interrupting active workflows. Survey during natural pauses instead.', Icon: DetectiveMascot },
        {
            text: 'Event-based triggers tend to catch users at better moments than time-based ones.',
            Icon: MicrophoneMascot,
        },
        {
            text: 'Good trigger moments: after purchase, finishing onboarding, or resolving a support ticket.',
            Icon: StarMascot,
        },
        {
            text: "Don't survey the same person too often. Quality drops when users feel over-surveyed.",
            Icon: ProfessorMascot,
        },
    ],
    appearance: [
        {
            text: 'Match your brand colors for a cohesive experience. Surveys that look native get more responses.',
            Icon: StarMascot,
        },
        {
            text: 'Dark themes work great for developer tools and evening products. Light themes feel friendlier.',
            Icon: ProfessorMascot,
        },
        {
            text: 'High contrast between buttons and background makes the next action obvious.',
            Icon: DetectiveMascot,
        },
    ],
    success: [],
}

interface MaxTipProps {
    step: WizardStep
}

export function MaxTip({ step }: MaxTipProps): JSX.Element | null {
    const tips = TIPS_BY_STEP[step]

    // Pick a random tip index once when the component mounts for this step
    const [tipIndices] = useState<Record<string, number>>(() => ({
        template: Math.floor(Math.random() * TIPS_BY_STEP.template.length),
        questions: Math.floor(Math.random() * TIPS_BY_STEP.questions.length),
        where: Math.floor(Math.random() * TIPS_BY_STEP.where.length),
        when: Math.floor(Math.random() * TIPS_BY_STEP.when.length),
        appearance: Math.floor(Math.random() * TIPS_BY_STEP.appearance.length),
    }))

    const selectedTip = tips?.[tipIndices[step]] ?? null

    if (!selectedTip) {
        return null
    }

    const { text, Icon } = selectedTip

    return (
        <div className="flex items-center justify-center gap-3 mt-10 pt-6 border-t border-border">
            <div className="flex-shrink-0 opacity-80">
                <Icon className="w-10 h-10" />
            </div>
            <span className="text-xs text-muted">{text}</span>
        </div>
    )
}
