const REQUIRED_ENV = [
  'KANI_STAGING_SUPABASE_URL',
  'KANI_STAGING_PUBLISHABLE_KEY',
  'KANI_STAGING_API_BASE_URL',
  'KANI_STAGING_ALLOWED_ORIGIN',
  'KANI_STAGING_GUARDIAN_A_EMAIL',
  'KANI_STAGING_GUARDIAN_A_PASSWORD',
  'KANI_STAGING_GUARDIAN_B_EMAIL',
  'KANI_STAGING_GUARDIAN_B_PASSWORD',
  'KANI_STAGING_HOUSEHOLD_A_ID',
  'KANI_STAGING_HOUSEHOLD_B_ID',
];

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required staging environment variable: ${name}`);
  return value;
}

for (const name of REQUIRED_ENV) requiredEnv(name);

const config = {
  supabaseUrl: requiredEnv('KANI_STAGING_SUPABASE_URL').replace(/\/+$/, ''),
  publishableKey: requiredEnv('KANI_STAGING_PUBLISHABLE_KEY'),
  apiBaseUrl: requiredEnv('KANI_STAGING_API_BASE_URL').replace(/\/+$/, ''),
  allowedOrigin: requiredEnv('KANI_STAGING_ALLOWED_ORIGIN').replace(/\/$/, ''),
  guardianA: {
    email: requiredEnv('KANI_STAGING_GUARDIAN_A_EMAIL'),
    password: requiredEnv('KANI_STAGING_GUARDIAN_A_PASSWORD'),
    householdId: requiredEnv('KANI_STAGING_HOUSEHOLD_A_ID'),
  },
  guardianB: {
    email: requiredEnv('KANI_STAGING_GUARDIAN_B_EMAIL'),
    password: requiredEnv('KANI_STAGING_GUARDIAN_B_PASSWORD'),
    householdId: requiredEnv('KANI_STAGING_HOUSEHOLD_B_ID'),
  },
};

const runKey = String(process.env.GITHUB_RUN_ID || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '');
const prefix = `staging_smoke_${runKey}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hasKeyDeep(value, key) {
  if (!value || typeof value !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  return Object.values(value).some((child) => hasKeyDeep(child, key));
}

async function readBody(response) {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function signIn({ email, password }) {
  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: config.publishableKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await readBody(response);
  assert(response.ok, `Guardian sign-in failed with HTTP ${response.status}`);
  assert(body && typeof body.access_token === 'string' && body.access_token.length > 20, 'Guardian sign-in did not return an access token');
  return body.access_token;
}

async function apiRequest({ token, householdId, path, method = 'GET', body, origin = config.allowedOrigin }) {
  const headers = new Headers({
    Accept: 'application/json',
    apikey: config.publishableKey,
  });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (householdId) headers.set('x-kani-household-id', householdId);
  if (origin) headers.set('Origin', origin);
  if (body !== undefined) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    body: await readBody(response),
  };
}

function errorCode(result) {
  return result.body && typeof result.body === 'object' && result.body.error && typeof result.body.error === 'object'
    ? result.body.error.code
    : undefined;
}

function expectStatus(result, status, label) {
  assert(result.status === status, `${label}: expected HTTP ${status}, received ${result.status} (${JSON.stringify(result.body)})`);
}

function expectOneOf(result, statuses, label) {
  assert(statuses.includes(result.status), `${label}: expected HTTP ${statuses.join('/')}, received ${result.status} (${JSON.stringify(result.body)})`);
}

function makeAttempt({ attemptId, studentId, completedAt, correct = true, questionId }) {
  return {
    schemaVersion: '1.0',
    attemptId,
    studentId,
    activityId: 'staging-smoke-number-system',
    activityType: 'worksheet',
    sourceApp: 'game-app',
    subjectId: 'grade4math',
    topicId: 'number-system',
    pageId: 'staging-smoke-page',
    questionId,
    skillIds: ['staging-smoke-number-system'],
    difficulty: 'medium',
    correct,
    partialCredit: correct ? 1 : 0,
    responseTimeMs: 1200,
    hintsUsed: 0,
    score: correct ? 10 : 0,
    startedAt: new Date(Date.parse(completedAt) - 1500).toISOString(),
    completedAt,
  };
}

async function main() {
  console.log('Kani authenticated learner staging smoke');
  console.log(`API host: ${new URL(config.apiBaseUrl).host}`);
  console.log(`Allowed origin under test: ${config.allowedOrigin}`);
  console.log('Credentials and access tokens are intentionally not printed.');

  const [tokenA, tokenB] = await Promise.all([
    signIn(config.guardianA),
    signIn(config.guardianB),
  ]);
  console.log('✓ Guardian A and B authentication');

  const anonymousRead = await apiRequest({
    householdId: config.guardianA.householdId,
    path: '/students',
  });
  expectStatus(anonymousRead, 401, 'anonymous learner read');

  const anonymousWrite = await apiRequest({
    householdId: config.guardianA.householdId,
    path: '/attempts',
    method: 'POST',
    body: { attempts: [] },
  });
  expectStatus(anonymousWrite, 401, 'anonymous attempt write');
  console.log('✓ Anonymous learner access denied');

  const allowedCors = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: '/students',
  });
  expectStatus(allowedCors, 200, 'allowed-origin student list');
  assert(
    allowedCors.headers.get('access-control-allow-origin') === config.allowedOrigin,
    'Allowed-origin request did not echo the exact configured Access-Control-Allow-Origin',
  );

  const forbiddenCors = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: '/students',
    origin: 'https://kani-smoke-invalid-origin.example',
  });
  expectStatus(forbiddenCors, 403, 'forbidden-origin request');
  assert(errorCode(forbiddenCors) === 'ORIGIN_NOT_ALLOWED', 'Forbidden origin did not fail with ORIGIN_NOT_ALLOWED');
  assert(!forbiddenCors.headers.get('access-control-allow-origin'), 'Forbidden origin unexpectedly received Access-Control-Allow-Origin');
  console.log('✓ Exact-origin CORS policy');

  const crossHousehold = await apiRequest({
    token: tokenA,
    householdId: config.guardianB.householdId,
    path: '/students',
  });
  expectStatus(crossHousehold, 403, 'cross-household selector');
  assert(errorCode(crossHousehold) === 'HOUSEHOLD_FORBIDDEN', 'Cross-household access did not fail with HOUSEHOLD_FORBIDDEN');
  console.log('✓ Household membership revalidated server-side');

  const studentA = {
    id: `${prefix}_alex_a`,
    name: 'Staging Alex',
    avatar: '🦊',
    grade: 'Grade 4',
  };
  const studentB = {
    id: `${prefix}_alex_b`,
    name: 'Staging Alex',
    avatar: '🦉',
    grade: 'Grade 4',
  };

  const createA = await apiRequest({ token: tokenA, householdId: config.guardianA.householdId, path: '/students', method: 'POST', body: studentA });
  expectOneOf(createA, [200, 201], 'student A import');
  assert(createA.body?.student?.id === studentA.id, 'Student A stable ID was not preserved');

  const createB = await apiRequest({ token: tokenB, householdId: config.guardianB.householdId, path: '/students', method: 'POST', body: studentB });
  expectOneOf(createB, [200, 201], 'student B import');
  assert(createB.body?.student?.id === studentB.id, 'Student B stable ID was not preserved');
  assert(studentA.name === studentB.name && studentA.id !== studentB.id, 'Smoke fixture must contain same-name/different-ID students');

  const replayStudent = await apiRequest({ token: tokenA, householdId: config.guardianA.householdId, path: '/students', method: 'POST', body: studentA });
  expectStatus(replayStudent, 200, 'idempotent student replay');
  assert(replayStudent.body?.created === false, 'Identical student replay was not idempotent');

  const conflictingStudent = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: '/students',
    method: 'POST',
    body: { ...studentA, avatar: '🐼' },
  });
  expectStatus(conflictingStudent, 409, 'student stable-ID conflict');
  assert(errorCode(conflictingStudent) === 'STUDENT_ID_CONFLICT', 'Student conflict did not return STUDENT_ID_CONFLICT');
  console.log('✓ Stable student IDs, idempotent import, and same-name isolation');

  const baseTime = Date.now() - 5_000;
  const attempts = [0, 1, 2].map((offset) => makeAttempt({
    attemptId: `${prefix}_attempt_${offset + 1}`,
    studentId: studentA.id,
    completedAt: new Date(baseTime + offset * 1000).toISOString(),
    correct: offset !== 0,
    questionId: `staging-smoke-q${offset + 1}`,
  }));

  const upload = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: '/attempts',
    method: 'POST',
    body: { attempts },
  });
  expectStatus(upload, 200, 'attempt batch upload');
  assert(upload.body?.accepted === 3, 'Attempt batch did not accept all three events');

  const replayAttempt = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: '/attempts',
    method: 'POST',
    body: { attempts: [attempts[0]] },
  });
  expectStatus(replayAttempt, 200, 'idempotent attempt replay');
  assert(replayAttempt.body?.existing === 1 && replayAttempt.body?.idempotentReplay === true, 'Identical attempt replay was not idempotent');

  const conflictingAttempt = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: '/attempts',
    method: 'POST',
    body: { attempts: [{ ...attempts[0], correct: true, partialCredit: 1, score: 10 }] },
  });
  expectStatus(conflictingAttempt, 409, 'immutable attempt conflict');
  assert(errorCode(conflictingAttempt) === 'ATTEMPT_ID_CONFLICT', 'Attempt conflict did not return ATTEMPT_ID_CONFLICT');
  console.log('✓ Attempt batch, idempotent replay, and immutable conflict handling');

  const history1 = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: `/students/${encodeURIComponent(studentA.id)}/history?limit=2`,
  });
  expectStatus(history1, 200, 'history page 1');
  assert(Array.isArray(history1.body?.attempts) && history1.body.attempts.length === 2, 'History page 1 should contain two attempts');
  assert(typeof history1.body?.nextCursor === 'string' && history1.body.nextCursor.length > 0, 'History page 1 should provide nextCursor');

  const history2 = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: `/students/${encodeURIComponent(studentA.id)}/history?limit=2&cursor=${encodeURIComponent(history1.body.nextCursor)}`,
  });
  expectStatus(history2, 200, 'history page 2');
  const historyIds = [...history1.body.attempts, ...(history2.body?.attempts || [])].map((attempt) => attempt.attemptId);
  for (const attempt of attempts) assert(historyIds.includes(attempt.attemptId), `History pagination lost ${attempt.attemptId}`);

  const crossStudentRead = await apiRequest({
    token: tokenB,
    householdId: config.guardianB.householdId,
    path: `/students/${encodeURIComponent(studentA.id)}/history`,
  });
  expectStatus(crossStudentRead, 404, 'cross-household student history');
  assert(errorCode(crossStudentRead) === 'STUDENT_NOT_FOUND', 'Cross-household history did not fail closed as STUDENT_NOT_FOUND');
  console.log('✓ History pagination and cross-household non-disclosure');

  const revision1 = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: `/students/${encodeURIComponent(studentA.id)}/revision`,
  });
  const revision2 = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: `/students/${encodeURIComponent(studentA.id)}/revision`,
  });
  expectStatus(revision1, 200, 'revision endpoint');
  expectStatus(revision2, 200, 'revision endpoint repeat');
  assert(stableJson(revision1.body) === stableJson(revision2.body), 'Revision endpoint is not deterministic for unchanged evidence');
  assert(revision1.body?.evidenceWindow && typeof revision1.body.evidenceWindow.truncated === 'boolean', 'Revision response lacks evidenceWindow metadata');
  assert(!hasKeyDeep(revision1.body, 'mastery'), 'Revision response unexpectedly exposes an opaque mastery field');

  const recommendations1 = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: `/students/${encodeURIComponent(studentA.id)}/recommendations`,
  });
  const recommendations2 = await apiRequest({
    token: tokenA,
    householdId: config.guardianA.householdId,
    path: `/students/${encodeURIComponent(studentA.id)}/recommendations`,
  });
  expectStatus(recommendations1, 200, 'recommendations endpoint');
  expectStatus(recommendations2, 200, 'recommendations endpoint repeat');
  assert(stableJson(recommendations1.body) === stableJson(recommendations2.body), 'Recommendations endpoint is not deterministic for unchanged evidence');
  assert(recommendations1.body?.evidenceWindow && typeof recommendations1.body.evidenceWindow.truncated === 'boolean', 'Recommendations response lacks evidenceWindow metadata');
  assert(!hasKeyDeep(recommendations1.body, 'mastery'), 'Recommendations response unexpectedly exposes an opaque mastery field');
  console.log('✓ Deterministic revision/recommendation services without opaque mastery');

  console.log('\nAuthenticated learner staging smoke passed.');
  console.log(`Created disposable smoke students with prefix: ${prefix}`);
}

main().catch((error) => {
  console.error(`\nStaging smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
