import { DatabaseSync } from 'node:sqlite';
import { canonicalSha256 } from '../../../domain/canonicalHash';
import { canonicalJson } from '../../../domain/canonicalJson';
import type { AttemptFilter, KaniAttemptV1 } from '../../../integration/kani/contracts';
import { assertKaniAttempt } from '../../../integration/kani/validators';
import type {
  AttemptBatchSaveResult,
  AttemptEvidenceWindow,
  AttemptHistoryCursor,
  AttemptHistoryPage,
  BackendHealth,
  KaniApiStore,
  StoredStudentProfile,
  WriteQuotaResult,
} from '../../../ports/backend';
import { StorageRecordNotFoundError } from '../../../ports/backend';
import type { HouseholdRecord, KaniStore, MembershipRecord, StudentRecord } from '../../../ports/storage';
import { ImmutableRecordConflictError } from '../../../ports/storage';
import { runSqliteMigrations } from './runMigrations';
import { SQLITE_SCHEMA_VERSION } from './migrations';

interface SQLiteStoreOptions {
  path?: string;
  now?: () => string;
}

function requireId(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function parseAttempt(raw: string): KaniAttemptV1 {
  const value = JSON.parse(raw) as KaniAttemptV1;
  assertKaniAttempt(value);
  return value;
}

function toStoredStudent(row: Record<string, unknown>): StoredStudentProfile {
  return {
    studentId: String(row.student_id),
    name: String(row.name),
    avatar: String(row.avatar),
    grade: String(row.grade),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/**
 * Connector-free SQLite implementation of both the E2 low-level KaniStore ports
 * and the application-facing KaniApiStore. Requires Node 22+ `node:sqlite`.
 */
export class SQLiteStore implements KaniStore, KaniApiStore {
  private readonly db: DatabaseSync;
  private readonly now: () => string;
  readonly migrationVersion: number;

  constructor(options: SQLiteStoreOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.db = new DatabaseSync(options.path ?? ':memory:');
    this.db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;');
    this.migrationVersion = runSqliteMigrations(this.db, this.now).version;
  }

  close(): void {
    this.db.close();
  }

  backupTo(path: string): void {
    const normalized = requireId(path, 'backup path');
    const escaped = normalized.replace(/'/g, "''");
    this.db.exec(`VACUUM INTO '${escaped}'`);
  }

  readonly households = {
    put: async (record: HouseholdRecord): Promise<void> => {
      const householdId = requireId(record.householdId, 'householdId');
      const normalized = { householdId };
      const hash = canonicalSha256(normalized);
      const existing = this.db.prepare('SELECT payload_hash FROM kani_households WHERE household_id = ?').get(householdId) as { payload_hash: string } | undefined;
      if (existing) {
        if (existing.payload_hash !== hash) throw new ImmutableRecordConflictError('household', householdId);
        return;
      }
      this.db.prepare('INSERT INTO kani_households(household_id, payload_hash, created_at) VALUES (?, ?, ?)').run(householdId, hash, this.now());
    },
    get: async (householdId: string): Promise<HouseholdRecord | null> => {
      const normalized = householdId.trim();
      if (!normalized) return null;
      const row = this.db.prepare('SELECT household_id FROM kani_households WHERE household_id = ?').get(normalized) as { household_id: string } | undefined;
      return row ? { householdId: row.household_id } : null;
    },
  };

  readonly students = {
    put: async (record: StudentRecord): Promise<void> => {
      const householdId = requireId(record.householdId, 'householdId');
      const studentId = requireId(record.studentId, 'studentId');
      const normalized: StudentRecord = { ...record, householdId, studentId };
      const hash = canonicalSha256(normalized);
      const existing = this.db.prepare('SELECT household_id, payload_hash FROM kani_students WHERE student_id = ?').get(studentId) as { household_id: string; payload_hash: string } | undefined;
      if (existing) {
        if (existing.household_id !== householdId || existing.payload_hash !== hash) throw new ImmutableRecordConflictError('student', studentId);
        return;
      }
      const timestamp = this.now();
      this.db.prepare(`
        INSERT INTO kani_students(household_id, student_id, name, avatar, grade, payload_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(householdId, studentId, normalized.name, normalized.avatar, normalized.grade, hash, timestamp, timestamp);
    },
    get: async (householdId: string, studentId: string): Promise<StudentRecord | null> => {
      const row = this.db.prepare(`
        SELECT household_id, student_id, name, avatar, grade
        FROM kani_students WHERE household_id = ? AND student_id = ?
      `).get(householdId.trim(), studentId.trim()) as Record<string, unknown> | undefined;
      return row ? {
        householdId: String(row.household_id),
        studentId: String(row.student_id),
        name: String(row.name),
        avatar: String(row.avatar),
        grade: String(row.grade),
      } : null;
    },
    listByHousehold: async (householdId: string): Promise<StudentRecord[]> => {
      const rows = this.db.prepare(`
        SELECT household_id, student_id, name, avatar, grade
        FROM kani_students WHERE household_id = ? ORDER BY student_id ASC
      `).all(householdId.trim()) as Array<Record<string, unknown>>;
      return rows.map((row) => ({
        householdId: String(row.household_id),
        studentId: String(row.student_id),
        name: String(row.name),
        avatar: String(row.avatar),
        grade: String(row.grade),
      }));
    },
  };

  readonly memberships = {
    put: async (record: MembershipRecord): Promise<void> => {
      const householdId = requireId(record.householdId, 'householdId');
      const userId = requireId(record.userId, 'userId');
      const normalized: MembershipRecord = { ...record, householdId, userId };
      const hash = canonicalSha256(normalized);
      const existing = this.db.prepare(`
        SELECT payload_hash FROM kani_household_members WHERE household_id = ? AND user_id = ?
      `).get(householdId, userId) as { payload_hash: string } | undefined;
      if (existing) {
        if (existing.payload_hash !== hash) throw new ImmutableRecordConflictError('membership', `${householdId}:${userId}`);
        return;
      }
      this.db.prepare(`
        INSERT INTO kani_household_members(household_id, user_id, role, payload_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(householdId, userId, normalized.role, hash, this.now());
    },
    listByUser: async (userId: string): Promise<MembershipRecord[]> => {
      const rows = this.db.prepare(`
        SELECT household_id, user_id, role FROM kani_household_members WHERE user_id = ? ORDER BY household_id ASC
      `).all(userId.trim()) as Array<Record<string, unknown>>;
      return rows.map((row) => ({ householdId: String(row.household_id), userId: String(row.user_id), role: 'guardian' as const }));
    },
    isMember: async (householdId: string, userId: string): Promise<boolean> => {
      const row = this.db.prepare(`
        SELECT 1 AS present FROM kani_household_members WHERE household_id = ? AND user_id = ?
      `).get(householdId.trim(), userId.trim()) as { present: number } | undefined;
      return Boolean(row);
    },
  };

  readonly attempts = {
    recordAttempt: async (input: KaniAttemptV1): Promise<void> => {
      assertKaniAttempt(input);
      const student = this.db.prepare('SELECT household_id FROM kani_students WHERE student_id = ?').get(input.studentId) as { household_id: string } | undefined;
      if (!student) throw new StorageRecordNotFoundError('student', input.studentId);
      await this.saveAttempts(student.household_id, [input]);
    },
    listAttempts: async (studentId: string, filter: AttemptFilter = {}): Promise<KaniAttemptV1[]> => {
      const normalizedStudentId = studentId.trim();
      if (!normalizedStudentId) return [];
      let attempts = (this.db.prepare(`
        SELECT payload_json FROM kani_attempts
        WHERE student_id = ?
        ORDER BY completed_at DESC, attempt_id DESC
      `).all(normalizedStudentId) as Array<{ payload_json: string }>).map((row) => parseAttempt(row.payload_json));
      if (filter.activityId) attempts = attempts.filter((attempt) => attempt.activityId === filter.activityId);
      if (filter.activityType) attempts = attempts.filter((attempt) => attempt.activityType === filter.activityType);
      if (filter.topicId) attempts = attempts.filter((attempt) => attempt.topicId === filter.topicId);
      if (filter.skillId) attempts = attempts.filter((attempt) => attempt.skillIds.includes(filter.skillId as string));
      if (filter.limit != null) attempts = attempts.slice(0, Math.max(0, filter.limit));
      return attempts;
    },
  };

  async listHouseholdIdsForUser(userId: string): Promise<string[]> {
    return (await this.memberships.listByUser(userId)).map((membership) => membership.householdId);
  }

  async isHouseholdMember(householdId: string, userId: string): Promise<boolean> {
    return this.memberships.isMember(householdId, userId);
  }

  async listStudents(householdId: string): Promise<StoredStudentProfile[]> {
    const rows = this.db.prepare(`
      SELECT student_id, name, avatar, grade, created_at, updated_at
      FROM kani_students WHERE household_id = ? ORDER BY created_at ASC, student_id ASC
    `).all(householdId.trim()) as Array<Record<string, unknown>>;
    return rows.map(toStoredStudent);
  }

  async createStudent(householdId: string, student: Omit<StudentRecord, 'householdId'>): Promise<{ created: boolean; student: StoredStudentProfile }> {
    const normalized: StudentRecord = { ...student, householdId: requireId(householdId, 'householdId'), studentId: requireId(student.studentId, 'studentId') };
    const existing = this.db.prepare(`
      SELECT household_id, student_id, name, avatar, grade, payload_hash, created_at, updated_at
      FROM kani_students WHERE student_id = ?
    `).get(normalized.studentId) as Record<string, unknown> | undefined;
    const hash = canonicalSha256(normalized);
    if (existing) {
      if (String(existing.household_id) !== normalized.householdId || String(existing.payload_hash) !== hash) {
        throw new ImmutableRecordConflictError('student', normalized.studentId);
      }
      return { created: false, student: toStoredStudent(existing) };
    }
    await this.students.put(normalized);
    const created = this.db.prepare(`
      SELECT student_id, name, avatar, grade, created_at, updated_at FROM kani_students WHERE student_id = ?
    `).get(normalized.studentId) as Record<string, unknown>;
    return { created: true, student: toStoredStudent(created) };
  }

  async hasStudent(householdId: string, studentId: string): Promise<boolean> {
    return (await this.students.get(householdId, studentId)) !== null;
  }

  async saveAttempts(householdId: string, attempts: readonly KaniAttemptV1[]): Promise<AttemptBatchSaveResult> {
    const normalizedHousehold = requireId(householdId, 'householdId');
    attempts.forEach(assertKaniAttempt);
    const findStudent = this.db.prepare('SELECT 1 AS present FROM kani_students WHERE household_id = ? AND student_id = ?');
    const findAttempt = this.db.prepare('SELECT household_id, payload_hash FROM kani_attempts WHERE attempt_id = ?');
    const insertAttempt = this.db.prepare(`
      INSERT INTO kani_attempts(
        attempt_id, household_id, student_id, activity_id, activity_type, source_app,
        topic_id, skill_ids_json, completed_at, payload_json, payload_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.db.exec('BEGIN IMMEDIATE');
    try {
      for (const attempt of attempts) {
        const student = findStudent.get(normalizedHousehold, attempt.studentId) as { present: number } | undefined;
        if (!student) throw new StorageRecordNotFoundError('student', attempt.studentId);
      }

      const newAttempts: KaniAttemptV1[] = [];
      for (const attempt of attempts) {
        const existing = findAttempt.get(attempt.attemptId) as { household_id: string; payload_hash: string } | undefined;
        const hash = canonicalSha256(attempt);
        if (existing) {
          if (existing.household_id !== normalizedHousehold || existing.payload_hash !== hash) {
            throw new ImmutableRecordConflictError('attempt', attempt.attemptId);
          }
        } else {
          newAttempts.push(attempt);
        }
      }

      for (const attempt of newAttempts) {
        insertAttempt.run(
          attempt.attemptId,
          normalizedHousehold,
          attempt.studentId,
          attempt.activityId,
          attempt.activityType,
          attempt.sourceApp,
          attempt.topicId ?? null,
          JSON.stringify(attempt.skillIds),
          attempt.completedAt,
          canonicalJson(attempt),
          canonicalSha256(attempt),
          this.now(),
        );
      }
      this.db.exec('COMMIT');
      return {
        accepted: attempts.length,
        created: newAttempts.length,
        existing: attempts.length - newAttempts.length,
        idempotentReplay: newAttempts.length === 0,
      };
    } catch (error) {
      try { this.db.exec('ROLLBACK'); } catch { /* preserve original storage error */ }
      throw error;
    }
  }

  async listAttemptPage(householdId: string, studentId: string, options: { limit: number; cursor: AttemptHistoryCursor | null }): Promise<AttemptHistoryPage> {
    const params: Array<string | number> = [householdId.trim(), studentId.trim()];
    let cursorSql = '';
    if (options.cursor) {
      cursorSql = ' AND (completed_at < ? OR (completed_at = ? AND attempt_id < ?))';
      params.push(options.cursor.completedAt, options.cursor.completedAt, options.cursor.attemptId);
    }
    params.push(options.limit + 1);
    const rows = this.db.prepare(`
      SELECT attempt_id, completed_at, payload_json FROM kani_attempts
      WHERE household_id = ? AND student_id = ?${cursorSql}
      ORDER BY completed_at DESC, attempt_id DESC
      LIMIT ?
    `).all(...params) as Array<{ attempt_id: string; completed_at: string; payload_json: string }>;
    const page = rows.slice(0, options.limit);
    const last = page[page.length - 1];
    return {
      attempts: page.map((row) => parseAttempt(row.payload_json)),
      nextCursor: rows.length > options.limit && last ? { completedAt: last.completed_at, attemptId: last.attempt_id } : null,
    };
  }

  async listEvidenceWindow(householdId: string, studentId: string, limit: number): Promise<AttemptEvidenceWindow> {
    const rows = this.db.prepare(`
      SELECT payload_json FROM kani_attempts
      WHERE household_id = ? AND student_id = ?
      ORDER BY completed_at DESC, attempt_id DESC
      LIMIT ?
    `).all(householdId.trim(), studentId.trim(), limit + 1) as Array<{ payload_json: string }>;
    return { attempts: rows.slice(0, limit).map((row) => parseAttempt(row.payload_json)), truncated: rows.length > limit };
  }

  async consumeWriteQuota(userId: string, cost: number, options: { limit: number; nowMs: number }): Promise<WriteQuotaResult> {
    const normalizedUserId = requireId(userId, 'userId');
    const normalizedCost = Math.max(0, Math.floor(cost));
    const bucket = Math.floor(options.nowMs / 60_000);
    const bucketEnd = (bucket + 1) * 60_000;
    const retryAfterSeconds = Math.max(1, Math.ceil((bucketEnd - options.nowMs) / 1000));
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM kani_api_write_quota WHERE minute_bucket < ?').run(bucket - 2);
      const row = this.db.prepare(`
        SELECT used_units FROM kani_api_write_quota WHERE user_id = ? AND minute_bucket = ?
      `).get(normalizedUserId, bucket) as { used_units: number } | undefined;
      const used = Number(row?.used_units ?? 0);
      if (used + normalizedCost > options.limit) {
        this.db.exec('COMMIT');
        return { allowed: false, used, limit: options.limit, retryAfterSeconds };
      }
      const next = used + normalizedCost;
      this.db.prepare(`
        INSERT INTO kani_api_write_quota(user_id, minute_bucket, used_units) VALUES (?, ?, ?)
        ON CONFLICT(user_id, minute_bucket) DO UPDATE SET used_units = excluded.used_units
      `).run(normalizedUserId, bucket, next);
      this.db.exec('COMMIT');
      return { allowed: true, used: next, limit: options.limit, retryAfterSeconds };
    } catch (error) {
      try { this.db.exec('ROLLBACK'); } catch { /* preserve original storage error */ }
      throw error;
    }
  }

  async health(): Promise<BackendHealth> {
    const row = this.db.prepare('SELECT 1 AS ok').get() as { ok: number } | undefined;
    return { ready: row?.ok === 1 && this.migrationVersion === SQLITE_SCHEMA_VERSION, storage: 'sqlite', migrationVersion: this.migrationVersion };
  }
}
