export function IconUnderline(): JSX.Element {
    return (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="currentColor"
                d="M5 21h14v-2H5v2zm7-4a6 6 0 0 0 6-6V3h-2.5v8a3.5 3.5 0 0 1-7 0V3H6v8a6 6 0 0 0 6 6z"
            />
        </svg>
    )
}

export function IconHeading({ className }: { className?: string }): JSX.Element {
    return (
        <svg
            className={className}
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path fill="currentColor" d="M5 4v3h5.5v12h3V7H19V4H5z" />
        </svg>
    )
}

export function IconListNumbers(): JSX.Element {
    return (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="currentColor"
                d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"
            />
        </svg>
    )
}

export function IconAlignLeft(): JSX.Element {
    return (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M3 21h18v-2H3v2zm0-4h12v-2H3v2zm0-4h18v-2H3v2zm0-4h12V7H3v2zm0-6v2h18V3H3z" />
        </svg>
    )
}

export function IconAlignCenter(): JSX.Element {
    return (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="currentColor"
                d="M3 21h18v-2H3v2zm4-4h10v-2H7v2zm-4-4h18v-2H3v2zm4-4h10V7H7v2zm-4-6v2h18V3H3z"
            />
        </svg>
    )
}

export function IconAlignRight(): JSX.Element {
    return (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="currentColor"
                d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zm-6-6v2h18V3H3z"
            />
        </svg>
    )
}

export function InsightsLogo(): JSX.Element {
    return (
        <svg
            width="56"
            height="14"
            viewBox="0 0 120 30"
            fill="none"
            role="img"
            aria-label="Hanzo"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M4 4h4v9h10V4h4v22h-4V17H8v9H4V4z" fill="currentColor" />
            <path d="M26 26l8-22h4l8 22h-4.2l-1.8-5H32l-1.8 5H26zm7.2-8.5h5.6L36 10l-2.8 7.5z" fill="currentColor" />
            <path d="M50 26V4h4l12 14.5V4h4v22h-3.8L54 11.5V26h-4z" fill="currentColor" />
            <path d="M74 4h16v4l-9 14h9v4H74v-4l9-14h-9V4z" fill="currentColor" />
            <path
                d="M104 4a10 11 0 1 0 0 22 10 11 0 1 0 0-22zm0 4a6 7 0 1 1 0 14 6 7 0 1 1 0-14z"
                fill="currentColor"
            />
        </svg>
    )
}
