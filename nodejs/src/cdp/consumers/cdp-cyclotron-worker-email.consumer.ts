import { PluginsServerConfig } from '~/types'

import { JobQueue } from '../services/job-queue/job-queue.interface'
import { CdpConsumerBaseDeps } from './cdp-base.consumer'
import { CdpCyclotronWorkerFlow } from './cdp-cyclotron-worker-flow.consumer'

export class CdpCyclotronWorkerEmail extends CdpCyclotronWorkerFlow {
    protected override name = 'CdpCyclotronWorkerEmail'

    constructor(config: PluginsServerConfig, deps: CdpConsumerBaseDeps, jobQueue: JobQueue) {
        super(config, deps, jobQueue)
        this.queue = 'email'
    }
}
