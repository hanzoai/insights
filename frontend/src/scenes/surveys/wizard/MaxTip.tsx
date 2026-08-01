import { ComponentType, useState } from 'react'

import * as einsteinPng from '@hanzo/brand/hoggies/png/einstein'
import * as magnifyingGlassPng from '@hanzo/brand/hoggies/png/magnifying-glass-1'
import * as reporterPng from '@hanzo/brand/hoggies/png/reporter'

import { pngHoggie } from 'lib/brand/hoggies'
import { StarHog } from 'lib/components/mascots'

import { WizardStep } from './surveyWizardLogic'

const MascotEinstein = pngHoggie(einsteinPng)
const MascotMagnifyingGlass = pngHoggie(magnifyingGlassPng)
const MascotReporter = pngHoggie(reporterPng)

interface Tip {
    text: string
    Script: ComponentType<{ className?: string }>
}

// Tips focused on increasing survey completion rates
const TIPS_BY_STEP: Record<WizardStep, Tip[]> = {
    template: [
        { text: 'NPS is best for measuring overall loyalty. Use it quarterly for meaningful trends.', Script: StarHog },
        {
            text: 'CSAT works great after specific interactions — support, purchase, feature use.',
            Script: MascotEinstein,
        },
        {
            text: 'PMF surveys help identify your most valuable users and understand your market fit.',
            Script: MascotMagnifyingGlass,
        },
    ],
    questions: [
        {
            text: 'Shorter surveys get more completions. Every extra question is a chance for someone to drop off.',
            Script: MascotEinstein,
        },
        { text: 'Lead with your most important question — some users only answer the first one.', Script: StarHog },
        {
            text: 'Rating scales are easier to answer than open text. Save open-ended questions for the end.',
            Script: MascotReporter,
        },
        {
            text: 'Make your first question dead simple. Save harder questions for engaged respondents.',
            Script: MascotEinstein,
        },
        { text: 'Be specific: "How was checkout?" beats "How was your experience?"', Script: StarHog },
        { text: 'Every field is friction. Only ask what you truly need to know.', Script: MascotMagnifyingGlass },
    ],
    where: [
        { text: 'Surveys work best after someone takes an action — signup, purchase, feature use.', Script: StarHog },
        {
            text: "Landing pages are usually too early. Users haven't formed opinions yet.",
            Script: MascotMagnifyingGlass,
        },
        { text: 'Returning visitors are more likely to respond than first-time visitors.', Script: MascotEinstein },
        {
            text: 'Exit-intent surveys on pricing pages can capture valuable "why not buy" feedback.',
            Script: MascotMagnifyingGlass,
        },
        { text: 'Show NPS surveys after users have experienced value, not immediately after signup.', Script: StarHog },
        {
            text: 'Dashboard and settings pages catch users who are already engaged with your product.',
            Script: MascotReporter,
        },
    ],
    when: [
        {
            text: 'Give users a moment to orient before showing a survey. Immediate popups get dismissed reflexively.',
            Script: MascotEinstein,
        },
        { text: 'Trigger after success moments — completed tasks, achieved goals, resolved issues.', Script: StarHog },
        {
            text: 'Avoid interrupting active workflows. Survey during natural pauses instead.',
            Script: MascotMagnifyingGlass,
        },
        {
            text: 'Event-based triggers tend to catch users at better moments than time-based ones.',
            Script: MascotReporter,
        },
        {
            text: 'Good trigger moments: after purchase, finishing onboarding, or resolving a support ticket.',
            Script: StarHog,
        },
        {
            text: "Don't survey the same person too often. Quality drops when users feel over-surveyed.",
            Script: MascotEinstein,
        },
    ],
    appearance: [
        {
            text: 'Match your brand colors for a cohesive experience. Surveys that look native get more responses.',
            Script: StarHog,
        },
        {
            text: 'Dark themes work great for developer tools and evening products. Light themes feel friendlier.',
            Script: MascotEinstein,
        },
        {
            text: 'High contrast between buttons and background makes the next action obvious.',
            Script: MascotMagnifyingGlass,
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

    const { text, Script } = selectedTip

    return (
        <div className="flex items-center justify-center gap-3 mt-10 pt-6 border-t border-border">
            <div className="flex-shrink-0 opacity-80">
                <Script className="w-10 h-10" />
            </div>
            <span className="text-xs text-muted">{text}</span>
        </div>
    )
}
