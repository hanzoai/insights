export class DecompressionWorkerManager {
    async decompress(compressedData: Uint8Array): Promise<Uint8Array> {
        return compressedData
    }

    terminate(): void {
        // No-op for tests
    }
}

let workerManager: DecompressionWorkerManager | null = null
let currentInsights: any | undefined

export function getDecompressionWorkerManager(insights?: any): DecompressionWorkerManager {
    const configChanged = currentInsights !== insights

    if (configChanged && workerManager) {
        terminateDecompressionWorker()
    }

    if (!workerManager) {
        workerManager = new DecompressionWorkerManager()
        currentInsights = insights
    }
    return workerManager
}

export function terminateDecompressionWorker(): void {
    if (workerManager) {
        workerManager.terminate()
        workerManager = null
    }
    currentInsights = undefined
}
