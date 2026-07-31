import { useActions, useValues } from 'kea'
import { Form } from 'kea-forms'

import { IconUpload } from '@hanzo/icons'
import { Button, FileInput, Modal } from '@hanzo/elements'

import { Field } from 'lib/elements/Field'

import { symbolSetLogic } from './symbolSetLogic'

export const UploadModal = (): JSX.Element => {
    const { setUploadSymbolSetId } = useActions(symbolSetLogic)
    const { uploadSymbolSetId, isUploadSymbolSetSubmitting, uploadSymbolSet } = useValues(symbolSetLogic)

    const onClose = (): void => setUploadSymbolSetId(null)

    return (
        <Modal title="" onClose={onClose} isOpen={!!uploadSymbolSetId} simple>
            <Form logic={symbolSetLogic} formKey="uploadSymbolSet" className="gap-1" enableFormOnSubmit>
                <Modal.Header>
                    <h3>Upload javscript symbol set</h3>
                </Modal.Header>
                <Modal.Content className="deprecated-space-y-2">
                    <Field name="minified">
                        <FileInput
                            accept="text/javascript"
                            multiple={false}
                            callToAction={
                                <div className="flex flex-col items-center justify-center deprecated-space-y-2 border border-dashed rounded p-4 w-full">
                                    <span className="flex items-center gap-2 font-semibold">
                                        <IconUpload className="text-2xl" /> Add minified source
                                    </span>
                                    <div>
                                        Drag and drop your minified source file here or click to open the file browser.
                                    </div>
                                </div>
                            }
                        />
                    </Field>
                    <Field name="sourceMap">
                        <FileInput
                            accept="*"
                            multiple={false}
                            callToAction={
                                <div className="flex flex-col items-center justify-center deprecated-space-y-2 border border-dashed rounded p-4 w-full">
                                    <span className="flex items-center gap-2 font-semibold">
                                        <IconUpload className="text-2xl" /> Add source map
                                    </span>
                                    <div>Drag and drop your source map here or click to open the file browser.</div>
                                </div>
                            }
                        />
                    </Field>
                </Modal.Content>
                <Modal.Footer>
                    <Button type="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        disabledReason={
                            uploadSymbolSet.minified.length < 1
                                ? 'Upload a minified source'
                                : uploadSymbolSet.sourceMap.length < 1
                                  ? 'Upload a source map'
                                  : undefined
                        }
                        type="primary"
                        status="alt"
                        htmlType="submit"
                        loading={isUploadSymbolSetSubmitting}
                    >
                        Upload
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    )
}
