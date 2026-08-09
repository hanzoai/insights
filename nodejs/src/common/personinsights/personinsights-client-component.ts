import { PersonFnClient } from './client'
import { PersonFnConfig, createPersonFnClient } from './index'

/**
 * Scope owner for a PersonFn gRPC client: builds the client on `start()` and
 * closes the connection on `stop()`, so its lifetime is tied to the owning
 * scope. Throws if personinsights isn't configured — read-only lanes (AI, error
 * tracking) read person and group data through it.
 */
export class PersonFnClientComponent {
    constructor(private readonly config: PersonFnConfig) {}

    start(): Promise<{ value: PersonFnClient; stop: () => Promise<void> }> {
        const client = createPersonFnClient(this.config)
        if (!client) {
            throw new Error(
                'PersonFn client is required but not configured — set PERSONFN_ENABLED=true and PERSONFN_ADDR'
            )
        }
        return Promise.resolve({
            value: client,
            stop: () => {
                client.close()
                return Promise.resolve()
            },
        })
    }
}
