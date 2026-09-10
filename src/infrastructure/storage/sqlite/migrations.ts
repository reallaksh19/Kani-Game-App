export interface SqliteMigration {
  version: number;
  name: string;
  sql: string;
}

export const SQLITE_MIGRATIONS: readonly SqliteMigration[] = [
  {
    version: 1,
    name: 'core-learner-evidence',
    sql: `
CREATE TABLE kani_households (
  household_id TEXT PRIMARY KEY,
  payload_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE kani_household_members (
  household_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role = 'guardian'),
  payload_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (household_id, user_id),
  FOREIGN KEY (household_id) REFERENCES kani_households(household_id) ON DELETE RESTRICT
);
CREATE INDEX kani_household_members_user_idx ON kani_household_members(user_id, household_id);

CREATE TABLE kani_students (
  household_id TEXT NOT NULL,
  student_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  grade TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (household_id, student_id),
  FOREIGN KEY (household_id) REFERENCES kani_households(household_id) ON DELETE RESTRICT
);
CREATE INDEX kani_students_household_idx ON kani_students(household_id, student_id);

CREATE TABLE kani_attempts (
  attempt_id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  source_app TEXT NOT NULL,
  topic_id TEXT,
  skill_ids_json TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (household_id, student_id) REFERENCES kani_students(household_id, student_id) ON DELETE RESTRICT
);
CREATE INDEX kani_attempt_history_idx ON kani_attempts(household_id, student_id, completed_at DESC, attempt_id DESC);
CREATE INDEX kani_attempt_topic_idx ON kani_attempts(student_id, topic_id, completed_at DESC, attempt_id DESC);

CREATE TRIGGER kani_attempts_immutable_update
BEFORE UPDATE ON kani_attempts
BEGIN
  SELECT RAISE(ABORT, 'Kani attempt evidence is immutable; insert a new attempt event instead.');
END;

CREATE TRIGGER kani_attempts_immutable_delete
BEFORE DELETE ON kani_attempts
BEGIN
  SELECT RAISE(ABORT, 'Kani attempt evidence is immutable; deletion is not permitted.');
END;
`,
  },
  {
    version: 2,
    name: 'api-write-quota',
    sql: `
CREATE TABLE kani_api_write_quota (
  user_id TEXT NOT NULL,
  minute_bucket INTEGER NOT NULL,
  used_units INTEGER NOT NULL CHECK (used_units >= 0),
  PRIMARY KEY (user_id, minute_bucket)
);
CREATE INDEX kani_api_write_quota_bucket_idx ON kani_api_write_quota(minute_bucket);
`,
  },
] as const;

export const SQLITE_SCHEMA_VERSION = SQLITE_MIGRATIONS[SQLITE_MIGRATIONS.length - 1]?.version ?? 0;
