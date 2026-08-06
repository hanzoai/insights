import { useValues } from 'kea'
import insights from 'insights-js'

import { buildJsHtmlSnippet, SnippetOption } from '@hanzo/shared-onboarding/product-analytics'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { FEATURE_FLAGS } from 'lib/constants'
import { featureFlagLogic } from 'lib/logic/featureFlagLogic'
import { preflightLogic } from 'lib/logic/preflightLogic'
import { domainFor, proxyLogic } from 'scenes/settings/environment/proxyLogic'
import { teamLogic } from 'scenes/teamLogic'

import { SDK_DEFAULTS_DATE } from '~/loadInsightsJS'

function getInsightsMethods(): string[] {
    const methods: string[] = []
    const insightsPrototype = Object.getPrototypeOf(insights)
    for (const key of Object.getOwnPropertyNames(insightsPrototype)) {
        if (
            typeof insightsPrototype[key] === 'function' &&
            !key.startsWith('_') &&
            !['constructor', 'toString', 'push'].includes(key)
        ) {
            methods.push(key)
        }
    }
    return methods
}

export interface JsSnippetConfig {
    projectToken: string
    methods: string[]
    options: Record<string, SnippetOption>
}

export function useJsSnippetConfig(): JsSnippetConfig {
    const { currentTeam } = useValues(teamLogic)
    const { featureFlags } = useValues(featureFlagLogic)
    const { preflight } = useValues(preflightLogic)

    const { proxyRecords } = useValues(proxyLogic)
    const proxyRecord = proxyRecords[0]

    const isPersonProfilesDisabled = featureFlags[FEATURE_FLAGS.PERSONLESS_EVENTS_NOT_SUPPORTED]

    return {
        projectToken: currentTeam?.api_token ?? '',
        methods: getInsightsMethods(),
        options: {
            api_host: {
                content: domainFor(proxyRecord),
                comment: proxyRecord ? 'your managed reverse proxy domain' : undefined,
                enabled: true,
            },
            ui_host: {
                content: preflight?.site_url || window.location.origin,
                comment: "necessary because you're using a proxy, this way links will point back to Insights properly",
                enabled: !!proxyRecord,
            },
            defaults: {
                content: SDK_DEFAULTS_DATE,
                enabled: true,
            },
            person_profiles: {
                content: 'identified_only',
                comment: "or 'always' to create profiles for anonymous users as well",
                enabled: !isPersonProfilesDisabled,
            },
        },
    }
}

export function useJsSnippet(indent = 0, arrayJs?: string, scriptAttributes?: string): string {
    const { projectToken, methods, options } = useJsSnippetConfig()

    return buildJsHtmlSnippet({
        projectToken,
        methods,
        options,
        indent,
        arrayJs,
        scriptAttributes,
    })
}

export function JSSnippet(): JSX.Element {
    const snippet = useJsSnippet()

    return <CodeSnippet language={Language.HTML}>{snippet}</CodeSnippet>
}
