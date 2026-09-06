import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const testsDir = path.join(repoRoot, 'supabase', 'tests', 'database');

const failures = [];
const pass = (message) => console.log(`✓ ${message}`);
const fail = (message) => failures.push(message);

function requireCondition(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

function normalizedSql(value) {
  return value.replace(/--[^\n]*/g, ' ').replace(/\s+/g, ' ').trim();
}

if (!fs.existsSync(migrationsDir)) {
  console.error('Backend audit failed: supabase/migrations does not exist.');
  process.exit(1);
}

const migrationFiles = fs.readdirSync(migrationsDir)
  .filter((name) => name.endsWith('.sql'))
  .sort();
requireCondition(migrationFiles.length > 0, 'at least one Supabase migration is checked in');

const migrations = migrationFiles.map((name) => ({
  name,
  raw: fs.readFileSync(path.join(migrationsDir, name), 'utf8'),
}));
const learnerMigration = migrations.find(({ raw }) => /create\s+table\s+if\s+not\s+exists\s+public\.kani_attempts/i.test(raw));
requireCondition(!!learnerMigration, 'learner evidence migration creates public.kani_attempts');

if (learnerMigration) {
  const sql = normalizedSql(learnerMigration.raw);
  const statements = sql.split(';').map((value) => value.trim()).filter(Boolean);
  const tables = ['kani_households', 'kani_household_members', 'kani_students', 'kani_attempts'];

  for (const table of tables) {
    requireCondition(
      new RegExp(`create table if not exists public\\.${table}\\b`, 'i').test(sql),
      `${table} is declared`,
    );
    requireCondition(
      new RegExp(`alter table public\\.${table} enable row level security`, 'i').test(sql),
      `RLS is enabled on ${table}`,
    );
    requireCondition(
      new RegExp(`revoke all on public\\.${table} from anon`, 'i').test(sql),
      `anon access is revoked from ${table}`,
    );
  }

  requireCondition(
    /primary key \(household_id, id\)/i.test(sql),
    'student identity is household-scoped',
  );
  requireCondition(
    /primary key \(household_id, attempt_id\)/i.test(sql),
    'attempt idempotency key is household-scoped',
  );
  requireCondition(
    /foreign key \(household_id, student_id\) references public\.kani_students\(household_id, id\)/i.test(sql),
    'attempts reference a household-owned student',
  );
  requireCondition(
    /payload jsonb not null check \(jsonb_typeof\(payload\) = 'object'\)/i.test(sql),
    'canonical attempt payload is stored as an object',
  );
  for (const [jsonField, column] of [
    ['attemptId', 'attempt_id'],
    ['studentId', 'student_id'],
    ['schemaVersion', 'schema_version'],
    ['activityId', 'activity_id'],
  ]) {
    requireCondition(
      new RegExp(`check \\(payload ->> '${jsonField}' = ${column}\\)`, 'i').test(sql),
      `payload ${jsonField} is bound to ${column}`,
    );
  }

  requireCondition(
    /create schema if not exists private/i.test(sql),
    'security-definer helpers live behind a private schema',
  );
  requireCondition(
    /create or replace function private\.kani_is_household_member\(target_household_id uuid\)[\s\S]*security definer/i.test(sql),
    'household membership helper is security definer in private schema',
  );
  requireCondition(
    /create trigger kani_attempts_immutable before update on public\.kani_attempts/i.test(sql),
    'attempt update immutability trigger is installed',
  );
  requireCondition(
    /raise exception 'Kani attempt evidence is immutable; insert a new attempt event instead\.'/i.test(sql),
    'attempt update trigger rejects mutation explicitly',
  );

  const writePolicy = statements.find((statement) =>
    /^create policy\b/i.test(statement)
    && /\bon public\.kani_/i.test(statement)
    && /\bto authenticated\b/i.test(statement)
    && /\bfor (insert|update|delete|all)\b/i.test(statement),
  );
  requireCondition(!writePolicy, 'no authenticated INSERT/UPDATE/DELETE/ALL RLS policy exists');

  const unsafeAuthenticatedGrant = statements.find((statement) => {
    if (!/^grant\b/i.test(statement) || !/\bon public\.kani_/i.test(statement) || !/\bto authenticated\b/i.test(statement)) return false;
    return !/^grant select\b/i.test(statement);
  });
  requireCondition(!unsafeAuthenticatedGrant, 'authenticated table grants are read-only');

  for (const table of tables) {
    requireCondition(
      new RegExp(`revoke insert, update, delete, truncate, references, trigger on public\\.${table} from authenticated`, 'i').test(sql),
      `direct authenticated writes are revoked on ${table}`,
    );
  }

  const publicSecurityDefiner = statements.find((statement) =>
    /^create or replace function public\./i.test(statement) && /security definer/i.test(statement),
  );
  requireCondition(!publicSecurityDefiner, 'no security-definer helper is exposed in public schema');

  requireCondition(
    /create index if not exists kani_attempts_student_completed_idx/i.test(sql),
    'student history has a completed-at index',
  );
  requireCondition(
    /create index if not exists kani_attempts_skill_ids_gin_idx/i.test(sql),
    'skill evidence has a GIN index',
  );
}

const rlsTestPath = path.join(testsDir, 'kani_learner_rls.test.sql');
requireCondition(fs.existsSync(rlsTestPath), 'pgTAP learner RLS test is checked in');
if (fs.existsSync(rlsTestPath)) {
  const testSql = normalizedSql(fs.readFileSync(rlsTestPath, 'utf8'));
  requireCondition(/set local role authenticated/i.test(testSql), 'pgTAP test exercises the authenticated role');
  requireCondition(/non-member reads no attempts/i.test(testSql), 'pgTAP test covers cross-household denial');
  requireCondition(/authenticated browser role cannot insert attempts directly/i.test(testSql), 'pgTAP test covers direct-write denial');
  requireCondition(/privileged write path cannot mutate an existing attempt event/i.test(testSql), 'pgTAP test covers immutable attempt updates');
}

if (failures.length > 0) {
  console.error('\nKani backend schema audit failed:');
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`\nKani backend schema audit passed (${migrationFiles.length} migration${migrationFiles.length === 1 ? '' : 's'} checked).`);
