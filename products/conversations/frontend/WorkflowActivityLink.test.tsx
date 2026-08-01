import { render, waitFor } from '@testing-library/react'

import api from 'lib/api'

import { initKeaTests } from '~/test/init'

import { WorkflowActivityLink } from './WorkflowActivityLink'

describe('WorkflowActivityLink', () => {
    let getInsightsFlow: jest.SpyInstance

    beforeEach(() => {
        initKeaTests()
        getInsightsFlow = jest.spyOn(api.hogFlows, 'getInsightsFlow')
    })

    afterEach(() => {
        getInsightsFlow.mockRestore()
    })

    it('renders the current workflow name resolved by id, not from the log', async () => {
        getInsightsFlow.mockResolvedValue({ id: 'flow-1', name: 'Escalation workflow' } as any)

        const { container } = render(<WorkflowActivityLink id="flow-1" />)

        await waitFor(() => expect(container.textContent).toContain('Escalation workflow'))
        expect(getInsightsFlow).toHaveBeenCalledWith('flow-1')
        expect(container.querySelector('a')?.getAttribute('href')).toContain('flow-1')
    })

    it('falls back to a generic label when the workflow is not found', async () => {
        getInsightsFlow.mockRejectedValue(new Error('Not found'))

        const { container } = render(<WorkflowActivityLink id="missing" />)

        await waitFor(() => expect(container.textContent).toContain('A workflow'))
        expect(container.querySelector('a')?.getAttribute('href')).toContain('missing')
    })
})
