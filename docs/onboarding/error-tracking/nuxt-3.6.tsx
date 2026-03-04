import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { getNuxtSteps as getNuxtStepsPA } from '../product-analytics/nuxt'
import { StepDefinition } from '../steps'

export const getNuxt36Steps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    const installSteps = getNuxtStepsPA(ctx)

    const manualCaptureStep: StepDefinition = {
        title: 'Manually capturing exceptions',
        badge: 'optional',
        content: (
            <>
                <Markdown>
                    {dedent`
                        To send errors directly using the Insights client, import it and use the \`captureException\` method like this:
                    `}
                </Markdown>
                <CodeBlock
                    blocks={[
                        {
                            language: 'html',
                            file: 'Vue',
                            code: dedent`
                              <script>
                                const { $insights } = useNuxtApp()
                                if ($insights) {
                                  const insights = $insights()
                                  insights.captureException(new Error("Important error message"))
                                }
                              </script>
                            `,
                        },
                    ]}
                />
                <Markdown>
                    {dedent`
                        On the server side, you can use the \`insights\` object directly.
                    `}
                </Markdown>
                <CodeBlock
                    blocks={[
                        {
                            language: 'javascript',
                            file: 'server/api/example.js',
                            code: dedent`
                              const runtimeConfig = useRuntimeConfig()
                              const insights = new Insights(
                                runtimeConfig.public.insightsPublicKey,
                                {
                                  host: runtimeConfig.public.insightsHost,
                                }
                              );
                              try {
                                const results = await DB.query.users.findMany()
                                return results
                              } catch (error) {
                                insights.captureException(error)
                              }
                            `,
                        },
                    ]}
                />
            </>
        ),
    }

    const exceptionAutocaptureStep: StepDefinition = {
        title: 'Configuring exception autocapture',
        badge: 'recommended',
        content: (
            <>
                <Markdown>
                    {dedent`
                        Update your \`insights.client.js\` to add an error hook.
                    `}
                </Markdown>
                <CodeBlock
                    blocks={[
                        {
                            language: 'javascript',
                            file: 'JavaScript',
                            code: dedent`
                              export default defineNuxtPlugin((nuxtApp) => {
                                  ...
                                  nuxtApp.hook('vue:error', (error) => {
                                      insightsClient.captureException(error)
                                  })
                                  ...
                              })
                            `,
                        },
                    ]}
                />
            </>
        ),
    }

    const verifyStep: StepDefinition = {
        title: 'Verify error tracking',
        badge: 'recommended',
        checkpoint: true,
        content: (
            <Markdown>
                {dedent`
                    Before proceeding, let's make sure exception events are being captured and sent to Insights. You should see events appear in the activity feed.

                    [Check for exceptions in Insights](https://insights.hanzo.ai/activity/explore)
                `}
            </Markdown>
        ),
    }

    return [
        ...installSteps,
        manualCaptureStep,
        exceptionAutocaptureStep,
        verifyStep,
    ]
}

export const Nuxt36Installation = createInstallation(getNuxt36Steps)
