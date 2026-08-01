import { sidePanelStateLogic } from '~/layout/navigation-3000/sidepanel/sidePanelStateLogic'
import { SidePanelTab } from '~/types'

/**
 * Open Insights AI in the side panel with a question pre-filled and auto-submitted — the `!`
 * prefix runs it immediately. The side-panel logic is mounted by the app shell, so we reach
 * for the mounted instance rather than mounting it eagerly.
 */
export function askInsightsAI(prompt: string): void {
    sidePanelStateLogic.findMounted()?.actions.openSidePanel(SidePanelTab.Max, '!' + prompt)
}
