import { useMDXComponents } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

export const SurveysFinalSteps = (): JSX.Element => {
    const { Markdown, dedent } = useMDXComponents()

    return (
        <Markdown>
            {dedent`
                After installing the Insights SDK, you can create your first survey.


                | Resource | Description |
                |----------|-------------|
                | [Creating surveys](https://hanzo.ai/docs/surveys/creating-surveys) | Learn how to build and customize your surveys |
                | [Targeting surveys](https://hanzo.ai/docs/surveys/targeting) | Show surveys to specific users based on properties, events, or feature flags |
                | [How to create custom surveys](https://hanzo.ai/tutorials/survey) | Build advanced survey experiences with custom code |
                | [Framework guides](https://hanzo.ai/docs/surveys/tutorials#framework-guides) | Setup guides for React, Next.js, Vue, and other frameworks |
                | [More tutorials](https://hanzo.ai/docs/surveys/tutorials) | Other real-world examples and use cases |

                You should also [identify](https://hanzo.ai/docs/product-analytics/identify) users and [capture events](https://hanzo.ai/docs/product-analytics/capture-events) with Insights to control who and when to show surveys to your users.

                Not all survey features are available on every SDK. See the [SDK feature support matrix](https://hanzo.ai/docs/surveys/sdk-feature-support) for a full comparison.
            `}
        </Markdown>
    )
}
