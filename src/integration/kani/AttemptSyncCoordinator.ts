import { KaniAttemptV1 } from './contracts';
import { LocalAttemptSyncQueue } from './AttemptSyncQueue';
import { AttemptUploadResult, LearnerApiError } from './LearnerApiClient';

export interface AttemptUploadClient {
  uploadAttempts(attempts: readonly KaniAttemptV1[]): Promise<AttemptUploadResult>;
}

export interface SyncFlushResult {
  attempted: number;
  synced: number;
  blocked: number;
  deferred: number;
  reason?: string;
}

export class AttemptSyncCoordinator {
  constructor(
    private readonly queue: LocalAttemptSyncQueue,
    private readonly api: AttemptUploadClient,
  ) {}

  async flush(options: { nowMs?: number; limit?: number; random?: () => number } = {}): Promise<SyncFlushResult> {
    const nowMs = options.nowMs ?? Date.now();
    const entries = this.queue.listReady(nowMs, Math.min(50, Math.max(1, options.limit || 50)));
    if (entries.length === 0) return { attempted: 0, synced: 0, blocked: 0, deferred: 0 };

    const ids = entries.map((entry) => entry.attempt.attemptId);
    try {
      await this.api.uploadAttempts(entries.map((entry) => entry.attempt));
      this.queue.markSucceeded(ids);
      return { attempted: entries.length, synced: entries.length, blocked: 0, deferred: 0 };
    } catch (error) {
      if (error instanceof LearnerApiError) {
        // Authentication, household selection and missing profile linkage are
        // resolvable state transitions. Leave the queue intact for the next run.
        if (
          error.code === 'UNAUTHENTICATED'
          || error.code === 'HOUSEHOLD_SELECTION_REQUIRED'
          || error.code === 'HOUSEHOLD_NOT_LINKED'
          || error.code === 'HOUSEHOLD_FORBIDDEN'
          || error.code === 'STUDENT_NOT_FOUND'
        ) {
          return {
            attempted: entries.length,
            synced: 0,
            blocked: 0,
            deferred: entries.length,
            reason: error.code,
          };
        }

        const terminal = error.code === 'ATTEMPT_ID_CONFLICT'
          || error.status === 400
          || error.status === 413;
        this.queue.markFailed(ids, `${error.code}: ${error.message}`, {
          nowMs,
          retryAfterSeconds: error.retryAfterSeconds,
          terminal,
          random: options.random,
        });
        return {
          attempted: entries.length,
          synced: 0,
          blocked: terminal ? entries.length : 0,
          deferred: terminal ? 0 : entries.length,
          reason: error.code,
        };
      }

      this.queue.markFailed(ids, error instanceof Error ? error.message : 'Unknown sync error', {
        nowMs,
        random: options.random,
      });
      return {
        attempted: entries.length,
        synced: 0,
        blocked: 0,
        deferred: entries.length,
        reason: 'UNKNOWN_ERROR',
      };
    }
  }
}
