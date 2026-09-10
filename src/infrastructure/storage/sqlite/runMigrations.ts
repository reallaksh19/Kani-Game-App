import type { DatabaseSync } from 'node:sqlite';
import { sha256Hex } from '../../../domain/canonicalHash';
import { SQLITE_MIGRATIONS, SQLITE_SCHEMA_VERSION } from './migrations';

export interface MigrationState {
  version: number;
  applied: number;
}

function migrationChecksum(sql: string): string {
  return sha256Hex(new TextEncoder().encode(sql));
}

/** Deterministic, append-only SQLite migration runner with checksum verification. */
export function runSqliteMigrations(db: DatabaseSync, now: () => string = () => new Date().toISOString()): MigrationState {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kani_schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const findMigration = db.prepare('SELECT version, name, checksum FROM kani_schema_migrations WHERE version = ?');
  const insertMigration = db.prepare('INSERT INTO kani_schema_migrations(version, name, checksum, applied_at) VALUES (?, ?, ?, ?)');
  let applied = 0;

  for (const migration of SQLITE_MIGRATIONS) {
    const checksum = migrationChecksum(migration.sql);
    const existing = findMigration.get(migration.version) as { version: number; name: string; checksum: string } | undefined;
    if (existing) {
      if (existing.name !== migration.name || existing.checksum !== checksum) {
        throw new Error(`SQLite migration ${migration.version} has drifted after application.`);
      }
      continue;
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(migration.sql);
      insertMigration.run(migration.version, migration.name, checksum, now());
      db.exec('COMMIT');
      applied += 1;
    } catch (error) {
      try { db.exec('ROLLBACK'); } catch { /* preserve original migration error */ }
      throw error;
    }
  }

  const latest = db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM kani_schema_migrations').get() as { version: number };
  if (Number(latest.version) !== SQLITE_SCHEMA_VERSION) {
    throw new Error(`SQLite schema version ${latest.version} does not match expected ${SQLITE_SCHEMA_VERSION}.`);
  }
  return { version: SQLITE_SCHEMA_VERSION, applied };
}
