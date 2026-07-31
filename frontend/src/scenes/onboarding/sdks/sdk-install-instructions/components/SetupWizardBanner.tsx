import { useValues } from 'kea'

import { Divider } from '@hanzo/elements'

import { Language } from 'lib/components/CodeSnippet'
import { CodeSnippet } from 'lib/components/CodeSnippet'
import { Banner } from 'lib/elements/Banner'
import { Tag } from 'lib/elements/Tag'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

import { Region } from '~/types'

export function useWizardCommand(): { wizardCommand: string; isCloudOrDev: boolean } {
    const { preflight, isCloudOrDev } = useValues(preflightLogic)
    const region = preflight?.region || Region.US
    return {
        wizardCommand: `npx -y @hanzo/wizard@latest${region === Region.EU ? ' --region eu' : ''}`,
        isCloudOrDev: isCloudOrDev ?? false,
    }
}

const SetupWizardBanner = ({
    integrationName,
    hide,
}: {
    integrationName: string
    hide?: boolean
}): JSX.Element | null => {
    const { wizardCommand, isCloudOrDev } = useWizardCommand()

    if (hide || !isCloudOrDev) {
        return null
    }

    return (
        <>
            <h2>Automated installation</h2>
            <Banner type="info" hideIcon={true}>
                <h3 className="flex items-center gap-2 pb-1">
                    <Tag type="warning">BETA</Tag> AI setup wizard
                </h3>
                <div className="flex flex-col p-2">
                    <p className="font-normal pb-1">Try using the AI setup wizard to automatically install Insights.</p>
                    <p className="font-normal pb-2">
                        Run the following command from the root of your {integrationName} project.
                    </p>
                    <CodeSnippet language={Language.Bash}>{wizardCommand}</CodeSnippet>
                </div>
            </Banner>
            <Divider label="OR" />
            <h2>Manual installation</h2>
        </>
    )
}

export default SetupWizardBanner
