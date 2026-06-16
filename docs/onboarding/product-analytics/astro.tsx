import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getAstroSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent, snippets } = ctx

    const JSEventCapture = snippets?.JSEventCapture

    return [
        {
            title: 'Create the Insights component',
            badge: 'required',
            content: (
                <>
                    <Markdown>In your `src/components` folder, create a `insights.astro` file:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Terminal',
                                code: dedent`
                                    cd ./src/components
                                    # or 'cd ./src && mkdir components && cd ./components' if your components folder doesn't exist
                                    touch insights.astro
                                `,
                            },
                        ]}
                    />
                    <Markdown>
                        In this file, add your Insights web snippet. Be sure to include the `is:inline` directive to
                        prevent Astro from processing it:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'html',
                                file: 'src/components/insights.astro',
                                code: dedent`
                                    ---
                                    // src/components/insights.astro
                                    ---
                                    <script is:inline>
                                        !function(t,e){var o,n,p,r;e.__SV||(window.insights=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.hanzo.ai","-assets.i.hanzo.ai")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="insights",u.people=u.people||[],u.toString=function(t){var e="insights";return"insights"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identify setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags resetGroups onFeatureFlags addFeatureFlagsHandler onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.insights||[]);
                                        insights.init('<ph_project_api_key>', {
                                            api_host: '<ph_client_api_host>',
                                            defaults: '2026-01-30'
                                        })
                                    </script>
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Create a layout',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Create a layout where we will use `insights.astro`. Create a new file `InsightsLayout.astro` in
                        your `src/layouts` folder:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Terminal',
                                code: dedent`
                                    cd ./src/layouts
                                    # or 'cd ./src && mkdir layouts && cd ./layouts' if your layouts folder doesn't exist
                                    touch InsightsLayout.astro
                                `,
                            },
                        ]}
                    />
                    <Markdown>Add the following code to `InsightsLayout.astro`:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'html',
                                file: 'src/layouts/InsightsLayout.astro',
                                code: dedent`
                                    ---
                                    import Insights from '../components/insights.astro'
                                    ---
                                    <head>
                                        <Insights />
                                    </head>
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Use the layout in your pages',
            badge: 'required',
            content: (
                <>
                    <Markdown>Update your pages (like `index.astro`) to wrap your app with the new layout:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'html',
                                file: 'src/pages/index.astro',
                                code: dedent`
                                    ---
                                    import InsightsLayout from '../layouts/InsightsLayout.astro';
                                    ---
                                    <InsightsLayout>
                                      <!-- your existing app components -->
                                    </InsightsLayout>
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Send events',
            content: <>{JSEventCapture && <JSEventCapture />}</>,
        },
    ]
}

export const AstroInstallation = createInstallation(getAstroSteps)
