import { IncidentIoSummary, worstStatus } from './sidePanelStatusIncidentIoLogic'

/**
 * This value is read by the navigation, so a throw in here does not break the
 * status widget -- it unmounts the whole product, nav included. That is not
 * theoretical: `api.hanzo.ai/v1/summary` returned 503, the loader parsed the
 * error body as a summary, and every route rendered an error boundary until the
 * platform recovered.
 */
describe('worstStatus', () => {
    // The shape the platform actually returns when it cannot answer. It is valid
    // JSON, so nothing upstream of here throws -- it just is not a summary.
    const errorBody = { status: 503, error: 'platform status unavailable' } as unknown as IncidentIoSummary

    it('reports operational rather than throwing when the payload is not a summary', () => {
        expect(() => worstStatus(errorBody)).not.toThrow()
        expect(worstStatus(errorBody)).toBe('operational')
    })

    it.each([
        ['an empty object', {}],
        ['incidents missing', { in_progress_maintenances: [] }],
        ['maintenances missing', { ongoing_incidents: [] }],
    ])('survives %s', (_label, payload) => {
        expect(worstStatus(payload as IncidentIoSummary)).toBe('operational')
    })

    it('still reports the worst real impact', () => {
        const summary = {
            ongoing_incidents: [{ current_worst_impact: 'degraded_performance' }, { current_worst_impact: 'full_outage' }],
            in_progress_maintenances: [],
        } as unknown as IncidentIoSummary
        expect(worstStatus(summary)).toBe('major_outage')
    })

    it('reports degraded when only maintenance is in progress', () => {
        const summary = {
            ongoing_incidents: [],
            in_progress_maintenances: [{ id: 'm1' }],
        } as unknown as IncidentIoSummary
        expect(worstStatus(summary)).toBe('degraded_performance')
    })
})
