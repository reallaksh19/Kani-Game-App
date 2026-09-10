import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(root, 'src');
const codeExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const providerNeutralRoots = ['domain', 'application', 'ports'].map((name) => path.join(srcRoot, name));
const componentRoot = path.join(srcRoot, 'components');
const providerImportPatterns = [
  /from\s+['"][^'"]*supabase[^'"]*['"]/i,
  /from\s+['"][^'"]*neon[^'"]*['"]/i,
  /from\s+['"][^'"]*firebase[^'"]*['"]/i,
  /require\(\s*['"][^'"]*(?:supabase|neon|firebase)[^'"]*['"]\s*\)/i,
];
const storageImplementationPatterns = [
  /from\s+['"]node:sqlite['"]/i,
  /from\s+['"][^'"]*(?:better-sqlite3|sqlite3)[^'"]*['"]/i,
];
const providerConstructionPatterns = [
  /\bSupabaseGuardianAuth\b/,
  /\bSupabaseGuardianIdentityProvider\b/,
];
const browserSecretPatterns = [
  { name: 'Supabase service-role env', regex: /SUPABASE_SERVICE_ROLE_KEY/ },
  { name: 'secret API key literal', regex: /sb_secret_[A-Za-z0-9_-]+/ },
  { name: 'database connection URL', regex: /postgres(?:ql)?:\/\//i },
  { name: 'publicly-prefixed secret config', regex: /VITE_[A-Z0-9_]*(?:SERVICE_ROLE|SECRET|DATABASE_PASSWORD|PRIVATE_KEY)/ },
];

async function exists(target) {
  try { await stat(target); return true; } catch { return false; }
}

async function listCodeFiles(dir) {
  if (!(await exists(dir))) return [];
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'coverage'].includes(entry.name)) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listCodeFiles(target));
    else if (codeExtensions.has(path.extname(entry.name))) out.push(target);
  }
  return out;
}

function isTestFile(file) {
  return /\.(?:test|spec)\.[^.]+$/.test(file);
}

const violations = [];
for (const file of await listCodeFiles(srcRoot)) {
  if (isTestFile(file)) continue;
  const text = await readFile(file, 'utf8');
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  for (const pattern of browserSecretPatterns) {
    if (pattern.regex.test(text)) violations.push(`${rel}: browser-facing source contains ${pattern.name}`);
  }
  if (rel !== 'src/infrastructure/identity/test/TestRequestIdentityProvider.ts' && /\bTestRequestIdentityProvider\b/.test(text)) {
    violations.push(`${rel}: CI-only test identity adapter leaked outside its infrastructure implementation`);
  }
}

for (const neutralRoot of providerNeutralRoots) {
  for (const file of await listCodeFiles(neutralRoot)) {
    const text = await readFile(file, 'utf8');
    const rel = path.relative(root, file).replaceAll(path.sep, '/');
    for (const regex of [...providerImportPatterns, ...storageImplementationPatterns]) {
      if (regex.test(text)) violations.push(`${rel}: provider-neutral layer imports provider/storage implementation`);
    }
  }
}

for (const file of await listCodeFiles(componentRoot)) {
  if (isTestFile(file)) continue;
  const text = await readFile(file, 'utf8');
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  for (const regex of [...providerImportPatterns, ...storageImplementationPatterns]) {
    if (regex.test(text)) violations.push(`${rel}: product UI imports a provider/storage implementation`);
  }
  for (const regex of providerConstructionPatterns) {
    if (regex.test(text)) violations.push(`${rel}: product UI constructs/references a provider-specific identity adapter`);
  }
}

const legacyAuthShim = path.join(srcRoot, 'integration/kani/SupabaseGuardianAuth.ts');
if (await exists(legacyAuthShim)) {
  const text = await readFile(legacyAuthShim, 'utf8');
  if (/class\s+SupabaseGuardianAuth\b/.test(text) || /\/auth\/v1\//.test(text)) {
    violations.push('src/integration/kani/SupabaseGuardianAuth.ts: compatibility shim contains provider implementation logic');
  }
}

const legacyProtocolShim = path.join(root, 'supabase/functions/_shared/kaniApiProtocol.ts');
if (await exists(legacyProtocolShim)) {
  const text = await readFile(legacyProtocolShim, 'utf8');
  if (/function\s+(?:matchKaniApiRoute|parseAttemptBatch|parseStudentInput)\b/.test(text)) {
    violations.push('supabase/functions/_shared/kaniApiProtocol.ts: provider directory contains canonical API protocol implementation');
  }
}

for (const required of [
  'src/ports/identity.ts',
  'src/ports/storage.ts',
  'src/ports/backend.ts',
  'src/application/api/kaniApiProtocol.ts',
  'src/application/api/KaniApiApp.ts',
  'src/infrastructure/identity/createGuardianIdentityProvider.ts',
  'src/infrastructure/identity/supabase/SupabaseGuardianIdentityProvider.ts',
  'src/infrastructure/identity/test/TestRequestIdentityProvider.ts',
  'src/infrastructure/storage/local/LocalAttemptStore.ts',
  'src/infrastructure/storage/memory/MemoryStore.ts',
  'src/infrastructure/storage/sqlite/migrations.ts',
  'src/infrastructure/storage/sqlite/runMigrations.ts',
  'src/infrastructure/storage/sqlite/SQLiteStore.ts',
]) {
  if (!(await exists(path.join(root, required)))) violations.push(`${required}: required architecture boundary is missing`);
}

if (violations.length) {
  throw new Error(`Architecture drift detected:\n- ${violations.join('\n- ')}`);
}

console.log('Architecture audit passes: canonical API/domain layers are provider-neutral, SQLite is infrastructure-only, test identity is CI-only, and product UI stays behind neutral seams.');
