export declare class Insights {
    constructor(apiKey: string, options?: {
        host?: string;
        flushAt?: number;
        flushInterval?: number;
        personalApiKey?: string;
        featureFlagsPollingInterval?: number;
        requestTimeout?: number;
        maxCacheSize?: number;
        fetch?: (...args: any[]) => any;
        enableExceptionAutocapture?: boolean;
        [key: string]: any;
    });
    capture(params: {
        distinctId: string;
        event: string;
        properties?: Record<string, any>;
        groups?: Record<string, string>;
        sendFeatureFlags?: boolean;
        timestamp?: Date;
        disableGeoip?: boolean;
    }): void;
    captureException(exception: any, distinctId?: string, additionalProperties?: Record<string, any>): void;
    identify(params: {
        distinctId: string;
        properties?: Record<string, any>;
    }): void;
    alias(params: {
        distinctId: string;
        alias: string;
    }): void;
    groupIdentify(params: {
        groupType: string;
        groupKey: string;
        properties?: Record<string, any>;
        distinctId?: string;
    }): void;
    isFeatureEnabled(key: string, distinctId: string, options?: {
        groups?: Record<string, string>;
        personProperties?: Record<string, string>;
        groupProperties?: Record<string, Record<string, string>>;
        onlyEvaluateLocally?: boolean;
        sendFeatureFlagEvents?: boolean;
    }): Promise<boolean | undefined>;
    getFeatureFlag(key: string, distinctId: string, options?: {
        groups?: Record<string, string>;
        personProperties?: Record<string, string>;
        groupProperties?: Record<string, Record<string, string>>;
        onlyEvaluateLocally?: boolean;
        sendFeatureFlagEvents?: boolean;
    }): Promise<string | boolean | undefined>;
    getAllFlags(distinctId: string, options?: {
        groups?: Record<string, string>;
        personProperties?: Record<string, string>;
        groupProperties?: Record<string, Record<string, string>>;
        onlyEvaluateLocally?: boolean;
    }): Promise<Record<string, string | boolean>>;
    getFeatureFlagPayload(key: string, distinctId: string, matchValue?: string | boolean, options?: {
        groups?: Record<string, string>;
        personProperties?: Record<string, string>;
        groupProperties?: Record<string, Record<string, string>>;
        onlyEvaluateLocally?: boolean;
    }): Promise<any>;
    reloadFeatureFlags(): Promise<void>;
    register(properties: Record<string, any>): Promise<void>;
    flush(): Promise<any>;
    shutdown(timeout?: number): Promise<void>;
    shutdownAsync(): Promise<void>;
    disable(): Promise<void>;
    enable(): Promise<void>;
    debug(enabled?: boolean): void;
    on(event: string, cb: (...args: any[]) => void): void;
}
