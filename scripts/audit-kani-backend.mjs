import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const testsDir = path.join(repoRoot, 'supabase', 'tests', 'database');
const configPath = path.join(repoRoot, 'supabase', 'config.toml');
const apiProtocolPath = path.join(repoRoot, 'supabase', 'functions', '_shared', 'kaniApiProtocol.ts');
const apiFunctionPath = path.join(repoRoot, 'supabase', 'functions', 'kani-api', 'index.ts');
const denoConfigPath = path.join(repoRoot, 'supabase', 'functions', 'deno.json');

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

function readIfPresent(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
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

  requireCondition(/primary key \(household_id, id\)/i.test(sql), 'student identity is household-scoped');
  requireCondition(/primary key \(household_id, attempt_id\)/i.test(sql), 'attempt idempotency key is household-scoped');
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

  requireCondition(/create schema if not exists private/i.test(sql), 'security-definer helpers live behind a private schema');
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
  requireCondition(!publicSecurityDefiner, 'base learner migration exposes no public security-definer helper');

  requireCondition(/create index if not exists kani_attempts_student_completed_idx/i.test(sql), 'student history has a completed-at index');
  requireCondition(/create index if not exists kani_attempts_skill_ids_gin_idx/i.test(sql), 'skill evidence has a GIN index');
}

const quotaMigration = migrations.find(({ raw }) => /kani_consume_api_write_quota/i.test(raw));
requireCondition(!!quotaMigration, 'service-only learner API write quota migration is checked in');
if (quotaMigration) {
  const sql = normalizedSql(quotaMigration.raw);
  requireCondition(/create table if not exists private\.kani_api_rate_limits/i.test(sql), 'write quota state lives in private schema');
  requireCondition(/create or replace function public\.kani_consume_api_write_quota[\s\S]*security definer/i.test(sql), 'write quota RPC is security definer');
  requireCondition(/set search_path = private, public, pg_temp/i.test(sql), 'write quota RPC pins its search path');
  requireCondition(/revoke all on function public\.kani_consume_api_write_quota\([^)]*\) from public, anon, authenticated/i.test(sql), 'write quota RPC is revoked from browser roles');
  requireCondition(/grant execute on function public\.kani_consume_api_write_quota\([^)]*\) to service_role/i.test(sql), 'only service role can execute write quota RPC');
  requireCondition(/p_cost < 1 or p_cost > 100/i.test(sql), 'write quota validates request cost');
  requireCondition(/p_limit < 1 or p_limit > 10000/i.test(sql), 'write quota validates configured limit');
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

const config = readIfPresent(configPath);
requireCondition(config.length > 0, 'Supabase local config is checked in');
requireCondition(/\[functions\.kani-api\][\s\S]*verify_jwt\s*=\s*true/i.test(config), 'kani-api keeps platform JWT verification enabled');

const denoConfig = readIfPresent(denoConfigPath);
requireCondition(denoConfig.length > 0, 'Edge Function Deno config is checked in');
requireCondition(/"@supabase\/server"\s*:\s*"npm:@supabase\/server@\^1"/i.test(denoConfig), 'Edge Function uses the authenticated Supabase server package');

const protocol = readIfPresent(apiProtocolPath);
requireCondition(protocol.length > 0, 'versioned learner API protocol is checked in');
if (protocol) {
  requireCondition(/MAX_ATTEMPT_BATCH\s*=\s*50/i.test(protocol), 'attempt upload batch is bounded');
  requireCondition(/MAX_REQUEST_BYTES\s*=\s*256 \* 1024/i.test(protocol), 'request payload size is bounded');
  requireCondition(/Wildcard CORS origin is not allowed/i.test(protocol), 'protocol rejects wildcard CORS configuration');
  requireCondition(/ATTEMPT_ID_CONFLICT/i.test(protocol), 'protocol defines conflicting-attempt protection');
  requireCondition(/student\.id[^\n]*160/i.test(protocol), 'stable student IDs are length-bounded');
  requireCondition(/History cursor is invalid/i.test(protocol), 'history cursor validation is explicit');
}

const apiFunction = readIfPresent(apiFunctionPath);
requireCondition(apiFunction.length > 0, 'authenticated kani-api Edge Function is checked in');
if (apiFunction) {
  requireCondition(/createSupabaseContext\(req, \{ auth: 'user' \}\)/i.test(apiFunction), 'Edge Function requires authenticated user context');
  requireCondition(/requireUserId\(ctx\)/i.test(apiFunction), 'Edge Function derives the authenticated user id from verified claims');
  requireCondition(/resolveHouseholdId\(ctx\.supabaseAdmin, userId/i.test(apiFunction), 'Edge Function derives household authorization server-side');
  requireCondition(/assertAllowedBrowserOrigin\(origin, allowedOrigins\)/i.test(apiFunction), 'Edge Function enforces the browser origin allowlist');
  requireCondition(/consumeWriteQuota\(ctx\.supabaseAdmin/i.test(apiFunction), 'Edge Function consumes service-side write quota for mutations');
  requireCondition(/parseAttemptBatch\(body\)/i.test(apiFunction), 'attempt writes pass through canonical server validation');
  requireCondition(/ATTEMPT_ID_CONFLICT/i.test(apiFunction), 'Edge Function rejects conflicting idempotency keys');
  requireCondition(/NOT_ENABLED_YET/i.test(apiFunction), 'unimplemented remote derivations fail closed rather than inventing results');
  requireCondition(!/SUPABASE_(SERVICE_ROLE|SECRET)_KEY/i.test(apiFunction), 'Edge Function source does not read or embed legacy privileged key variables directly');
}

if (failures.length > 0) {
  console.error('\nKani backend audit failed:');
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`\nKani backend audit passed (${migrationFiles.length} migration${migrationFiles.length === 1 ? '' : 's'} checked).`);
