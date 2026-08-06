import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'
import { router } from 'kea-router'
import { QRCodeSVG } from 'qrcode.react'

import { IconCopy, IconDownload } from '@hanzo/icons'
import {
    Button,
    Divider,
    Input,
    Label,
    Select,
    SelectOptions,
    Skeleton,
    Tag,
    TextArea,
    Link,
} from '@hanzo/elements'

import { NotFound } from 'lib/components/NotFound'
import { useFileSystemLogView } from 'lib/hooks/useFileSystemLogView'
import { Dialog } from 'lib/elements/Dialog'
import { Field } from 'lib/elements/Field'
import { SceneExport } from 'scenes/sceneTypes'
import { urls } from 'scenes/urls'

import { SceneContent } from '~/layout/scenes/components/SceneContent'
import { SceneTitleSection } from '~/layout/scenes/components/SceneTitleSection'

import { AVAILABLE_DOMAINS, AvailableDomain, LinkLogicProps, linkLogic } from './linkLogic'

export const scene: SceneExport<LinkLogicProps> = {
    component: LinkScene,
    logic: linkLogic,
    paramsToProps: ({ params: { id } }) => ({ id: id && id !== 'new' ? id : 'new' }),
}

const SOON_TAG = (
    <Tag type="completion" size="small" className="ml-2">
        SOON
    </Tag>
)

const PAID_TAG = (
    <Tag type="success" size="small" className="ml-2">
        PAID
    </Tag>
)

const DomainLabelWithTag = ({
    domain,
    soon,
    paid,
}: {
    domain: string
    soon?: boolean
    paid?: boolean
}): JSX.Element => {
    return (
        <div>
            <span>{domain}</span>
            {soon && SOON_TAG}
            {paid && PAID_TAG}
        </div>
    )
}

const DOMAIN_OPTIONS: SelectOptions<AvailableDomain> = AVAILABLE_DOMAINS.map((domain) => ({
    label: <DomainLabelWithTag domain={domain.label} soon={domain.soon} paid={domain.paid} />,
    value: domain.value,
    disabledReason: domain.soon ? 'Coming soon...' : undefined,
}))

