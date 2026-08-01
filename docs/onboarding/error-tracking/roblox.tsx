import { OnboardingComponentsContext, createInstallation } from 'scenes/onboarding/shared/OnboardingDocsContentWrapper'

import { StepDefinition } from '../steps'

export const getRobloxSteps = (ctx: OnboardingComponentsContext): StepDefinition[] => {
    const { CodeBlock, Markdown, dedent } = ctx

    return [
        {
            title: 'Install the Roblox SDK',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            Install Insights through Wally, or download the latest \`insights-roblox.rbxm\` from the [SDK releases](https://github.com/Insights/insights-roblox/releases) and insert it into \`ReplicatedStorage\`.

                            For Wally and Rojo, add this dependency and run \`wally install\`:
                        `}
                    </Markdown>
                    <CodeBlock
                        language="toml"
                        code={dedent`
                            [dependencies]
                            Insights = "insights/insights-roblox@0.1.7"
                        `}
                    />
                    <Markdown>
                        {dedent`
                            Then map the installed package into \`ReplicatedStorage\` in your Rojo project file:
                        `}
                    </Markdown>
                    <CodeBlock
                        language="json"
                        code={dedent`
                            "ReplicatedStorage": {
                                "$className": "ReplicatedStorage",
                                "Insights": { "$path": "Packages/Insights" }
                            }
                        `}
                    />
                    <Markdown>
                        {dedent`
                            In Studio, enable **Game Settings > Security > Allow HTTP Requests**.
                        `}
                    </Markdown>
                </>
            ),
        },
        {
            title: 'Configure Insights',
            badge: 'required',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            Initialize Insights once from a server \`Script\`. Exception autocapture is enabled by default.
                        `}
                    </Markdown>
                    <CodeBlock
                        language="lua"
                        code={dedent`
                            local ReplicatedStorage = game:GetService("ReplicatedStorage")
                            local Insights = require(ReplicatedStorage:WaitForChild("Insights"))

                            Insights:Init({
                                apiKey = "<ph_project_token>",
                                host = "<ph_client_api_host>",
                                captureErrors = true,
                                errorDebounceSeconds = 1,
                            })
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Capture handled exceptions',
            badge: 'optional',
            content: (
                <>
                    <Markdown>
                        {dedent`
                            The SDK automatically listens for unhandled server errors. Require it from a \`LocalScript\` to relay unhandled client errors to the server. Call \`CaptureException\` for handled errors.
                        `}
                    </Markdown>
                    <CodeBlock
                        language="lua"
                        code={dedent`
                            local capturedMessage
                            local ok, capturedTraceback = xpcall(
                                function()
                                    saveGame(player)
                                end,
                                function(errorMessage)
                                    capturedMessage = tostring(errorMessage)
                                    return debug.traceback(capturedMessage, 2)
                                end
                            )

                            if not ok then
                                Insights:CaptureException(player, capturedMessage, capturedTraceback, {
                                    flow = "save_game",
                                })
                            end
                        `}
                    />
                </>
            ),
        },
        {
            title: 'Verify error tracking',
            badge: 'recommended',
            checkpoint: true,
            content: (
                <>
                    <Markdown>
                        {dedent`
                            Raise a test error from a server \`Script\` and confirm it appears in [Error tracking](https://app.hanzo.ai/error_tracking).
                        `}
                    </Markdown>
                    <CodeBlock language="lua" code='error("Automatic test exception from Roblox")' />
                </>
            ),
        },
    ]
}

export const RobloxInstallation = createInstallation(getRobloxSteps)
