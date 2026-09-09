import { canonicalSha256 } from '../../../domain/canonicalHash';
import type { AttemptFilter, KaniAttemptV1 } from '../../../integration/kani/contracts';
import { assertKaniAttempt } from '../../../integration/kani/validators';
import {
  HouseholdRecord,
  ImmutableRecordConflictError,
  KaniStore,
  MembershipRecord,
  StudentRecord,
} from '../../../ports/storage';

function requireId(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function scopedKey(householdId: string, id: string): string {
  return `${householdId}\u0000${id}`;
}

function cloneAttempt(value: KaniAttemptV1): KaniAttemptV1 {
  return JSON.parse(JSON.stringify(value)) as KaniAttemptV1;
}

export class MemoryStore implements KaniStore {
  private readonly householdRows = new Map<string, { record: HouseholdRecord; hash: string }>();
  private readonly studentRows = new Map<string, { record: StudentRecord; hash: string }>();
  private readonly membershipRows = new Map<string, { record: MembershipRecord; hash: string }>();
  private readonly attemptRows = new Map<string, { record: KaniAttemptV1; hash: string }>();

  readonly households = {
    put: async (record: HouseholdRecord): Promise<void> => {
      const householdId = requireId(record.householdId, 'householdId');
      const normalized = { ...record, householdId };
      const hash = canonicalSha256(normalized);
      const existing = this.householdRows.get(householdId);
      if (existing && existing.hash !== hash) throw new ImmutableRecordConflictError('household', householdId);
      if (!existing) this.householdRows.set(householdId, { record: normalized, hash });
    },
    get: async (householdId: string): Promise<HouseholdRecord | null> => {
      const row = this.householdRows.get(householdId.trim());
      return row ? { ...row.record } : null;
    },
  };

  readonly students = {
    put: async (record: StudentRecord): Promise<void> => {
      const householdId = requireId(record.householdId, 'householdId');
      const studentId = requireId(record.studentId, 'studentId');
      const normalized = { ...record, householdId, studentId };
      const key = scopedKey(householdId, studentId);
      const hash = canonicalSha256(normalized);
      const existing = this.studentRows.get(key);
      if (existing && existing.hash !== hash) throw new ImmutableRecordConflictError('student', studentId);
      if (!existing) this.studentRows.set(key, { record: normalized, hash });
    },
    get: async (householdId: string, studentId: string): Promise<StudentRecord | null> => {
      const row = this.studentRows.get(scopedKey(householdId.trim(), studentId.trim()));
      return row ? { ...row.record } : null;
    },
    listByHousehold: async (householdId: string): Promise<StudentRecord[]> => {
      const normalized = householdId.trim();
      return [...this.studentRows.values()]
        .map(({ record }) => record)
        .filter((record) => record.householdId === normalized)
        .sort((a, b) => a.studentId.localeCompare(b.studentId))
        .map((record) => ({ ...record }));
    },
  };

  readonly memberships = {
    put: async (record: MembershipRecord): Promise<void> => {
      const householdId = requireId(record.householdId, 'householdId');
      const userId = requireId(record.userId, 'userId');
      const normalized = { ...record, householdId, userId };
      const key = scopedKey(householdId, userId);
      const hash = canonicalSha256(normalized);
      const existing = this.membershipRows.get(key);
      if (existing && existing.hash !== hash) throw new ImmutableRecordConflictError('membership', key);
      if (!existing) this.membershipRows.set(key, { record: normalized, hash });
    },
    listByUser: async (userId: string): Promise<MembershipRecord[]> => {
      const normalized = userId.trim();
      return [...this.membershipRows.values()]
        .map(({ record }) => record)
        .filter((record) => record.userId === normalized)
        .sort((a, b) => a.householdId.localeCompare(b.householdId))
        .map((record) => ({ ...record }));
    },
    isMember: async (householdId: string, userId: string): Promise<boolean> => (
      this.membershipRows.has(scopedKey(householdId.trim(), userId.trim()))
    ),
  };

  readonly attempts = {
    recordAttempt: async (input: KaniAttemptV1): Promise<void> => {
      assertKaniAttempt(input);
      const hash = canonicalSha256(input);
      const existing = this.attemptRows.get(input.attemptId);
      if (existing && existing.hash !== hash) throw new ImmutableRecordConflictError('attempt', input.attemptId);
      if (!existing) this.attemptRows.set(input.attemptId, { record: cloneAttempt(input), hash });
    },
    listAttempts: async (studentId: string, filter: AttemptFilter = {}): Promise<KaniAttemptV1[]> => {
      const normalizedStudentId = studentId.trim();
      if (!normalizedStudentId) return [];
      let attempts = [...this.attemptRows.values()]
        .map(({ record }) => record)
        .filter((attempt) => attempt.studentId === normalizedStudentId)
        .sort((a, b) => {
          const time = Date.parse(b.completedAt) - Date.parse(a.completedAt);
          return time || b.attemptId.localeCompare(a.attemptId);
        });
      if (filter.activityId) attempts = attempts.filter((attempt) => attempt.activityId === filter.activityId);
      if (filter.activityType) attempts = attempts.filter((attempt) => attempt.activityType === filter.activityType);
      if (filter.topicId) attempts = attempts.filter((attempt) => attempt.topicId === filter.topicId);
      if (filter.skillId) attempts = attempts.filter((attempt) => attempt.skillIds.includes(filter.skillId as string));
      if (filter.limit != null) attempts = attempts.slice(0, Math.max(0, filter.limit));
      return attempts.map(cloneAttempt);
    },
  };
}
