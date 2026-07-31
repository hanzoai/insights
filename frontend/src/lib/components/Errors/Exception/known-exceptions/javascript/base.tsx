import { Banner } from '@hanzo/elements'

export function KnownExceptionBanner({ children }: { children: React.ReactNode }): JSX.Element {
    return (
        <Banner type="info" className="bg-surface-secondary">
            {children}
        </Banner>
    )
}
