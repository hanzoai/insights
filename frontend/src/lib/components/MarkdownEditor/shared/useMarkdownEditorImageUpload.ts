import type { Editor } from '@tiptap/core'
import insights from 'insights-js'

import { useUploadFiles } from 'lib/hooks/useUploadFiles'
import { toast } from 'lib/elements/Toast'

export function useMarkdownEditorImageUpload(editor: Editor | null): ReturnType<typeof useUploadFiles> {
    return useUploadFiles({
        onUpload: (url, fileName) => {
            editor?.chain().focus().setImage({ src: url, alt: fileName }).run()
            insights.capture('markdown image uploaded', { name: fileName })
        },
        onError: (detail) => {
            insights.capture('markdown image upload failed', { error: detail })
            toast.error(`Error uploading image: ${detail}`)
        },
    })
}
