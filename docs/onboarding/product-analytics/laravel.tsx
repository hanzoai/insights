import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getLaravelSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    return [
        {
            title: 'Install the package',
            badge: 'required',
            content: (
                <>
                    <Markdown>Install the Insights PHP library using Composer:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'bash',
                                file: 'Terminal',
                                code: dedent`
                                composer require insights/insights-php
                            `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Configure Insights',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        Initialize Insights in the `boot` method of `app/Providers/AppServiceProvider.php`:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'php',
                                file: 'app/Providers/AppServiceProvider.php',
                                code: dedent`
                                <?php

                                namespace App\\Providers;

                                use Illuminate\\Support\\ServiceProvider;
                                use Insights\\Insights;

                                class AppServiceProvider extends ServiceProvider
                                {
                                    public function boot(): void
                                    {
                                        Insights::init(
                                            '<ph_project_api_key>',
                                            [
                                                'host' => '<ph_client_api_host>'
                                            ]
                                        );
                                    }
                                }
                            `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Send events',
            badge: 'optional',
            content: (
                <>
                    <Markdown>Capture custom events using the Insights client:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'php',
                                file: 'PHP',
                                code: dedent`
                                Insights::capture([
                                    'distinctId' => 'test-user',
                                    'event' => 'test-event',
                                ]);
                            `,
                            },
                        ]}
                    />
                </>
            ),
        },
    ]
}

export const LaravelInstallation = createInstallation(getLaravelSteps)
