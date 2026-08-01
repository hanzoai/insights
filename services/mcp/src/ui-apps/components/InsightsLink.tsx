import type { ReactElement } from 'react'

interface InsightsLinkProps {
    url: string
    onOpen?: ((url: string) => void) | undefined
}

const InsightsIcon = (): ReactElement => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        aria-label="Hanzo"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M4 3h3.2v6.4h9.6V3H20v18h-3.2v-8.4H7.2V21H4V3z" fill="currentColor" />
    </svg>
)

export function InsightsLink({ url, onOpen }: InsightsLinkProps): ReactElement {
    const handleClick = (): void => {
        if (onOpen) {
            onOpen(url)
        } else {
            window.open(url, '_blank', 'noopener,noreferrer')
        }
    }

    return (
        <button
            onClick={handleClick}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                marginTop: '1rem',
                border: '1px solid var(--color-border-primary, #d0d5dd)',
                borderRadius: 'var(--border-radius-md, 0.375rem)',
                backgroundColor: 'var(--color-background-secondary, #f9fafb)',
                color: 'var(--color-text-primary, #101828)',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-background-tertiary, #f2f4f7)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-background-secondary, #f9fafb)'
            }}
        >
            <InsightsIcon />
            View in Insights
        </button>
    )
}
