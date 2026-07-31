import { useEffect } from 'react'

import { Button } from '@hanzo/elements'

import { CloseOverlayAction } from './storiesMap'

interface PizzaSurveyOverlayComponentProps {
    closeOverlay: (action?: CloseOverlayAction) => void
}

export const PizzaSurveyOverlayComponent = ({ closeOverlay }: PizzaSurveyOverlayComponentProps): JSX.Element => {
    const clickPollButton = (): void => {
        setTimeout(() => {
            const button = document.getElementById('insightstok-pineapple-pizza-poll-button')
            if (button) {
                button.click()
            }
        }, 1000)
    }

    useEffect(() => {
        clickPollButton()

        const handleResize = (): void => {
            clickPollButton()
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    return (
        <div className="flex flex-col h-full bg-primary p-8">
            <div className="flex-1 flex items-start justify-center">
                <Button id="insightstok-pineapple-pizza-poll-button" type="secondary">
                    Take survey
                </Button>
            </div>

            <div className="flex-1 flex items-center justify-center text-3xl">
                <strong>
                    There's only <em>one</em> right answer!
                </strong>
            </div>

            <div className="flex-1 flex items-end justify-center">
                <Button onClick={() => closeOverlay(CloseOverlayAction.Modal)} status="danger">
                    Close
                </Button>
            </div>
        </div>
    )
}