export function LinkScene({ id }: LinkLogicProps): JSX.Element {
    const { link, linkLoading, isLinkSubmitting, isEditingLink, linkMissing } = useValues(linkLogic)
    const { submitLinkRequest, loadLink, editLink, deleteLink } = useActions(linkLogic)

    const linkId = link?.id && link?.id !== 'new' ? link.id : null

    useFileSystemLogView({
        type: 'link',
        ref: linkId,
        enabled: Boolean(linkId && !linkLoading),
    })

    if (linkMissing) {
        return <NotFound object="link" />
    }

    if (linkLoading) {
        return <Skeleton active />
    }

    const isNewLink = id === 'new' || id === undefined
    const displayForm = isEditingLink || isNewLink
    const fullLink = `https://${link.short_link_domain}/${link.short_code}`

    return (
        <Form id="link" formKey="link" logic={linkLogic}>
            <SceneContent>
                <SceneTitleSection
                    name={fullLink}
                    description={null}
                    resourceType={{
                        type: 'link',
                    }}
                    actions={
                        <>
                            {!linkLoading ? (
                                displayForm ? (
                                    <>
                                        <Button
                                            type="secondary"
                                            data-attr="cancel-link"
                                            onClick={() => {
                                                if (isEditingLink) {
                                                    editLink(false)
                                                    loadLink()
                                                } else {
                                                    router.actions.push(urls.links())
                                                }
                                            }}
                                            size="small"
                                            disabledReason={isLinkSubmitting ? 'Saving…' : undefined}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            data-attr="save-link"
                                            onClick={() => {
                                                submitLinkRequest(link)
                                            }}
                                            loading={isLinkSubmitting}
                                            form="link"
                                            size="small"
                                        >
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            data-attr="delete-link"
                                            status="danger"
                                            type="secondary"
                                            size="small"
                                            onClick={() => {
                                                Dialog.open({
                                                    title: 'Permanently delete link?',
                                                    description:
                                                        'Doing so will remove the link and the existing redirect rules. You will NOT lose access to the `$clicklink` events.',
                                                    primaryButton: {
                                                        children: 'Delete',
                                                        type: 'primary',
                                                        status: 'danger',
                                                        'data-attr': 'confirm-delete-link',
                                                        onClick: () => {
                                                            // conditional above ensures link is not NewLink
                                                            deleteLink(link?.id)
                                                        },
                                                    },
                                                    secondaryButton: {
                                                        children: 'Close',
                                                        type: 'secondary',
                                                    },
                                                })
                                            }}
                                        >
                                            Delete
                                        </Button>
                                        <Button
                                            type="secondary"
                                            onClick={() => editLink(true)}
                                            loading={false}
                                            data-attr="edit-link"
                                            size="small"
                                        >
                                            Edit
                                        </Button>
                                    </>
                                )
                            ) : undefined}
                        </>
                    }
                />

                <div className="space-y-4">
                    <div className="flex gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-col">
                                <Label>Destination URL</Label>
                                {displayForm ? (
                                    <div className="flex gap-1 items-center">
                                        <Field name="redirect_url">
                                            <Input
                                                placeholder="https://loooooooooooooong.hanzo.ai/"
                                                fullWidth
                                                autoWidth={false}
                                            />
                                        </Field>
                                    </div>
                                ) : (
                                    <Link to={link.redirect_url} className="text-muted" target="_blank">
                                        {link.redirect_url}
                                    </Link>
                                )}
                            </div>

                            <div className="flex flex-col">
                                <Label>Short Link</Label>
                                {displayForm ? (
                                    <div className="flex gap-1 items-center">
                                        <Field name="short_link_domain">
                                            <Select<AvailableDomain>
                                                options={DOMAIN_OPTIONS}
                                                className="text-muted"
                                            />
                                        </Field>
                                        <span className="text-muted">/</span>
                                        <Field name="short_code" className="w-full">
                                            <Input
                                                fullWidth
                                                placeholder="short"
                                                className="flex-1"
                                                autoWidth={false}
                                            />
                                        </Field>
                                    </div>
                                ) : (
                                    <Link to={fullLink} target="_blank">
                                        {fullLink}
                                    </Link>
                                )}
                            </div>

                            <div className="flex flex-col">
                                <Label>Description (optional)</Label>
                                {displayForm ? (
                                    <div className="flex gap-1 items-center">
                                        <Field name="description">
                                            <TextArea
                                                placeholder="Add a description so that you can easily identify this link"
                                                minRows={2}
                                            />
                                        </Field>
                                    </div>
                                ) : (
                                    <div>{link.description || <span className="text-muted">No description</span>}</div>
                                )}
                            </div>
                        </div>

                        <Divider vertical />

                        <div className="flex-1 space-y-6 max-w-80">
                            <div>
                                <div className="flex justify-between items-center">
                                    <Label>
                                        <span className="flex items-center gap-1">QR Code</span>
                                    </Label>
                                    <div className="flex flex-row">
                                        <Button
                                            icon={<IconDownload />}
                                            size="xsmall"
                                            onClick={() => {}}
                                            tooltip="Download QR code"
                                        />
                                        <Button
                                            icon={<IconCopy />}
                                            size="xsmall"
                                            onClick={() => {}}
                                            tooltip="Copy to clipboard"
                                        />
                                    </div>
                                </div>

                                <div className="border rounded-md p-4 mt-2 bg-bg-light flex items-center justify-center">
                                    <div className="text-center">
                                        <QRCodeSVG
                                            size={128}
                                            value={fullLink}
                                            level="H"
                                            imageSettings={{
                                                src: '/static/insights-icon.svg',
                                                height: 35,
                                                width: 35,
                                                excavate: true,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SceneContent>
        </Form>
    )
}
