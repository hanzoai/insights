import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getDotNetSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    const installStep: StepDefinition = {
        title: 'Install the package',
        badge: 'required',
        content: (
            <>
                <Markdown>Install the Insights package for your .NET app:</Markdown>
                <CodeBlock
                    blocks={[
                        {
                            language: 'bash',
                            file: 'ASP.NET Core',
                            code: dedent`
                                dotnet add package Insights.AspNetCore
                            `,
                        },
                        {
                            language: 'bash',
                            file: 'Console or worker',
                            code: dedent`
                                dotnet add package Insights
                            `,
                        },
                    ]}
                />
            </>
        ),
    }

    const configureStep: StepDefinition = {
        title: 'Configure Insights',
        badge: 'required',
        content: (
            <>
                <Markdown>Register Insights and configure your project token and host:</Markdown>
                <CodeBlock
                    blocks={[
                        {
                            language: 'csharp',
                            file: 'Program.cs',
                            code: dedent`
                                using Insights;

                                var builder = WebApplication.CreateBuilder(args);
                                builder.AddInsights();
                            `,
                        },
                        {
                            language: 'json',
                            file: 'appsettings.json',
                            code: dedent`
                                {
                                  "Insights": {
                                    "ProjectToken": "<ph_project_token>",
                                    "HostUrl": "<ph_client_api_host>"
                                  }
                                }
                            `,
                        },
                    ]}
                />
            </>
        ),
    }

    const captureStep: StepDefinition = {
        title: 'Manually capture exceptions',
        badge: 'required',
        content: (
            <>
                <Markdown>
                    {dedent`
                        Capture handled exceptions with \`CaptureException\` so they appear in Error tracking.
                    `}
                </Markdown>
                <CodeBlock
                    blocks={[
                        {
                            language: 'csharp',
                            file: 'C#',
                            code: dedent`
                                using Insights;

                                void CaptureCheckoutException(IInsightsClient insights)
                                {
                                    try
                                    {
                                        throw new InvalidOperationException("Something went wrong");
                                    }
                                    catch (Exception exception)
                                    {
                                        insights.CaptureException(
                                            exception,
                                            "user_distinct_id",
                                            new Dictionary<string, object>
                                            {
                                                ["route"] = "/checkout",
                                            },
                                            groups: null,
                                            sendFeatureFlags: false
                                        );

                                        throw;
                                    }
                                }
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
                    Confirm exception events are being captured and sent to Insights. You should see events appear in the activity feed.

                    [Check for exceptions in Insights](https://app.hanzo.ai/activity/explore)
                `}
            </Markdown>
        ),
    }

    return [installStep, configureStep, captureStep, verifyStep]
}

export const DotNetInstallation = createInstallation(getDotNetSteps)
