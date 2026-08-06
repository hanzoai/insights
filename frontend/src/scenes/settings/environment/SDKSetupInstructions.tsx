import { useValues } from 'kea'
import { useMemo, useState } from 'react'

import { Button, Modal, Select, SelectSection, Skeleton } from '@hanzo/elements'
import {
    APIInstallation,
    AndroidInstallation,
    AngularInstallation,
    AstroInstallation,
    BubbleInstallation,
    DjangoInstallation,
    DocusaurusInstallation,
    ElixirInstallation,
    FlutterInstallation,
    FramerInstallation,
    GoInstallation,
    GoogleTagManagerInstallation,
    IOSInstallation,
    LaravelInstallation,
    NextJSInstallation,
    NodeEventCapture,
    NodeJSInstallation,
    NuxtInstallation,
    PHPInstallation,
    PythonEventCapture,
    PythonInstallation,
    ReactInstallation,
    ReactNativeInstallation,
    ReactRouterInstallation,
    RemixInstallation,
    RubyInstallation,
    RubyOnRailsInstallation,
    SvelteInstallation,
    TanStackInstallation,
    VueInstallation,
    WebInstallation,
    WebflowInstallation,
} from '@hanzo/shared-onboarding/product-analytics'
import type { StepDefinition } from '@hanzo/shared-onboarding/steps'

import { Link } from 'lib/elements/Link'
import { JS_WEB_SNIPPETS } from 'scenes/onboarding/shared/jsWebSnippets'
import { OnboardingDocsContentWrapper } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'
import SetupWizardBanner from 'scenes/onboarding/shared/SetupWizardBanner'
import { teamLogic } from 'scenes/teamLogic'

import { SDKKey } from '~/types'
const NODE_SNIPPETS = { NodeEventCapture }
const PYTHON_SNIPPETS = { PythonEventCapture }

export const filterToFirstRequiredStep = (steps: StepDefinition[]): StepDefinition[] => {
    const first = steps.find((s) => s.badge === 'required')
    return first ? [first] : steps.slice(0, 1)
}

export const filterRequiredSteps = (steps: StepDefinition[]): StepDefinition[] =>
    steps.filter((s) => s.badge === 'required')

export type SDKCategory = 'web' | 'mobile' | 'server' | 'integration'

interface SDKConfig {
    Installation: React.ComponentType<{ modifySteps?: (steps: StepDefinition[]) => StepDefinition[] }>
    snippets?: Record<string, React.ComponentType>
    wizardIntegrationName?: string
    docsLink: string
    name: string
    category: SDKCategory
    popular?: boolean
}

