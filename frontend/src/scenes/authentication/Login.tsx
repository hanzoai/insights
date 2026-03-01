import './Login.scss'

import { useValues } from 'kea'
import { useEffect } from 'react'

import { preflightLogic } from 'scenes/PreflightCheck/preflightLogic'
import { SceneExport } from 'scenes/sceneTypes'

import { loginLogic } from './loginLogic'

export const scene: SceneExport = {
    component: Login,
    logic: loginLogic,
}

export function Login(): JSX.Element {
    const { preflight } = useValues(preflightLogic)

    useEffect(() => {
        // Redirect to Hanzo IAM OIDC login immediately
        const next = new URLSearchParams(window.location.search).get('next') || '/'
        window.location.href = `/login/oidc/?next=${encodeURIComponent(next)}`
    }, [])

    const oidcAvailable = preflight?.available_social_auth_providers?.['oidc']

    return (
        <div
            style={{
                display: 'flex',
                minHeight: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0d0d0d 100%)',
                flexDirection: 'column',
                gap: '24px',
            }}
        >
            <img
                src="https://cdn.hanzo.ai/img/logo-white.svg"
                alt="Hanzo"
                style={{ height: '48px', width: 'auto' }}
            />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '15px' }}>
                    {oidcAvailable ? 'Redirecting to Hanzo ID\u2026' : 'Loading\u2026'}
                </p>
                <div
                    style={{
                        width: '24px',
                        height: '24px',
                        border: '2px solid rgba(255,255,255,0.15)',
                        borderTopColor: '#fd4444',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }}
                />
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
