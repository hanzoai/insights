import { IconCopy } from '@hanzo/icons'
import { toast } from '@hanzo/elements'

export async function copyToClipboard(value: string, description: string = 'text'): Promise<boolean> {
    if (!navigator.clipboard) {
        toast.warning('Oops! Clipboard capabilities are only available over HTTPS or on localhost')
        return false
    }

    try {
        await navigator.clipboard.writeText(value)
        toast.info(`Copied ${description} to clipboard`, {
            icon: <IconCopy />,
        })
        return true
    } catch {
        // If the Clipboard API fails, fallback to textarea method
        try {
            const textArea = document.createElement('textarea')
            textArea.value = value
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            toast.info(`Copied ${description} to clipboard`, {
                icon: <IconCopy />,
            })
            return true
        } catch (err) {
            toast.error(`Could not copy ${description} to clipboard: ${err}`)
            return false
        }
    }
}
