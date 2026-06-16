'use client'

import './globals.css'

import { AuthProvider } from '@/lib/auth'
import { initInsights } from '@/lib/insights'
import { useEffect } from 'react'

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
    useEffect(() => {
        initInsights()
    }, [])

    return (
        <html lang="en" data-theme="hedgebox">
            <body>
                <AuthProvider>
                    <div className="min-h-screen bg-base-100">{children}</div>
                </AuthProvider>
            </body>
        </html>
    )
}
