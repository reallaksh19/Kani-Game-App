import { AttemptFilter, KaniAttemptV1 } from './contracts';
import { AttemptStore } from './AttemptStore';
import { AttemptHistoryConflict, mergeAttemptHistory } from './mergeAttemptHistory';
import { LearnerApiClient } from './LearnerApiClient';

export interface RemoteAwareAttemptStoreOptions {
  localStore: AttemptStore;
  api: LearnerApiClient;
  maxRemotePages?: number;
  onRemoteReadError?: (error: unknown) => void;
  onHistoryConflicts?: (conflicts: AttemptHistoryConflict[]) => void;
}

function applyFilter(attempts: KaniAttemptV1[], filter: AttemptFilter): KaniAttemptV1[] {
  let result = attempts;
  if (filter.activityId) result = result.filter((attempt) => attempt.activityId === filter.activityId);
  if (filter.activityType) result = result.filter((attempt) => attempt.activityType === filter.activityType);
  if (filter.topicId) result = result.filter((attempt) => attempt.topicId === filter.topicId);
  if (filter.skillId) result = result.filter((attempt) => attempt.skillIds.includes(filter.skillId as string));
  if (filter.limit != null) result = result.slice(0, Math.max(0, filter.limit));
  return result;
}

/**
 * Read-through adapter for cross-device evidence. Local storage remains writable
 * and usable if remote auth/network is unavailable. This class intentionally
 * does not own the sync outbox; callers should pass LocalFirstAttemptStore when
 * remote upload queueing is desired.
 */
export class RemoteAwareAttemptStore implements AttemptStore {
  private readonly localStore: AttemptStore;
  private readonly api: LearnerApiClient;
  private readonly maxRemotePages: number;
  private readonly onRemoteReadError?: RemoteAwareAttemptStoreOptions['onRemoteReadError'];
  private readonly onHistoryConflicts?: RemoteAwareAttemptStoreOptions['onHistoryConflicts'];

  constructor(options: RemoteAwareAttemptStoreOptions) {
    this.localStore = options.localStore;
    this.api = options.api;
    this.maxRemotePages = Math.max(1, options.maxRemotePages || 10);
    this.onRemoteReadError = options.onRemoteReadError;
    this.onHistoryConflicts = options.onHistoryConflicts;
  }

  recordAttempt(input: KaniAttemptV1): Promise<void> {
    return this.localStore.recordAttempt(input);
  }

  async listAttempts(studentId: string, filter: AttemptFilter = {}): Promise<KaniAttemptV1[]> {
    const local = await this.localStore.listAttempts(studentId);
    if (!studentId.trim()) return applyFilter(local, filter);

    try {
      const remote: KaniAttemptV1[] = [];
      let cursor: string | null = null;
      for (let page = 0; page < this.maxRemotePages; page += 1) {
        const history = await this.api.getHistory(studentId, { cursor, limit: 100 });
        remote.push(...history.attempts);
        cursor = history.nextCursor;
        if (!cursor) break;
      }

      const merged = mergeAttemptHistory(local, remote);
      if (merged.conflicts.length > 0) this.onHistoryConflicts?.(merged.conflicts);
      return applyFilter(merged.attempts, filter);
    } catch (error) {
      this.onRemoteReadError?.(error);
      return applyFilter(local, filter);
    }
  }
}