export const SDK_CONFIGS: { [key in SDKKey]?: SDKConfig } = {
    // Popular
    [SDKKey.JS_WEB]: {
        Installation: WebInstallation,
        snippets: JS_WEB_SNIPPETS,
        name: 'Web',
        docsLink: 'https://hanzo.ai/docs/libraries/js',
        category: 'web',
        popular: true,
    },
    [SDKKey.REACT]: {
        Installation: ReactInstallation,
        snippets: JS_WEB_SNIPPETS,
        wizardIntegrationName: 'React',
        name: 'React',
        docsLink: 'https://hanzo.ai/docs/libraries/react',
        category: 'web',
        popular: true,
    },
    [SDKKey.NEXT_JS]: {
        Installation: NextJSInstallation,
        snippets: JS_WEB_SNIPPETS,
        wizardIntegrationName: 'Next.js',
        name: 'Next.js',
        docsLink: 'https://hanzo.ai/docs/libraries/next-js',
        category: 'web',
        popular: true,
    },
    [SDKKey.NODE_JS]: {
        Installation: NodeJSInstallation,
        snippets: NODE_SNIPPETS,
        name: 'Node.js',
        docsLink: 'https://hanzo.ai/docs/libraries/node',
        category: 'server',
        popular: true,
    },
    [SDKKey.PYTHON]: {
        Installation: PythonInstallation,
        snippets: PYTHON_SNIPPETS,
        name: 'Python',
        docsLink: 'https://hanzo.ai/docs/libraries/python',
        category: 'server',
        popular: true,
    },
    [SDKKey.REACT_NATIVE]: {
        Installation: ReactNativeInstallation,
        wizardIntegrationName: 'React Native',
        name: 'React Native',
        docsLink: 'https://hanzo.ai/docs/libraries/react-native',
        category: 'mobile',
        popular: true,
    },

    // Web
    [SDKKey.ANGULAR]: {
        Installation: AngularInstallation,
        snippets: JS_WEB_SNIPPETS,
        name: 'Angular',
        docsLink: 'https://hanzo.ai/docs/libraries/angular',
        category: 'web',
    },
    [SDKKey.ASTRO]: {
        Installation: AstroInstallation,
        snippets: JS_WEB_SNIPPETS,
        wizardIntegrationName: 'Astro',
        name: 'Astro',
        docsLink: 'https://hanzo.ai/docs/libraries/astro',
        category: 'web',
    },
    [SDKKey.BUBBLE]: {
        Installation: BubbleInstallation,
        snippets: JS_WEB_SNIPPETS,
        name: 'Bubble',
        docsLink: 'https://hanzo.ai/docs/libraries/bubble',
        category: 'web',
    },
    [SDKKey.FRAMER]: {
        Installation: FramerInstallation,
        snippets: JS_WEB_SNIPPETS,
        name: 'Framer',
        docsLink: 'https://hanzo.ai/docs/libraries/framer',
        category: 'web',
    },
    [SDKKey.NUXT_JS]: {
        Installation: NuxtInstallation,
        snippets: JS_WEB_SNIPPETS,
        name: 'Nuxt.js',
        docsLink: 'https://hanzo.ai/docs/libraries/nuxt-js',
        category: 'web',
    },
    [SDKKey.REACT_ROUTER]: {
        Installation: ReactRouterInstallation,
        snippets: JS_WEB_SNIPPETS,
        name: 'React Router',
        docsLink: 'https://hanzo.ai/docs/libraries/react-router',
        category: 'web',
    },
    [SDKKey.REMIX]: {
        Installation: RemixInstallation,
        snippets: JS_WEB_SNIPPETS,
        name: 'Remix',
        docsLink: 'https://hanzo.ai/docs/libraries/remix',
        category: 'web',
    },
    [SDKKey.SVELTE]: {
        Installation: SvelteInstallation,
        snippets: JS_WEB_SNIPPETS,
        wizardIntegrationName: 'Svelte',
        name: 'Svelte',
        docsLink: 'https://hanzo.ai/docs/libraries/svelte',
        category: 'web',
    },
    [SDKKey.TANSTACK_START]: {
        Installation: TanStackInstallation,
        snippets: JS_WEB_SNIPPETS,
        name: 'TanStack Start',
        docsLink: 'https://hanzo.ai/docs/libraries/react',
        category: 'web',
    },
    [SDKKey.VUE_JS]: {
        Installation: VueInstallation,
        snippets: JS_WEB_SNIPPETS,
        name: 'Vue.js',
        docsLink: 'https://hanzo.ai/docs/libraries/vue-js',
        category: 'web',
    },
    [SDKKey.WEBFLOW]: {
        Installation: WebflowInstallation,
        snippets: JS_WEB_SNIPPETS,
        name: 'Webflow',
        docsLink: 'https://hanzo.ai/docs/libraries/webflow',
        category: 'web',
    },

    // Mobile
    [SDKKey.ANDROID]: {
        Installation: AndroidInstallation,
        name: 'Android',
        docsLink: 'https://hanzo.ai/docs/libraries/android',
        category: 'mobile',
    },
    [SDKKey.FLUTTER]: {
        Installation: FlutterInstallation,
        name: 'Flutter',
        docsLink: 'https://hanzo.ai/docs/libraries/flutter',
        category: 'mobile',
    },
    [SDKKey.IOS]: {
        Installation: IOSInstallation,
        name: 'iOS',
        docsLink: 'https://hanzo.ai/docs/libraries/ios',
        category: 'mobile',
    },

    // Server
    [SDKKey.DJANGO]: {
        Installation: DjangoInstallation,
        snippets: PYTHON_SNIPPETS,
        wizardIntegrationName: 'Django',
        name: 'Django',
        docsLink: 'https://hanzo.ai/docs/libraries/django',
        category: 'server',
    },
    [SDKKey.ELIXIR]: {
        Installation: ElixirInstallation,
        name: 'Elixir',
        docsLink: 'https://hanzo.ai/docs/libraries/elixir',
        category: 'server',
    },
    [SDKKey.GO]: {
        Installation: GoInstallation,
        name: 'Go',
        docsLink: 'https://hanzo.ai/docs/libraries/go',
        category: 'server',
    },
    [SDKKey.LARAVEL]: {
        Installation: LaravelInstallation,
        name: 'Laravel',
        docsLink: 'https://hanzo.ai/docs/libraries/laravel',
        category: 'server',
    },
    [SDKKey.PHP]: {
        Installation: PHPInstallation,
        name: 'PHP',
        docsLink: 'https://hanzo.ai/docs/libraries/php',
        category: 'server',
    },
    [SDKKey.RUBY]: {
        Installation: RubyInstallation,
        name: 'Ruby',
        docsLink: 'https://hanzo.ai/docs/libraries/ruby',
        category: 'server',
    },
    [SDKKey.RUBY_ON_RAILS]: {
        Installation: RubyOnRailsInstallation,
        name: 'Ruby on Rails',
        docsLink: 'https://hanzo.ai/docs/libraries/rails',
        category: 'server',
    },

    // Integrations
    [SDKKey.API]: {
        Installation: APIInstallation,
        name: 'API',
        docsLink: 'https://hanzo.ai/docs/api',
        category: 'integration',
    },
    [SDKKey.DOCUSAURUS]: {
        Installation: DocusaurusInstallation,
        name: 'Docusaurus',
        docsLink: 'https://hanzo.ai/docs/libraries/docusaurus',
        category: 'integration',
    },
    [SDKKey.GOOGLE_TAG_MANAGER]: {
        Installation: GoogleTagManagerInstallation,
        snippets: JS_WEB_SNIPPETS,
        name: 'Google Tag Manager',
        docsLink: 'https://hanzo.ai/docs/libraries/google-tag-manager',
        category: 'integration',
    },
}

