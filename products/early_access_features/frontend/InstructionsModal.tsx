import { useValues } from 'kea'

import { Collapse, Modal, Link } from '@hanzo/elements'

import { CodeSnippet, Language } from 'lib/components/CodeSnippet'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { urls } from 'scenes/urls'

import { FeatureFlagType } from '~/types'

interface InstructionsModalProps {
    flag: FeatureFlagType['key']
    visible: boolean
    onClose: () => void
}

export function InstructionsModal({ onClose, visible, flag }: InstructionsModalProps): JSX.Element {
    const { preflight } = useValues(preflightLogic)

    const getCloudPanels = (): JSX.Element => (
        <Collapse
            className="mt-2 bg-surface-primary"
            defaultActiveKey="1"
            panels={[
                {
                    key: '1',
                    header: 'Option 1: Widget Site App',
                    content: (
                        <div>
                            Give your users a{' '}
                            <Link to={urls.insightsFunctionNew('template-early-access-features')}>prebuilt widget</Link> to
                            opt-in to features
                        </div>
                    ),
                },
                {
                    key: '2',
                    header: 'Option 2: Custom implementation',
                    content: (
                        <div>
                            <b>Opt user in</b>
                            <div>
                                <FeatureEnrollInstructions flag={flag} />
                            </div>

                            <b>Opt user out</b>
                            <div>
                                <FeatureUnenrollInstructions flag={flag} />
                            </div>

                            <b>Retrieve Previews</b>
                            <div>
                                <RetrievePreviewsInstructions />
                            </div>
                        </div>
                    ),
                },
            ]}
        />
    )

    const getSelfHostedPanels = (): JSX.Element => (
        <div>
            <b>Opt user in</b>
            <div>
                <FeatureEnrollInstructions flag={flag} />
            </div>

            <b>Opt user out</b>
            <div>
                <FeatureUnenrollInstructions flag={flag} />
            </div>

            <b>Retrieve Previews</b>
            <div>
                <RetrievePreviewsInstructions />
            </div>
        </div>
    )

    const panels: JSX.Element = preflight?.cloud ? getCloudPanels() : getSelfHostedPanels()

    return (
        <Modal title="How to implement opt-in feature flags" isOpen={visible} onClose={onClose} width={640}>
            <div>
                <div className="mb-2">
                    Implement manual release condition toggles to give your users the ability choose which features they
                    want to try
                </div>
                {panels}
            </div>
        </Modal>
    )
}

function FeatureEnrollInstructions({ flag }: { flag: string }): JSX.Element {
    return (
        <CodeSnippet language={Language.JavaScript} wrap>
            {`insights.updateEarlyAccessFeatureEnrollment("${flag}", true)
`}
        </CodeSnippet>
    )
}

function FeatureUnenrollInstructions({ flag }: { flag: string }): JSX.Element {
    return (
        <CodeSnippet language={Language.JavaScript} wrap>
            {`insights.updateEarlyAccessFeatureEnrollment("${flag}", false)
`}
        </CodeSnippet>
    )
}

function RetrievePreviewsInstructions(): JSX.Element {
    return (
        <CodeSnippet language={Language.JavaScript} wrap>
            {`insights.getEarlyAccessFeatures((previewItemData) => {
    // do something with early access feature
})
`}
        </CodeSnippet>
    )
}
