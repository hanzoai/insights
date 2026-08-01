import { Input, Select } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { AWS_ONLY_REGION_OPTIONS, validateBucketName } from './common'
import type { DestinationDefinition } from './types'

// Redshift is the only destination with a non-trivial form ↔ payload mapping.
// The COPY mode requires nested copy_inputs (s3_bucket, s3_key_prefix, region_name,
// authorization, bucket_credentials), which we flatten to top-level redshift_* fields
// in the form for editing and re-assemble on save.
function buildCopyInputs(formValues: Record<string, any>): Record<string, any> {
    const copyInputs: Record<string, any> = {
        s3_bucket: formValues.redshift_s3_bucket,
        s3_key_prefix: formValues.redshift_s3_key_prefix,
        region_name: formValues.redshift_s3_bucket_region_name,
    }

    if (formValues.redshift_iam_role) {
        copyInputs.authorization = formValues.redshift_iam_role
    } else if (formValues.redshift_aws_access_key_id && formValues.redshift_aws_secret_access_key) {
        copyInputs.authorization = {
            aws_access_key_id: formValues.redshift_aws_access_key_id,
            aws_secret_access_key: formValues.redshift_aws_secret_access_key,
        }
    }

    if (formValues.redshift_s3_bucket_aws_access_key_id && formValues.redshift_s3_bucket_aws_secret_access_key) {
        copyInputs.bucket_credentials = {
            aws_access_key_id: formValues.redshift_s3_bucket_aws_access_key_id,
            aws_secret_access_key: formValues.redshift_s3_bucket_aws_secret_access_key,
        }
    }

    return copyInputs
}

const REDSHIFT_FORM_ONLY_FIELDS = [
    'mode',
    'authorization_mode',
    // copy_inputs is re-assembled from the flat redshift_* fields in COPY mode and must not be
    // carried over verbatim — otherwise switching a COPY export to INSERT leaks the stale object.
    'copy_inputs',
    'redshift_s3_bucket',
    'redshift_s3_key_prefix',
    'redshift_s3_bucket_region_name',
    'redshift_s3_bucket_aws_access_key_id',
    'redshift_s3_bucket_aws_secret_access_key',
    'redshift_iam_role',
    'redshift_aws_access_key_id',
    'redshift_aws_secret_access_key',
] as const