const CATEGORY_TITLES: Record<SDKCategory, string> = {
    web: 'Web',
    mobile: 'Mobile',
    server: 'Server',
    integration: 'Integrations',
}

export function buildSDKSelectOptions(categories?: SDKCategory[]): SelectSection<SDKKey>[] {
    const entries = Object.entries(SDK_CONFIGS) as [SDKKey, SDKConfig][]
    const filtered = categories ? entries.filter(([_, c]) => categories.includes(c.category)) : entries

    const groups: SelectSection<SDKKey>[] = []

    const popular = filtered.filter(([_, c]) => c.popular)
    if (popular.length > 0) {
        groups.push({ title: 'Popular', options: popular.map(([k, c]) => ({ value: k, label: c.name })) })
    }

    for (const cat of ['web', 'mobile', 'server', 'integration'] as const) {
        if (categories && !categories.includes(cat)) {
            continue
        }
        const items = filtered.filter(([_, c]) => c.category === cat && !c.popular)
        if (items.length > 0) {
            groups.push({ title: CATEGORY_TITLES[cat], options: items.map(([k, c]) => ({ value: k, label: c.name })) })
        }
    }

    return groups
}

// Derived purely from the static SDK_CONFIGS, so compute once at module scope rather than rebuilding
// a fresh options array (new identity) on every render.
const ALL_SDK_SELECT_OPTIONS = buildSDKSelectOptions()

export function SDKSetupInstructions(): JSX.Element {
    const { currentTeam, currentTeamLoading } = useValues(teamLogic)
    const [selectedSDK, setSelectedSDK] = useState<SDKKey>(SDKKey.JS_WEB)
    const [showFullSetup, setShowFullSetup] = useState(false)

    const config = useMemo(() => SDK_CONFIGS[selectedSDK], [selectedSDK])

    if (currentTeamLoading && !currentTeam) {
        return (
            <div className="space-y-4">
                <Skeleton className="w-1/2 h-4" />
                <Skeleton repeat={3} />
            </div>
        )
    }

    if (!config) {
        return <></>
    }

    const { Installation, snippets, wizardIntegrationName, docsLink, name, category } = config
    const isClientSideSDK = category === 'web' || category === 'mobile'

    return (
        <div className="space-y-4 max-w-200">
            <Select
                value={selectedSDK}
                onChange={(value) => {
                    setSelectedSDK(value)
                    setShowFullSetup(false)
                }}
                options={ALL_SDK_SELECT_OPTIONS}
                className="max-w-80"
            />
            <OnboardingDocsContentWrapper snippets={snippets} minimal useReverseProxy={isClientSideSDK}>
                <Installation modifySteps={filterToFirstRequiredStep} />
            </OnboardingDocsContentWrapper>
            <div className="flex items-center gap-2">
                <Button type="secondary" size="small" onClick={() => setShowFullSetup(true)}>
                    View full setup instructions
                </Button>
                <Link to={docsLink} target="_blank" className="text-sm">
                    {name} docs
                </Link>
            </div>
            <Modal
                isOpen={showFullSetup}
                onClose={() => setShowFullSetup(false)}
                title={`${name} setup`}
                width={640}
            >
                {wizardIntegrationName && <SetupWizardBanner integrationName={wizardIntegrationName} />}
                <OnboardingDocsContentWrapper snippets={snippets} useReverseProxy={isClientSideSDK}>
                    <Installation modifySteps={filterRequiredSteps} />
                </OnboardingDocsContentWrapper>
                <div className="mt-4">
                    <Link to={docsLink} target="_blank">
                        View full {name} documentation
                    </Link>
                </div>
            </Modal>
        </div>
    )
}
