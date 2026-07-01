// TODO the rest of the app shouldn't be importing this 🙈
// Hanzo Insights lockup: the block-H mark + "HANZO" wordmark. Uses --brand-key
// so it inherits the light/dark flip (#000 in light, #fff in dark) defined in
// styles/base.scss. Mark geometry is the canonical @hanzo/logo block-H.
export function Logo({ style }: React.PropsWithoutRef<JSX.IntrinsicElements['svg']>): JSX.Element {
    return (
        <svg
            // eslint-disable-next-line react/forbid-dom-props
            style={style}
            fill="none"
            width="8.125em"
            height="2em"
            viewBox="0 0 272 67"
            xmlns="http://www.w3.org/2000/svg"
        >
            <g fill="var(--brand-key)">
                <path d="M22.21 67V44.6369H0V67H22.21Z" />
                <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" />
                <path d="M22.21 0H0V22.3184H22.21V0Z" />
                <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" />
                <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" />
            </g>
            <g fill="var(--brand-key)" transform="translate(82 4.3) scale(1.535)">
                <path d="M4 4h4v9h10V4h4v22h-4V17H8v9H4V4z" />
                <path d="M28 26V4h4l12 14.5V4h4v22h-3.8L32 11.5V26h-4z" />
                <path d="M52 26l8-22h4l8 22h-4.2l-1.8-5H58l-1.8 5H52zm7.2-8.5h5.6L62 10l-2.8 7.5z" />
                <path d="M74 26V4h4l12 14.5V4h4v22h-3.8L78 11.5V26h-4z" />
                <path d="M96 20.5l3.2-2c.8 2 2.4 3.2 4.8 3.2 2.2 0 3.5-.9 3.5-2.3 0-1.5-1.2-2.1-4-2.9-3.5-1-6-2.3-6-5.5 0-3 2.5-5.2 6.5-5.2 3.2 0 5.7 1.5 7 4l-3 2c-.9-1.7-2.3-2.7-4-2.7-1.8 0-3 .8-3 2s1.1 1.8 3.8 2.6c3.5 1 6.3 2.3 6.3 5.8 0 3.3-2.7 5.5-7 5.5-3.8 0-6.8-1.8-8.1-4.5z" />
            </g>
        </svg>
    )
}
