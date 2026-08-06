export declare class RetryError extends Error {
    /** Set by the system. */
    _attempt: number | undefined;
    /** Set by the system. */
    _maxAttempts: number | undefined;
    constructor(message?: string);
    get nameWithAttempts(): string;
    toString(): string;
}
