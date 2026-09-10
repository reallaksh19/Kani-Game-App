import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = path.join(root, 'src');
const codeExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const providerNeutralRoots = ['domain', 'application', 'ports'].map((name) => path.join(srcRoot, name));
const browserRoots = ['components', 'contexts'].map((name) => path.join(srcRoot, name));
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
const serverInfrastructureImportPatterns = [
  /from\s+['"][^'"]*infrastructure\/storage\//i,
  /from\s+['"][^'"]*infrastructure\/identity\/oidc\//i,
  /from\s+['"][^'"]*infrastructure\/http\/node\//i,
];
const serverConstructionPatterns = [
  /\bSQLiteStore\b/,
  /\bOidcRequestIdentityProvider\b/,
  /\bcreateKaniNodeServer\b/,
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
    if (isTestFile(file)) continue;
    const text = await readFile(file, 'utf8');
    const rel = path.relative(root, file).replaceAll(path.sep, '/');
    for (const regex of [...providerImportPatterns, ...storageImplementationPatterns, ...serverInfrastructureImportPatterns]) {
      if (regex.test(text)) violations.push(`${rel}: provider-neutral layer imports provider/storage/server implementation`);
    }
  }
}

for (const browserRoot of browserRoots) {
  for (const file of await listCodeFiles(browserRoot)) {
    if (isTestFile(file)) continue;
    const text = await readFile(file, 'utf8');
    const rel = path.relative(root, file).replaceAll(path.sep, '/');
    for (const regex of [...providerImportPatterns, ...storageImplementationPatterns, ...serverInfrastructureImportPatterns]) {
      if (regex.test(text)) violations.push(`${rel}: browser product code imports a provider/storage/server implementation`);
    }
    for (const regex of [...providerConstructionPatterns, ...serverConstructionPatterns]) {
      if (regex.test(text)) violations.push(`${rel}: browser product code constructs/references server/provider infrastructure`);
    }
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

const oidcProvider = path.join(srcRoot, 'infrastructure/identity/oidc/OidcRequestIdentityProvider.ts');
if (await exists(oidcProvider)) {
  const text = await readFile(oidcProvider, 'utf8');
  if (/supabase|firebase|neon/i.test(text)) violations.push('OIDC request verifier contains provider-specific coupling');
  if (!/RS256/.test(text) || !/JWT_ISSUER_INVALID/.test(text) || !/JWT_AUDIENCE_INVALID/.test(text)) {
    violations.push('OIDC request verifier is missing strict algorithm/issuer/audience enforcement');
  }
}

const e4Acceptance = path.join(srcRoot, 'infrastructure/staging/connectorFreeAuthenticatedAcceptance.test.ts');
if (await exists(e4Acceptance)) {
  const text = await readFile(e4Acceptance, 'utf8');
  if (/TestRequestIdentityProvider/.test(text)) violations.push('E4 authenticated acceptance incorrectly uses the CI-only synthetic identity adapter');
  for (const required of ['OidcRequestIdentityProvider', 'SQLiteStore', 'createKaniNodeServer', 'HOUSEHOLD_FORBIDDEN', 'AUTHORIZATION_REQUIRED']) {
    if (!text.includes(required)) violations.push(`E4 authenticated acceptance is missing required real-boundary evidence: ${required}`);
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
  'src/infrastructure/identity/oidc/OidcRequestIdentityProvider.ts',
  'src/infrastructure/storage/local/LocalAttemptStore.ts',
  'src/infrastructure/storage/memory/MemoryStore.ts',
  'src/infrastructure/storage/sqlite/migrations.ts',
  'src/infrastructure/storage/sqlite/runMigrations.ts',
  'src/infrastructure/storage/sqlite/SQLiteStore.ts',
  'src/infrastructure/staging/connectorFreeAuthenticatedAcceptance.test.ts',
  '.github/workflows/connector-free-staging-auth.yml',
  'docs/E4_IDENTITY_AUTHORIZATION.md',
]) {
  if (!(await exists(path.join(root, required)))) violations.push(`${required}: required architecture boundary is missing`);
}

if (violations.length) {
  throw new Error(`Architecture drift detected:\n- ${violations.join('\n- ')}`);
}

console.log('Architecture audit passes: canonical production layers are provider-neutral, SQLite/OIDC stay server-side, E4 acceptance uses real signed JWTs, and browser product code has no database/server identity path.');
