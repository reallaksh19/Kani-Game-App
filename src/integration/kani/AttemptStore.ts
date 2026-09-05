import { AttemptFilter, KaniAttemptV1 } from './contracts';
import { assertKaniAttempt } from './validators';

export interface AttemptStore {
  recordAttempt(input: KaniAttemptV1): Promise<void>;
  listAttempts(studentId: string, filter?: AttemptFilter): Promise<KaniAttemptV1[]>;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const DEFAULT_STORAGE_KEY = 'kani-attempts-v1';
const DEFAULT_MAX_ATTEMPTS = 500;

function parseStoredAttempts(raw: string | null): KaniAttemptV1[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is KaniAttemptV1 => {
      try {
        assertKaniAttempt(entry);
        return true;
      } catch {
        return false;
      }
    });
  } catch {
    return [];
  }
}

export class LocalAttemptStore implements AttemptStore {
  private readonly storage: KeyValueStorage;
  private readonly storageKey: string;
  private readonly maxAttempts: number;

  constructor(options?: { storage?: KeyValueStorage; storageKey?: string; maxAttempts?: number }) {
    this.storage = options?.storage || localStorage;
    this.storageKey = options?.storageKey || DEFAULT_STORAGE_KEY;
    this.maxAttempts = Math.max(1, options?.maxAttempts || DEFAULT_MAX_ATTEMPTS);
  }

  async recordAttempt(input: KaniAttemptV1): Promise<void> {
    assertKaniAttempt(input);
    const current = parseStoredAttempts(this.storage.getItem(this.storageKey));
    const withoutSameId = current.filter((attempt) => attempt.attemptId !== input.attemptId);
    const next = [input, ...withoutSameId]
      .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
      .slice(0, this.maxAttempts);
    this.storage.setItem(this.storageKey, JSON.stringify(next));
  }

  async listAttempts(studentId: string, filter: AttemptFilter = {}): Promise<KaniAttemptV1[]> {
    if (!studentId.trim()) return [];
    let attempts = parseStoredAttempts(this.storage.getItem(this.storageKey))
      .filter((attempt) => attempt.studentId === studentId);

    if (filter.activityId) attempts = attempts.filter((attempt) => attempt.activityId === filter.activityId);
    if (filter.activityType) attempts = attempts.filter((attempt) => attempt.activityType === filter.activityType);
    if (filter.topicId) attempts = attempts.filter((attempt) => attempt.topicId === filter.topicId);
    if (filter.skillId) attempts = attempts.filter((attempt) => attempt.skillIds.includes(filter.skillId as string));
    if (filter.limit != null) attempts = attempts.slice(0, Math.max(0, filter.limit));
    return attempts;
  }
}
