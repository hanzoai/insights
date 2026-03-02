import { useState } from 'react'

import { DetectiveHog, MicrophoneHog, ProfessorHog, StarHog } from 'lib/components/mascots'

import { WizardStep } from './surveyWizardLogic'

interface Tip {
    text: string
    Icon: typeof MicrophoneHog
}

// Tips focused on increasing survey completion rates
const TIPS_BY_STEP: Record<WizardStep, Tip[]> = {
    template: [
        { text: 'NPS is best for measuring overall loyalty. Use it quarterly for meaningful trends.', Icon: StarHog },
        { text: 'CSAT works great after specific interactions — support, purchase, feature use.', Icon: ProfessorHog },
        {
            text: 'PMF surveys help identify your most valuable users and understand your market fit.',
            Icon: DetectiveHog,
        },
    ],
    questions: [
        {
            text: 'Shorter surveys get more completions. Every extra question is a chance for someone to drop off.',
            Icon: ProfessorHog,
        },
        { text: 'Lead with your most important question — some users only answer the first one.', Icon: StarHog },
        {
            text: 'Rating scales are easier to answer than open text. Save open-ended questions for the end.',
            Icon: MicrophoneHog,
        },
        {
            text: 'Make your first question dead simple. Save harder questions for engaged respondents.',
            Icon: ProfessorHog,
        },
        { text: 'Be specific: "How was checkout?" beats "How was your experience?"', Icon: StarHog },
        { text: 'Every field is friction. Only ask what you truly need to know.', Icon: DetectiveHog },
    ],
    where: [
        { text: 'Surveys work best after someone takes an action — signup, purchase, feature use.', Icon: StarHog },
        { text: "Landing pages are usually too early. Users haven't formed opinions yet.", Icon: DetectiveHog },
        { text: 'Returning visitors are more likely to respond than first-time visitors.', Icon: ProfessorHog },
        {
            text: 'Exit-intent surveys on pricing pages can capture valuable "why not buy" feedback.',
            Icon: DetectiveHog,
        },
        { text: 'Show NPS surveys after users have experienced value, not immediately after signup.', Icon: StarHog },
        {
            text: 'Dashboard and settings pages catch users who are already engaged with your product.',
            Icon: MicrophoneHog,
        },
    ],
    when: [
        {
            text: 'Give users a moment to orient before showing a survey. Immediate popups get dismissed reflexively.',
            Icon: ProfessorHog,
        },
        { text: 'Trigger after success moments — completed tasks, achieved goals, resolved issues.', Icon: StarHog },
        { text: 'Avoid interrupting active workflows. Survey during natural pauses instead.', Icon: DetectiveHog },
        {
            text: 'Event-based triggers tend to catch users at better moments than time-based ones.',
            Icon: MicrophoneHog,
        },
        {
            text: 'Good trigger moments: after purchase, finishing onboarding, or resolving a support ticket.',
            Icon: StarHog,
        },
        {
            text: "Don't survey the same person too often. Quality drops when users feel over-surveyed.",
            Icon: ProfessorHog,
        },
    ],
    appearance: [
        {
            text: 'Match your brand colors for a cohesive experience. Surveys that look native get more responses.',
            Icon: StarHog,
        },
        {
            text: 'Dark themes work great for developer tools and evening products. Light themes feel friendlier.',
            Icon: ProfessorHog,
        },
        {
            text: 'High contrast between buttons and background makes the next action obvious.',
            Icon: DetectiveHog,
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