export const redshiftDefinition: DestinationDefinition = {
    type: 'Redshift',
    defaults: () => ({
        mode: 'COPY',
        authorization_mode: 'IAMRole',
        properties_data_type: 'SUPER',
    }),
    requiredFields: ({ isNew }) => [
        ...(isNew ? ['user'] : []),
        ...(isNew ? ['password'] : []),
        'host',
        'port',
        'database',
        'schema',
        'table_name',
    ],
    validate: (formValues) => {
        if (formValues.mode === 'COPY') {
            return { redshift_s3_bucket: validateBucketName(formValues.redshift_s3_bucket) }
        }
        return {}
    },
    serialize: (formValues) => {
        const config: Record<string, any> = {}
        for (const [key, value] of Object.entries(formValues)) {
            if ((REDSHIFT_FORM_ONLY_FIELDS as readonly string[]).includes(key)) {
                continue
            }
            config[key] = value
        }
        config.mode = formValues.mode
        // copy_inputs is rebuilt from the flat redshift_* fields in COPY mode and explicitly nulled
        // in INSERT mode — never carried over from the deserialized form state.
        config.copy_inputs = formValues.mode === 'COPY' ? buildCopyInputs(formValues) : null
        return config
    },
    deserialize: (config) => {
        const result: Record<string, any> = { ...config, authorization_mode: 'IAMRole' }
        if (config.copy_inputs) {
            const copyInputs = config.copy_inputs
            result.redshift_s3_bucket = copyInputs.s3_bucket
            result.redshift_s3_key_prefix = copyInputs.s3_key_prefix
            result.redshift_s3_bucket_region_name = copyInputs.region_name
            result.redshift_s3_bucket_aws_access_key_id = copyInputs.bucket_credentials?.aws_access_key_id
            result.redshift_s3_bucket_aws_secret_access_key = copyInputs.bucket_credentials?.aws_secret_access_key
            result.redshift_iam_role = undefined
            result.redshift_aws_access_key_id = undefined
            result.redshift_aws_secret_access_key = undefined

            if (typeof copyInputs.authorization === 'string') {
                result.authorization_mode = 'IAMRole'
                result.redshift_iam_role = copyInputs.authorization
            } else if (copyInputs.authorization) {
                result.authorization_mode = 'Credentials'
                result.redshift_aws_access_key_id = copyInputs.authorization.aws_access_key_id
                result.redshift_aws_secret_access_key = copyInputs.authorization.aws_secret_access_key
            }
        }
        return result
    },
    eventTableOverrides: { teamIdHogql: 'toInt32(team_id)' },
    Fields: function RedshiftFields({ isNew, formValues }) {
        return (
            <>
                <Field name="user" label="User">
                    <Input placeholder={isNew ? 'my-user' : 'Leave unchanged'} />
                </Field>

                <Field name="password" label="Password">
                    <Input placeholder={isNew ? 'my-password' : 'Leave unchanged'} type="password" />
                </Field>

                <Field name="host" label="Host">
                    <Input placeholder="my-host" />
                </Field>

                <Field name="port" label="Port">
                    <Input placeholder="5439" type="number" min="0" max="65535" />
                </Field>

                <Field name="database" label="Database">
                    <Input placeholder="my-database" />
                </Field>

                <Field name="schema" label="Schema">
                    <Input placeholder="public" />
                </Field>

                <Field name="table_name" label="Table name">
                    <Input placeholder="events" />
                </Field>

                <Field
                    name="properties_data_type"
                    label="Semi-structured data type"
                    info={
                        <>
                            Different Insights models have semi-structured data fields in them, like "events.properties".
                            We can export these fields to Redshift as a "SUPER" type column, or a "VARCHAR" column. We
                            recommend "SUPER" over "VARCHAR" as "VARCHAR" has a strict length limit that applies on the
                            entire document, whereas with "SUPER" the limit applies on each value in the document.
                        </>
                    }
                >
                    <Select
                        options={[
                            { value: 'varchar', label: 'VARCHAR(65535)' },
                            { value: 'super', label: 'SUPER' },
                        ]}
                    />
                </Field>

                <Field
                    name="mode"
                    label="Command"
                    className="flex-1"
                    info={
                        <>
                            Choose the SQL command used by the batch export. "COPY" has the best performance but
                            requires an S3 bucket we can connect to. "INSERT" performs worse but without any additional
                            requirements.
                        </>
                    }
                >
                    <Select
                        options={[
                            { value: 'COPY', label: 'COPY' },
                            { value: 'INSERT', label: 'INSERT' },
                        ]}
                    />
                </Field>

                {formValues.mode === 'COPY' && (
                    <>
                        <p className="text-xs text-muted mt-1">
                            In order to execute a COPY SQL command, the batch export will first export files to an S3
                            bucket, which requires credentials to access it. After the files are available in the
                            bucket, we will instruct Redshift to copy them into the configured table. As part of this,
                            the batch export needs to specify to Redshift how to access your bucket. For this reason,
                            additionally to the first set of credentials used by the batch export, either an IAM role
                            (recommended), or the same or a different set of credentials is required.
                        </p>

                        <div className="flex gap-4">
                            <Field name="redshift_s3_bucket" label="S3 bucket name" className="flex-1">
                                <Input placeholder="e.g. my-bucket" />
                            </Field>
                            <Field
                                name="redshift_s3_bucket_region_name"
                                label="S3 bucket region"
                                className="flex-1"
                            >
                                <Select options={AWS_ONLY_REGION_OPTIONS} />
                            </Field>
                        </div>

                        <Field name="redshift_s3_key_prefix" label="S3 key prefix" className="flex-1">
                            <Input placeholder="e.g. /insights-copy-files" />
                        </Field>

                        <div className="flex gap-4">
                            <Field
                                name="redshift_s3_bucket_aws_access_key_id"
                                label="AWS Access Key ID"
                                className="flex-1"
                            >
                                <Input
                                    placeholder={isNew ? 'e.g. AKIAIOSFODNN7EXAMPLE' : 'Leave unchanged'}
                                    autoComplete="off"
                                />
                            </Field>

                            <Field
                                name="redshift_s3_bucket_aws_secret_access_key"
                                label="AWS Secret Access Key"
                                className="flex-1"
                            >
                                <Input
                                    placeholder={isNew ? 'e.g. secret-key' : 'Leave unchanged'}
                                    type="password"
                                    autoComplete="new-password"
                                />
                            </Field>
                        </div>

                        <Field
                            name="authorization_mode"
                            label="Authorization"
                            className="flex-1"
                            info={
                                <>
                                    Redshift needs to authenticate to COPY data from your S3 bucket. Choose whether to
                                    assume an IAM role or to provide it with credentials to access the S3 bucket.
                                </>
                            }
                        >
                            <Select
                                options={[
                                    { value: 'IAMRole', label: 'IAM Role' },
                                    { value: 'Credentials', label: 'Credentials' },
                                ]}
                            />
                        </Field>

                        {formValues.authorization_mode === 'IAMRole' && (
                            <Field name="redshift_iam_role" label="IAM Role ARN" className="flex-1">
                                <Input placeholder="e.g. arn:aws:iam::<aws-account-id>:role/<role-name>" />
                            </Field>
                        )}

                        {formValues.authorization_mode === 'Credentials' && (
                            <div className="flex gap-4">
                                <Field
                                    name="redshift_aws_access_key_id"
                                    label="AWS Access Key ID"
                                    className="flex-1"
                                >
                                    <Input
                                        placeholder={isNew ? 'e.g. AKIAIOSFODNN7EXAMPLE' : 'Leave unchanged'}
                                        autoComplete="off"
                                    />
                                </Field>

                                <Field
                                    name="redshift_aws_secret_access_key"
                                    label="AWS Secret Access Key"
                                    className="flex-1"
                                >
                                    <Input
                                        placeholder={isNew ? 'e.g. secret-key' : 'Leave unchanged'}
                                        type="password"
                                        autoComplete="new-password"
                                    />
                                </Field>
                            </div>
                        )}
                    </>
                )}
            </>
        )
    },
}
