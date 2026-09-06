import { KaniAttemptV1 } from './contracts';
import { assertKaniAttempt } from './validators';
import { canonicalJson } from './canonicalJson';

export type AttemptSyncState = 'pending' | 'retrying' | 'blocked';

export interface AttemptSyncMetadata {
  state: AttemptSyncState;
  queuedAt: string;
  retryCount: number;
  nextAttemptAt: string | null;
  lastError?: string;
  updatedAt: string;
}

export interface AttemptSyncQueueEntry {
  attempt: KaniAttemptV1;
  meta: AttemptSyncMetadata;
}

export interface SyncQueueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class AttemptSyncConflictError extends Error {
  constructor(attemptId: string) {
    super(`Attempt ${attemptId} is already queued with a different immutable payload.`);
    this.name = 'AttemptSyncConflictError';
  }
}

export class AttemptSyncQueueFullError extends Error {
  constructor(maxEntries: number) {
    super(`Attempt sync queue reached its ${maxEntries}-entry safety limit. Existing pending evidence was preserved.`);
    this.name = 'AttemptSyncQueueFullError';
  }
}

const DEFAULT_STORAGE_KEY = 'kani-attempt-sync-v1';
const DEFAULT_MAX_ENTRIES = 2000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;
const BASE_BACKOFF_MS = 2000;

function isoFromMs(value: number): string {
  return new Date(value).toISOString();
}

function parseEntries(raw: string | null): AttemptSyncQueueEntry[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is AttemptSyncQueueEntry => {
      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) return false;
      const candidate = entry as AttemptSyncQueueEntry;
      try {
        assertKaniAttempt(candidate.attempt);
      } catch {
        return false;
      }
      const meta = candidate.meta;
      return !!meta
        && ['pending', 'retrying', 'blocked'].includes(meta.state)
        && typeof meta.queuedAt === 'string'
        && Number.isInteger(meta.retryCount)
        && meta.retryCount >= 0
        && (meta.nextAttemptAt === null || typeof meta.nextAttemptAt === 'string')
        && typeof meta.updatedAt === 'string';
    });
  } catch {
    return [];
  }
}

export function computeRetryDelayMs(retryCount: number, random: () => number = Math.random): number {
  const normalizedRetry = Math.max(1, Math.floor(retryCount));
  const exponential = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * (2 ** (normalizedRetry - 1)));
  const boundedRandom = Math.min(1, Math.max(0, random()));
  const jitterMultiplier = 0.75 + (boundedRandom * 0.5);
  return Math.round(exponential * jitterMultiplier);
}

export class LocalAttemptSyncQueue {
  private readonly storage: SyncQueueStorage;
  private readonly storageKey: string;
  private readonly maxEntries: number;

  constructor(options?: { storage?: SyncQueueStorage; storageKey?: string; maxEntries?: number }) {
    this.storage = options?.storage || localStorage;
    this.storageKey = options?.storageKey || DEFAULT_STORAGE_KEY;
    this.maxEntries = Math.max(1, options?.maxEntries || DEFAULT_MAX_ENTRIES);
  }

  private read(): AttemptSyncQueueEntry[] {
    return parseEntries(this.storage.getItem(this.storageKey));
  }

  private write(entries: AttemptSyncQueueEntry[]): void {
    // Never truncate a durable outbox silently. If the queue is full, enqueue()
    // rejects the new metadata while LocalFirstAttemptStore keeps the learner's
    // canonical attempt in local history.
    this.storage.setItem(this.storageKey, JSON.stringify(entries));
  }

  enqueue(attempt: KaniAttemptV1, nowMs = Date.now()): void {
    assertKaniAttempt(attempt);
    const entries = this.read();
    const existing = entries.find((entry) => entry.attempt.attemptId === attempt.attemptId);
    if (existing) {
      if (canonicalJson(existing.attempt) !== canonicalJson(attempt)) {
        throw new AttemptSyncConflictError(attempt.attemptId);
      }
      return;
    }

    if (entries.length >= this.maxEntries) {
      throw new AttemptSyncQueueFullError(this.maxEntries);
    }

    const now = isoFromMs(nowMs);
    this.write([
      {
        attempt,
        meta: {
          state: 'pending',
          queuedAt: now,
          retryCount: 0,
          nextAttemptAt: now,
          updatedAt: now,
        },
      },
      ...entries,
    ]);
  }

  listAll(): AttemptSyncQueueEntry[] {
    return this.read();
  }

  listReady(nowMs = Date.now(), limit = 50): AttemptSyncQueueEntry[] {
    return this.read()
      .filter((entry) => {
        if (entry.meta.state === 'blocked' || !entry.meta.nextAttemptAt) return false;
        const nextAt = Date.parse(entry.meta.nextAttemptAt);
        return Number.isFinite(nextAt) && nextAt <= nowMs;
      })
      .sort((a, b) => Date.parse(a.meta.queuedAt) - Date.parse(b.meta.queuedAt))
      .slice(0, Math.max(0, limit));
  }

  markSucceeded(attemptIds: readonly string[]): void {
    const ids = new Set(attemptIds);
    if (ids.size === 0) return;
    this.write(this.read().filter((entry) => !ids.has(entry.attempt.attemptId)));
  }

  markFailed(
    attemptIds: readonly string[],
    error: string,
    options: { nowMs?: number; retryAfterSeconds?: number | null; terminal?: boolean; random?: () => number } = {},
  ): void {
    const ids = new Set(attemptIds);
    if (ids.size === 0) return;
    const nowMs = options.nowMs ?? Date.now();
    const now = isoFromMs(nowMs);

    this.write(this.read().map((entry) => {
      if (!ids.has(entry.attempt.attemptId)) return entry;
      const retryCount = entry.meta.retryCount + 1;
      if (options.terminal) {
        return {
          ...entry,
          meta: {
            ...entry.meta,
            state: 'blocked' as const,
            retryCount,
            nextAttemptAt: null,
            lastError: error,
            updatedAt: now,
          },
        };
      }

      const computedDelay = computeRetryDelayMs(retryCount, options.random);
      const retryAfterMs = Math.max(0, (options.retryAfterSeconds || 0) * 1000);
      return {
        ...entry,
        meta: {
          ...entry.meta,
          state: 'retrying' as const,
          retryCount,
          nextAttemptAt: isoFromMs(nowMs + Math.max(computedDelay, retryAfterMs)),
          lastError: error,
          updatedAt: now,
        },
      };
    }));
  }

  counts(): { pending: number; retrying: number; blocked: number; total: number } {
    const entries = this.read();
    return entries.reduce((summary, entry) => {
      summary[entry.meta.state] += 1;
      summary.total += 1;
      return summary;
    }, { pending: 0, retrying: 0, blocked: 0, total: 0 });
  }
}
