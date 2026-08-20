import { ScriptTransformer } from './script-transformer.interface'

/**
 * Scope owner for a script transformer: starts it on `start()` and stops it on
 * `stop()`, so its lifetime is tied to the owning scope. The concrete
 * transformer is supplied by the caller via a factory (the implementation
 * lives in cdp), so ingestion scopes own its lifecycle without importing cdp.
 */
export class ScriptTransformerComponent {
    constructor(private readonly create: () => ScriptTransformer) {}

    async start(): Promise<{ value: ScriptTransformer; stop: () => Promise<void> }> {
        const scriptTransformer = this.create()
        await scriptTransformer.start()
        return { value: scriptTransformer, stop: () => scriptTransformer.stop() }
    }
}
