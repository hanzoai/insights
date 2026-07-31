/**
 * This will redirect the user to the correct subdomain if they're logged in to a different instance.
 *
 * It will only work for us. and eu. subdomains and other subdomains will need to be added manually
 *
 * There's an e2e test for this.
 *
 * ## Local testing
 *
 * To test this locally, you can edit your /etc/hosts to add a subdomain redirect
 *
 * Add the following line to your host file:
 * 127.0.0.1 us.insightstest.com
 *
 * Then set the following cookies locally:
 * document.cookie = 'ph_current_instance="https://insights.hanzo.ai"';
 * document.cookie = "is-logged-in=1";
 *
 * Then go to http://us.insightstest.com:8000/login?next=/apps
 * And it will update the subdomain, taking you to the following link
 * http://eu.insightstest.com:8000/login?next=/apps
 */
import { insights } from '@hanzo/insights'
import { useEffect, useState } from 'react'

import { Button, Modal } from '@hanzo/elements'

import { getCookie } from 'lib/api'
import { useOnMountEffect } from 'lib/hooks/useOnMountEffect'
import { Progress } from 'lib/elements/Progress'
import { roundToDecimal } from 'lib/utils'

// cookie values
const PH_CURRENT_INSTANCE = 'ph_current_instance'

type Subdomain = 'eu' | 'us'

export function cleanedCookieSubdomain(loggedInInstance: string | null): Subdomain | null {
    try {
        // replace '"' as for some reason the cookie value is wrapped in quotes e.g. "https://insights.hanzo.ai"
        const url = loggedInInstance?.replace(/"/g, '')
        if (!url) {
            return null
        }
        // convert to URL, so that we can be sure we're dealing with a valid URL
        const hostname = new URL(url).hostname
        switch (hostname) {
            case 'insights.hanzo.ai':
                return 'eu'
            case 'insights.hanzo.ai':
                return 'us'
            default:
                return null
        }
    } catch (e) {
        // let's not allow errors in this code break the log-in page 🤞
        insights.captureException(e, { loggedInInstance })
        return null
    }
}

function regionFromSubdomain(subdomain: Subdomain): 'EU' | 'US' {
    switch (subdomain) {
        case 'us':
            return 'US'
        case 'eu':
            return 'EU'
    }
}

const REDIRECT_TIMEOUT_SECONDS = 7 // 7 seconds seems to be just right to actually read what's happening

export function RedirectIfLoggedInOtherInstance(): JSX.Element | null {
    const [isOpen, setIsOpen] = useState(false)
    const [redirectUrl, setRedirectUrl] = useState<URL | null>(null)
    const [loggedInSubdomainValue, setLoggedInSubdomainValue] = useState<Subdomain | null>(null)
    const [redirectProgress, setRedirectProgress] = useState(0)

    useOnMountEffect(() => {
        const currentSubdomain = window.location.hostname.split('.')[0]

        const loggedInInstance = getCookie(PH_CURRENT_INSTANCE)
        const loggedInSubdomain = cleanedCookieSubdomain(loggedInInstance)

        if (!loggedInSubdomain) {
            return // not logged into another subdomain
        }

        const loggedIntoOtherSubdomain = loggedInSubdomain !== currentSubdomain

        if (!loggedIntoOtherSubdomain) {
            return
        }

        const newUrl = new URL(window.location.href)
        newUrl.hostname = newUrl.hostname.replace(currentSubdomain, loggedInSubdomain)

        setRedirectUrl(newUrl)
        setLoggedInSubdomainValue(loggedInSubdomain)
        setIsOpen(true)

        insights.capture('Redirect to logged-in instance modal shown', {
            current_subdomain: currentSubdomain,
            logged_in_subdomain: loggedInSubdomain,
            redirect_url: newUrl.href,
        })
    })

    useEffect(() => {
        if (!isOpen) {
            return
        }

        let animationFrameId: number
        const startTime = performance.now()

        const animate = (currentTime: number): void => {
            const elapsedTime = currentTime - startTime
            const newProgress = Math.min((elapsedTime / (REDIRECT_TIMEOUT_SECONDS * 1000)) * 100, 100)
            setRedirectProgress(newProgress)
            if (newProgress >= 100 && redirectUrl) {
                window.location.assign(redirectUrl.href)
                return
            }
            animationFrameId = requestAnimationFrame(animate)
        }

        animationFrameId = requestAnimationFrame(animate)

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId)
            }
        }
    }, [isOpen, redirectUrl])

    if (!redirectUrl || !loggedInSubdomainValue) {
        return null
    }

    const secondsLeft = REDIRECT_TIMEOUT_SECONDS * (1 - redirectProgress / 100)

    return (
        <Modal
            isOpen={isOpen}
            title="Redirecting to your logged-in account"
            footer={
                redirectProgress < 100 && (
                    <div className="flex items-center justify-end gap-2">
                        <Button type="secondary" onClick={() => setIsOpen(false)}>
                            Cancel redirect
                        </Button>
                        <Button type="primary" onClick={() => window.location.assign(redirectUrl.href)}>
                            Let's go to the {regionFromSubdomain(loggedInSubdomainValue)} region now
                        </Button>
                    </div>
                )
            }
            onClose={() => setIsOpen(false)}
        >
            <div className="space-y-4">
                <p className="mb-2">
                    You're already logged into Insights Cloud in the {regionFromSubdomain(loggedInSubdomainValue)}{' '}
                    region.
                </p>
                <p className="mb-2">
                    Taking you there{' '}
                    {secondsLeft === 0
                        ? 'now.'
                        : `in ${roundToDecimal(secondsLeft, secondsLeft > 1 ? 0 : 1)} seconds...`}
                </p>
                <Progress percent={redirectProgress} smoothing={false} />
            </div>
        </Modal>
    )
}
