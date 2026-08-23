import { normalizeSessionId } from '~/common/utils/utils'
import { dlq, ok } from '~/ingestion/framework/results'
import { ProcessingStep } from '~/ingestion/framework/steps'
import { EventHeaders } from '~/types'

import { SessionReplayHeaders } from './pipeline-types'

export interface ValidateSessionReplayHeadersStepInput {
    headers: EventHeaders
}

/**
 * Validates that a session replay message carries the headers the endpoint that produces this topic
 * guarantees, and replaces the wide header object with the narrowed {@link SessionReplayHeaders} so
 * downstream steps can trust them.
 *
 * The one endpoint that produces this topic (cloud's /v1/replay) rejects a snapshot before it reaches
 * Kafka unless it has an org, a valid `session_id`, and a `distinct_id`, so their absence here
 * indicates a bug upstream rather than bad user input — such messages are sent to the DLQ.
 */
export function createValidateSessionReplayHeadersStep<
    T extends ValidateSessionReplayHeadersStepInput,
>(): ProcessingStep<T, Omit<T, 'headers'> & { headers: SessionReplayHeaders }> {
    return async function validateReplayHeadersStep(input) {
        const { org, session_id, distinct_id } = input.headers

        if (!org) {
            return dlq('no_org_in_header')
        }
        if (!session_id) {
            return dlq('no_session_id_in_header')
        }
        if (!distinct_id) {
            return dlq('no_distinct_id_in_header')
        }

        return Promise.resolve(
            ok({ ...input, headers: { org, session_id: normalizeSessionId(session_id), distinct_id } })
        )
    }
}
