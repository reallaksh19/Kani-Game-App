import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import type { KaniAttemptV1 } from '../../../integration/kani/contracts';
import { SQLiteStore } from './SQLiteStore';

function attempt(): KaniAttemptV1 {
  return {
    schemaVersion: '1.0',
    attemptId: 'attempt_sqlite_1',
    studentId: 'student_1',
    activityId: 'activity_1',
    activityType: 'worksheet',
    sourceApp: 'game-app',
    skillIds: ['skill_1'],
    difficulty: 'medium',
    correct: true,
    partialCredit: 1,
    completedAt: '2026-09-10T00:00:00.000Z',
  };
}

describe('SQLiteStore migrations, immutability and recovery', () => {
  const tempDirs: string[] = [];
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('applies migrations idempotently and reports ready health', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'kani-sqlite-'));
    tempDirs.push(dir);
    const dbPath = path.join(dir, 'kani.db');
    const first = new SQLiteStore({ path: dbPath });
    expect(await first.health()).toEqual({ ready: true, storage: 'sqlite', migrationVersion: 2 });
    first.close();

    const second = new SQLiteStore({ path: dbPath });
    expect(await second.health()).toEqual({ ready: true, storage: 'sqlite', migrationVersion: 2 });
    second.close();

    const raw = new DatabaseSync(dbPath);
    const rows = raw.prepare('SELECT version, name FROM kani_schema_migrations ORDER BY version').all() as Array<{ version: number; name: string }>;
    expect(rows.map((row) => Number(row.version))).toEqual([1, 2]);
    raw.close();
  });

  it('enforces attempt immutability at the SQLite trigger boundary', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'kani-sqlite-'));
    tempDirs.push(dir);
    const dbPath = path.join(dir, 'kani.db');
    const store = new SQLiteStore({ path: dbPath });
    await store.households.put({ householdId: 'house_1' });
    await store.students.put({ householdId: 'house_1', studentId: 'student_1', name: 'Alex', avatar: '🧑‍🚀', grade: '4' });
    await store.attempts.recordAttempt(attempt());
    store.close();

    const raw = new DatabaseSync(dbPath);
    expect(() => raw.exec("UPDATE kani_attempts SET payload_json = '{}' WHERE attempt_id = 'attempt_sqlite_1'")).toThrow(/immutable/i);
    expect(() => raw.exec("DELETE FROM kani_attempts WHERE attempt_id = 'attempt_sqlite_1'")).toThrow(/immutable|deletion/i);
    const payload = (raw.prepare("SELECT payload_json FROM kani_attempts WHERE attempt_id = 'attempt_sqlite_1'").get() as { payload_json: string }).payload_json;
    expect(JSON.parse(payload).correct).toBe(true);
    raw.close();
  });

  it('backs up to a standalone SQLite file that restores canonical evidence', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'kani-sqlite-'));
    tempDirs.push(dir);
    const dbPath = path.join(dir, 'kani.db');
    const backupPath = path.join(dir, 'kani.backup.db');
    const store = new SQLiteStore({ path: dbPath });
    await store.households.put({ householdId: 'house_1' });
    await store.memberships.put({ householdId: 'house_1', userId: 'guardian_1', role: 'guardian' });
    await store.students.put({ householdId: 'house_1', studentId: 'student_1', name: 'Alex', avatar: '🧑‍🚀', grade: '4' });
    await store.attempts.recordAttempt(attempt());
    store.backupTo(backupPath);
    store.close();

    const restored = new SQLiteStore({ path: backupPath });
    expect((await restored.memberships.listByUser('guardian_1')).map((item) => item.householdId)).toEqual(['house_1']);
    expect((await restored.attempts.listAttempts('student_1')).map((item) => item.attemptId)).toEqual(['attempt_sqlite_1']);
    restored.close();
  });
});
