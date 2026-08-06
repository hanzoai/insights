import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'
import { DEFAULT_SNIPPET_METHODS, snippetFunctions } from './_snippets/js-snippet-builder'
import { SDK_DEFAULTS_DATE } from './_snippets/sdkDefaults'

export const getFlutterSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, Tab, dedent } = ctx

    return [
        {
            title: 'Install the package',
            badge: 'required',
            content: (
                <>
                    <Markdown>Add the Insights Flutter SDK to your `pubspec.yaml`:</Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'yaml',
                                file: 'pubspec.yaml',
                                code: dedent`
                                    insights_flutter: ^5.24.0
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
        {
            title: 'Platform setup',
            badge: 'required',
            content: (
                <Tab.Group tabs={['Android', 'iOS/macOS', 'Web']}>
                    <Tab.Panels>
                        <Tab.Panel>
                            <Markdown>Add these values to your `AndroidManifest.xml`:</Markdown>
                            <CodeBlock
                                blocks={[
                                    {
                                        language: 'xml',
                                        file: 'android/app/src/main/AndroidManifest.xml',
                                        code: dedent`
                                          <application>
                                            <activity>
                                              [...]
                                            </activity>
                                            <meta-data android:name="com.insights.insights.PROJECT_TOKEN" android:value="<ph_project_token>" />
                                            <meta-data android:name="com.insights.insights.INSIGHTS_HOST" android:value="<ph_client_api_host>" />
                                            <meta-data android:name="com.insights.insights.TRACK_APPLICATION_LIFECYCLE_EVENTS" android:value="true" />
                                            <meta-data android:name="com.insights.insights.DEBUG" android:value="true" />
                                          </application>
                                        `,
                                    },
                                ]}
                            />
                            <Markdown>
                                Update the minimum Android SDK version to **21** in `android/app/build.gradle`:
                            </Markdown>
                            <CodeBlock
                                blocks={[
                                    {
                                        language: 'groovy',
                                        file: 'android/app/build.gradle',
                                        code: dedent`
                                          defaultConfig {
                                            minSdkVersion 23
                                            // rest of your config
                                          }
                                        `,
                                    },
                                ]}
                            />
                        </Tab.Panel>
                        <Tab.Panel>
                            <Markdown>Add these values to your `Info.plist`:</Markdown>
                            <CodeBlock
                                blocks={[
                                    {
                                        language: 'xml',
                                        file: 'ios/Runner/Info.plist',
                                        code: dedent`
                                          <dict>
                                            [...]
                                            <key>com.insights.insights.PROJECT_TOKEN</key>
                                            <string><ph_project_token></string>
                                            <key>com.insights.insights.INSIGHTS_HOST</key>
                                            <string><ph_client_api_host></string>
                                            <key>com.insights.insights.CAPTURE_APPLICATION_LIFECYCLE_EVENTS</key>
                                            <true/>
                                            <key>com.insights.insights.DEBUG</key>
                                            <true/>
                                          </dict>
                                        `,
                                    },
                                ]}
                            />
                            <Markdown>Update the minimum platform version to iOS 13.0 in your `Podfile`:</Markdown>
                            <CodeBlock
                                blocks={[
                                    {
                                        language: 'ruby',
                                        file: 'Podfile',
                                        code: dedent`
                                          platform :ios, '13.0'
                                          # rest of your config
                                        `,
                                    },
                                ]}
                            />
                        </Tab.Panel>
                        <Tab.Panel>
                            <Markdown>Add these values in `index.html`:</Markdown>
                            <CodeBlock
                                blocks={[
                                    {
                                        language: 'html',
                                        file: 'web/index.html',
                                        code: dedent`
                                          <!DOCTYPE html>
                                          <html>
                                            <head>
                                              ...
                                              <script>
                                                ${snippetFunctions(DEFAULT_SNIPPET_METHODS)}
                                                insights.init('<ph_project_token>', {
                                                    api_host: '<ph_client_api_host>',
                                                    defaults: '${SDK_DEFAULTS_DATE}',
                                                })
                                              </script>
                                            </head>
                                            <body>
                                              ...
                                            </body>
                                          </html>
                                        `,
                                    },
                                ]}
                            />
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            ),
        },
        {
            title: 'Send events',
            badge: 'recommended',
            content: (
                <>
                    <Markdown>
                        Once installed, Insights will automatically start capturing events. You can also manually send
                        events to test your integration:
                    </Markdown>
                    <CodeBlock
                        blocks={[
                            {
                                language: 'dart',
                                file: 'Dart',
                                code: dedent`
                                    import 'package:insights_flutter/insights_flutter.dart';

                                    await Insights().capture(
                                        eventName: 'button_clicked',
                                        properties: {
                                          'button_name': 'signup'
                                        }
                                    );
                                `,
                            },
                        ]}
                    />
                </>
            ),
        },
    ]
}

export const FlutterInstallation = createInstallation(getFlutterSteps)
