import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

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
                                    insights_flutter: ^5.0.0
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
                                            <meta-data android:name="com.insights.insights.API_KEY" android:value="<ph_project_api_key>" />
                                            <meta-data android:name="com.insights.insights.INSIGHTS_HOST" android:value="<ph_client_api_host>" />
                                            <meta-data android:name="com.insights.insights.TRACK_APPLICATION_LIFECYCLE_EVENTS" android:value="true" />
                                            <meta-data android:name="com.insights.insights.DEBUG" android:value="true" />
                                          </application>
                                        `,
                                    },
                                ]}
                            />
                            <Markdown>Update the minimum Android SDK version to **21** in `android/app/build.gradle`:</Markdown>
                            <CodeBlock
                                blocks={[
                                    {
                                        language: 'groovy',
                                        file: 'android/app/build.gradle',
                                        code: dedent`
                                          defaultConfig {
                                            minSdkVersion 21
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
                                            <key>com.insights.insights.API_KEY</key>
                                            <string><ph_project_api_key></string>
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
                                                !function(t,e){var o,n,p,r;e.__SV||(window.insights=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.hanzo.ai","-assets.i.hanzo.ai")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="insights",u.people=u.people||[],u.toString=function(t){var e="insights";return"insights"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identify setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags resetGroups onFeatureFlags addFeatureFlagsHandler onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.insights||[]);
                                                insights.init('<ph_project_api_key>', {
                                                    api_host: '<ph_client_api_host>',
                                                    defaults: '2026-01-30',
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
