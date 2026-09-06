import { AttemptStore, LocalAttemptStore } from './AttemptStore';
import { LocalFirstAttemptStore } from './LocalFirstAttemptStore';
import { getLearnerSyncConfig } from './learnerSyncConfig';
import { signalAttemptQueued } from './learnerSyncEvents';

/**
 * Single construction seam for learner-evidence writes. Reads may continue to use
 * LocalAttemptStore directly; writes use this factory so a configured deployment
 * can enqueue offline-safe sync metadata without changing feature components.
 */
export function createCanonicalAttemptStore(): AttemptStore {
  const sync = getLearnerSyncConfig();
  if (!sync.ready) return new LocalAttemptStore();

  return new LocalFirstAttemptStore({
    localStore: new LocalAttemptStore(),
    queueEnabled: true,
    onQueued: signalAttemptQueued,
    onQueueError: (error, attempt) => {
      console.warn(`Canonical attempt ${attempt.attemptId} was saved locally but could not be queued for sync.`, error);
    },
  });
}
