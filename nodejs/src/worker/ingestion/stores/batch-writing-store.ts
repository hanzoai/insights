import { FlushResult } from '../persons/persons-store'

export interface BatchWritingStore {
    /*
     * Flushes all batch data that needs to be written
     * Returns stream messages that need to be sent
     */
    flush(): Promise<FlushResult[]>
}
