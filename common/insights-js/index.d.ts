// Hanzo Insights Browser SDK type declarations
// Full class declaration — no upstream type references

export declare class Insights {
    constructor(apiKey: string, options?: Record<string, any>);
    init(apiKey: string, config?: Record<string, any>, name?: string): void;
    capture(event: string, properties?: Record<string, any> | null, options?: Record<string, any>): any;
    identify(distinctId: string, properties?: Record<string, any>, options?: Record<string, any>): void;
    alias(alias: string, distinctId?: string): void;
    group(groupType: string, groupKey: string, groupProperties?: Record<string, any>): void;
    reset(resetDeviceId?: boolean): void;
    opt_in_capturing(options?: Record<string, any>): void;
    opt_out_capturing(): void;
    has_opted_in_capturing(): boolean;
    has_opted_out_capturing(): boolean;
    isFeatureEnabled(key: string, options?: Record<string, any>): boolean | undefined;
    getFeatureFlag(key: string, options?: Record<string, any>): string | boolean | undefined;
    getFeatureFlagPayload(key: string): any;
    reloadFeatureFlags(): void;
    onFeatureFlags(callback: (flags: string[], variants: Record<string, string | boolean>, context?: any) => void): () => void;
    register(properties: Record<string, any>): void;
    register_once(properties: Record<string, any>): void;
    unregister(property: string): void;
    get_distinct_id(): string;
    get_session_id(): string;
    get_session_replay_url(options?: Record<string, any>): string;
    get_property(property: string): any;
    debug(enabled?: boolean): void;
    on(event: string, callback: (...args: any[]) => void): () => void;
    toString(): string;
    config: Record<string, any>;
    version: string;
    sessionRecording?: { started: boolean; status: string };
    sessionManager?: { resetSessionId: () => void };
    surveys?: { getSurveys: (callback: (surveys: any[]) => void, forceReload?: boolean) => void };
    heatmaps?: { isEnabled: boolean };
    autocapture?: { isEnabled: boolean };
    deadClicksAutocapture?: { lazyLoadedDeadClicksAutocapture: any };
}

export default Insights;
