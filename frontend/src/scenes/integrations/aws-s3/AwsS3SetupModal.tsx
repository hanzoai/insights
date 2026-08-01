import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { Banner, Button, Input, Modal, Tabs } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'
import { organizationLogic } from 'scenes/organizationLogic'
import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'

import { Region } from '~/types'

import { AwsS3SetupModalLogicProps, awsS3SetupModalLogic } from './awsS3SetupModalLogic'

const POSTFN_ROLE_ARN_BY_REGION: Partial<Record<Region, string>> = {
    [Region.US]: 'arn:aws:iam::309986977637:role/insights-external-batch-exports',
    [Region.EU]: 'arn:aws:iam::623789312881:role/insights-external-batch-exports',
}

export const AwsS3SetupModal = (props: AwsS3SetupModalLogicProps): JSX.Element => {
    const logic = awsS3SetupModalLogic(props)
    const { currentOrganization } = useValues(organizationLogic)
    const { preflight } = useValues(preflightLogic)
    const { authMode, isAwsS3IntegrationSubmitting } = useValues(logic)
    const { setAuthMode, submitAwsS3Integration } = useActions(logic)

    const insightsRoleArn = preflight?.region ? POSTFN_ROLE_ARN_BY_REGION[preflight.region] : undefined

    return (
        <Modal
            isOpen={props.isOpen}
            title="Configure AWS S3 connection"
            description="Connect Insights to your S3 buckets. Connections can be reused across exports."
            onClose={props.onComplete}
            footer={
                <>
                    <Button type="secondary" onClick={() => props.onComplete()}>
                        Cancel
                    </Button>
                    <Button type="primary" loading={isAwsS3IntegrationSubmitting} onClick={submitAwsS3Integration}>
                        Save
                    </Button>
                </>
            }
        >
            <Form logic={awsS3SetupModalLogic} formKey="awsS3Integration" className="flex flex-col gap-4">
                <Field name="name" label="Name" info="A name to identify this connection across exports.">
                    <Input placeholder="e.g. Production data lake" />
                </Field>
                <Tabs
                    activeKey={authMode}
                    onChange={setAuthMode}
                    tabs={[
                        {
                            key: 'role',
                            label: 'Assume IAM role',
                        },
                        {
                            key: 'access_key',
                            label: 'Access keys',
                        },
                    ]}
                />
                {authMode === 'role' ? (
                    <>
                        <Field
                            name="awsRoleArn"
                            label="IAM role ARN"
                            info="The ARN of an IAM role in your AWS account that Insights will assume to write export data."
                        >
                            <Input
                                placeholder="e.g. arn:aws:iam::123456789012:role/insights-batch-exports"
                                autoComplete="off"
                            />
                        </Field>
                        <div className="border border-border rounded p-4 bg-bg-light flex flex-col gap-3 text-sm">
                            <p className="font-semibold m-0">Requirements</p>
                            <div className="flex gap-3 items-start">
                                <span className="bg-primary-highlight text-primary-alt rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                                    1
                                </span>
                                <p className="m-0 text-secondary">
                                    {insightsRoleArn ? (
                                        <>
                                            Create an IAM role with a trust policy that allows Insights's role{' '}
                                            <code>{insightsRoleArn}</code> to assume it.
                                        </>
                                    ) : (
                                        <>
                                            Create an IAM role with a trust policy that allows Insights's role to assume
                                            it. Check with your instance administrator to obtain the role to trust.
                                        </>
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <span className="bg-primary-highlight text-primary-alt rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                                    2
                                </span>
                                <p className="m-0 text-secondary">
                                    The trust policy must require an <code>sts:ExternalId</code> condition equal to{' '}
                                    <code>insights-{currentOrganization?.id}</code>. Insights verifies this condition is
                                    enforced and exports will fail without it.
                                </p>
                            </div>
                            <div className="flex gap-3 items-start">
                                <span className="bg-primary-highlight text-primary-alt rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                                    3
                                </span>
                                <p className="m-0 text-secondary">
                                    Grant the role <code>s3:PutObject</code> and <code>s3:AbortMultipartUpload</code> on
                                    the destination bucket and prefix. If the bucket uses KMS encryption, also grant{' '}
                                    <code>kms:GenerateDataKey</code> and <code>kms:Decrypt</code> on the key.
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <Banner type="warning">
                            Access keys are long-lived credentials stored by Insights (encrypted). Prefer letting Insights
                            assume an IAM role to avoid creating and storing long-lived credentials.
                        </Banner>
                        <Field name="awsAccessKeyId" label="AWS Access Key ID">
                            <Input placeholder="e.g. AKIAIOSFODNN7EXAMPLE" autoComplete="off" />
                        </Field>
                        <Field name="awsSecretAccessKey" label="AWS Secret Access Key">
                            <Input type="password" placeholder="e.g. secret-key" autoComplete="new-password" />
                        </Field>
                    </>
                )}
            </Form>
        </Modal>
    )
}
