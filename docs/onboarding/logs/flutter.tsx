import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { getFlutterSteps as getFlutterStepsPA } from '../product-analytics/flutter'
import { StepDefinition } from '../steps'

export const getFlutterSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    const installSteps = getFlutterStepsPA(ctx)

    const sendLogStep: StepDefinition = {
        title: 'Send a log',
        badge: 'required',
        content: (
            <>
                <Markdown>
                    Capture a structured log record with `Insights().logger`. Requires `insights_flutter` 5.27.0 or later.
                    Records are batched and shipped to Insights's logs product.
                </Markdown>
                <CodeBlock
                    blocks={[
                        {
                            language: 'dart',
                            file: 'Dart',
                            code: dedent`
                                import 'package:insights_flutter/insights_flutter.dart';

                                Insights().logger.info('checkout completed', {
                                    'order_id': 'ord_789',
                                });
                            `,
                        },
                    ]}
                />
                <Markdown>
                    {dedent`
                        Logs appear in Insights within a few seconds. Use the [Logs page](https://app.hanzo.ai/logs) to search and filter
                        by service name, severity, or any attribute you attach.
                    `}
                </Markdown>
            </>
        ),
    }

    return [...installSteps, sendLogStep]
}

export const FlutterInstallation = createInstallation(getFlutterSteps)
