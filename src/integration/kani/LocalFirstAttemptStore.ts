import { AttemptFilter, KaniAttemptV1 } from './contracts';
import { AttemptStore, LocalAttemptStore } from './AttemptStore';
import { LocalAttemptSyncQueue } from './AttemptSyncQueue';

export interface LocalFirstAttemptStoreOptions {
  localStore?: AttemptStore;
  syncQueue?: LocalAttemptSyncQueue;
  queueEnabled?: boolean;
  onQueueError?: (error: unknown, attempt: KaniAttemptV1) => void;
}

/**
 * Writes canonical learner evidence locally first. Queue failures never roll back
 * the local learner record, so offline/backend outages cannot block learning.
 */
export class LocalFirstAttemptStore implements AttemptStore {
  private readonly localStore: AttemptStore;
  private readonly syncQueue: LocalAttemptSyncQueue;
  private readonly queueEnabled: boolean;
  private readonly onQueueError?: LocalFirstAttemptStoreOptions['onQueueError'];

  constructor(options: LocalFirstAttemptStoreOptions = {}) {
    this.localStore = options.localStore || new LocalAttemptStore();
    this.syncQueue = options.syncQueue || new LocalAttemptSyncQueue();
    this.queueEnabled = options.queueEnabled ?? false;
    this.onQueueError = options.onQueueError;
  }

  async recordAttempt(input: KaniAttemptV1): Promise<void> {
    await this.localStore.recordAttempt(input);
    if (!this.queueEnabled) return;

    try {
      this.syncQueue.enqueue(input);
    } catch (error) {
      this.onQueueError?.(error, input);
      // Local persistence is authoritative while sync is unavailable. Do not
      // reject the learner action because queue metadata could not be written.
    }
  }

  listAttempts(studentId: string, filter?: AttemptFilter): Promise<KaniAttemptV1[]> {
    return this.localStore.listAttempts(studentId, filter);
  }
}
