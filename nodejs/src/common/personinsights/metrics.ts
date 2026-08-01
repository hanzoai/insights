import { Code, ConnectError } from '@connectrpc/connect'
import { Counter, Gauge, Histogram } from 'prom-client'

// -- Connection-level metrics --

export const personinsightsConnectionState = new Gauge({
    name: 'personinsights_nodejs_grpc_connection_state',
    help: 'Current gRPC connection state (1 = active state)',
    labelNames: ['state', 'client'] as const,
})

export const personinsightsConnectionStateTransitionsTotal = new Counter({
    name: 'personinsights_nodejs_grpc_connection_state_transitions_total',
    help: 'gRPC connection state transitions',
    labelNames: ['from_state', 'to_state', 'client'] as const,
})

export const personinsightsConnectionEstablishmentSeconds = new Histogram({
    name: 'personinsights_nodejs_grpc_connection_establishment_seconds',
    help: 'Time to establish a gRPC connection (connecting to open/idle)',
    labelNames: ['client'] as const,
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
})

// -- HTTP/2 stream concurrency metrics --

export const personinsightsStreamsInFlight = new Gauge({
    name: 'personinsights_nodejs_grpc_streams_in_flight',
    help: 'Number of HTTP/2 streams currently open on the gRPC connection',
    labelNames: ['client'] as const,
})

export const personinsightsStreamAcquisitionSeconds = new Histogram({
    name: 'personinsights_nodejs_grpc_stream_acquisition_seconds',
    help: 'Time waiting for an HTTP/2 stream from the session manager (includes connection establishment if needed)',
    labelNames: ['client'] as const,
    buckets: [0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
})

// -- Request-level metrics --

export const personinsightsRequestsTotal = new Counter({
    name: 'personinsights_requests_total',
    help: 'Total PersonHog group repository requests',
    labelNames: ['method', 'source', 'client'] as const,
})

export const personinsightsErrorsTotal = new Counter({
    name: 'personinsights_errors_total',
    help: 'Total PersonHog gRPC errors',
    labelNames: ['method', 'client', 'error_type'] as const,
})

export const personinsightsRetriesTotal = new Counter({
    name: 'personinsights_retries_total',
    help: 'Total PersonHog gRPC retries before success or exhaustion',
    labelNames: ['method', 'client', 'error_type'] as const,
})

export const personinsightsTerminalErrorsTotal = new Counter({
    name: 'personinsights_terminal_errors_total',
    help: 'PersonHog gRPC errors after retry exhaustion — the request was not fulfilled',
    labelNames: ['method', 'client', 'error_type'] as const,
})

export function grpcErrorType(error: unknown): string {
    if (error instanceof ConnectError) {
        return Code[error.code] ?? 'unknown'
    }
    return 'non_grpc'
}

export const personinsightsLatencySeconds = new Histogram({
    name: 'personinsights_latency_seconds',
    help: 'PersonHog request latency in seconds',
    labelNames: ['method', 'source', 'client'] as const,
    buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
})

export async function timedPostgres<T>(clientLabel: string, method: string, fn: () => Promise<T>): Promise<T> {
    const end = personinsightsLatencySeconds.startTimer({ method, source: 'postgres', client: clientLabel })
    try {
        return await fn()
    } finally {
        end()
        personinsightsRequestsTotal.inc({ method, source: 'postgres', client: clientLabel })
    }
}

export async function timedGrpc<T>(clientLabel: string, method: string, fn: () => Promise<T>): Promise<T> {
    const end = personinsightsLatencySeconds.startTimer({ method, source: 'grpc', client: clientLabel })
    try {
        return await fn()
    } catch (error) {
        personinsightsErrorsTotal.inc({ method, client: clientLabel, error_type: grpcErrorType(error) })
        throw error
    } finally {
        end()
        personinsightsRequestsTotal.inc({ method, source: 'grpc', client: clientLabel })
    }
}
