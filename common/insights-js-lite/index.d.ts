// Hanzo Insights Lite SDK type declarations

export declare class Insights {
    constructor(apiKey: string, options?: { host?: string; [key: string]: any });
    capture(event: string, properties?: Record<string, any>): void;
    identify(distinctId: string, properties?: Record<string, any>): void;
    alias(alias: string, distinctId?: string): void;
    group(groupType: string, groupKey: string, groupProperties?: Record<string, any>): void;
    register(properties: Record<string, any>): void;
    screen(name: string, properties?: Record<string, any>): void;
    optIn(): void;
    optOut(): void;
    isOptedOut(): boolean;
    reset(): void;
    debug(enabled?: boolean): void;
    flush(): Promise<void>;
    shutdown(): Promise<void>;
    getFeatureFlag(key: string): string | boolean | undefined;
    getFeatureFlagPayload(key: string): any;
    isFeatureEnabled(key: string): boolean | undefined;
    reloadFeatureFlags(callback?: () => void): void;
    onFeatureFlags(callback: (flags: string[]) => void): () => void;
    getDistinctId(): string;
    getAnonymousId(): string;
}
