import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

import { LinkExtension } from './LinkExtension'

describe('LinkExtension', () => {
    function pastedHref(text: string): string | null {
        const editor = new Editor({
            element: document.createElement('div'),
            extensions: [StarterKit.configure({ link: false }), LinkExtension],
        })
        try {
            editor.view.pasteText(text, new Event('paste') as ClipboardEvent)
            return editor.getHTML().match(/<a[^>]+href="([^"]+)"/)?.[1] ?? null
        } finally {
            editor.destroy()
        }
    }

    it.each([
        ['person.properties.plan', null],
        ['event.properties.$browser', null],
        ['person.properties.email', null],
        ['props.name', null],
        ['see person.properties.plan in the payload', null],
        // Rare TLDs lose autolinking as a side effect — an explicit scheme still works
        ['acme.solutions', null],
        ['https://acme.solutions', 'https://acme.solutions'],
        ['http://person.properties/path', 'http://person.properties/path'],
        ['https://hanzo.ai/docs', 'https://hanzo.ai/docs'],
        ['hanzo.ai', 'http://hanzo.ai'],
        ['www.hanzo.ai', 'http://www.hanzo.ai'],
        ['ask support@hanzo.ai', 'mailto:support@hanzo.ai'],
    ])('pasting %j links %j', (text, expected) => {
        expect(pastedHref(text)).toEqual(expected)
    })
})
