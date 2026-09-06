import { createSupabaseContext } from '@supabase/server';
import {
  KaniApiInputError,
  MAX_REQUEST_BYTES,
  assertAllowedBrowserOrigin,
  attemptToDatabaseRow,
  corsHeadersForOrigin,
  decodeHistoryCursor,
  encodeHistoryCursor,
  matchKaniApiRoute,
  parseAllowedOrigins,
  parseAttemptBatch,
  parseHistoryLimit,
  parseStudentInput,
  stableJson,
} from '../_shared/kaniApiProtocol.ts';

const WRITE_UNITS_PER_MINUTE = 120;

interface QuotaResult {
  allowed: boolean;
  used: number;
  quota_limit: number;
  retry_after_seconds: number;
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

function errorResponse(error: unknown, headers: Record<string, string>): Response {
  if (error instanceof KaniApiInputError) {
    return jsonResponse({ error: { code: error.code, message: error.message } }, error.status, headers);
  }
  console.error('Unhandled Kani API error', error);
  return jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'The learner API could not complete this request.' } }, 500, headers);
}

function requireUserId(ctx: { jwtClaims?: { sub?: string } | null }): string {
  const userId = ctx.jwtClaims?.sub;
  if (!userId) throw new KaniApiInputError('Authenticated user identity is missing', 'UNAUTHENTICATED', 401);
  return userId;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function readJsonBody(req: Request): Promise<unknown> {
  const declaredLength = Number(req.headers.get('content-length') || '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new KaniApiInputError(`Request body cannot exceed ${MAX_REQUEST_BYTES} bytes`, 'PAYLOAD_TOO_LARGE', 413);
  }
  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_REQUEST_BYTES) {
    throw new KaniApiInputError(`Request body cannot exceed ${MAX_REQUEST_BYTES} bytes`, 'PAYLOAD_TOO_LARGE', 413);
  }
  if (!raw.trim()) throw new KaniApiInputError('Request body is required');
  try {
    return JSON.parse(raw);
  } catch {
    throw new KaniApiInputError('Request body must be valid JSON');
  }
}

async function resolveHouseholdId(admin: any, userId: string, requestedHouseholdId: string | null): Promise<string> {
  if (requestedHouseholdId) {
    if (!isUuid(requestedHouseholdId)) throw new KaniApiInputError('x-kani-household-id must be a UUID');
    const { data, error } = await admin
      .from('kani_household_members')
      .select('household_id')
      .eq('user_id', userId)
      .eq('household_id', requestedHouseholdId)
      .maybeSingle();
    if (error) {
      console.error('Household membership lookup failed', error);
      throw new KaniApiInputError('Household membership could not be verified', 'BACKEND_ERROR', 500);
    }
    if (!data) throw new KaniApiInputError('The authenticated account is not a member of that household', 'HOUSEHOLD_FORBIDDEN', 403);
    return data.household_id;
  }

  const { data, error } = await admin
    .from('kani_household_members')
    .select('household_id')
    .eq('user_id', userId)
    .limit(2);
  if (error) {
    console.error('Household lookup failed', error);
    throw new KaniApiInputError('Household membership could not be loaded', 'BACKEND_ERROR', 500);
  }
  if (!data || data.length === 0) throw new KaniApiInputError('This guardian account is not linked to a Kani household yet', 'HOUSEHOLD_NOT_LINKED', 403);
  if (data.length > 1) throw new KaniApiInputError('Select a household with x-kani-household-id', 'HOUSEHOLD_SELECTION_REQUIRED', 409);
  return data[0].household_id;
}

async function consumeWriteQuota(admin: any, userId: string, cost: number): Promise<QuotaResult> {
  const { data, error } = await admin.rpc('kani_consume_api_write_quota', {
    p_user_id: userId,
    p_cost: cost,
    p_limit: WRITE_UNITS_PER_MINUTE,
  });
  if (error) {
    console.error('Write quota RPC failed', error);
    throw new KaniApiInputError('Write quota could not be checked', 'BACKEND_ERROR', 500);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row.allowed !== 'boolean') throw new KaniApiInputError('Write quota response is invalid', 'BACKEND_ERROR', 500);
  return row as QuotaResult;
}

async function requireStudent(admin: any, householdId: string, studentId: string): Promise<void> {
  const { data, error } = await admin
    .from('kani_students')
    .select('id')
    .eq('household_id', householdId)
    .eq('id', studentId)
    .maybeSingle();
  if (error) {
    console.error('Student ownership lookup failed', error);
    throw new KaniApiInputError('Student ownership could not be verified', 'BACKEND_ERROR', 500);
  }
  if (!data) throw new KaniApiInputError('Student was not found in the authenticated household', 'STUDENT_NOT_FOUND', 404);
}

async function listStudents(admin: any, householdId: string): Promise<ResponsePayload> {
  const { data, error } = await admin
    .from('kani_students')
    .select('id,name,avatar,grade,created_at,updated_at')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Student list failed', error);
    throw new KaniApiInputError('Students could not be loaded', 'BACKEND_ERROR', 500);
  }
  return {
    students: (data || []).map((student: any) => ({
      id: student.id,
      name: student.name,
      avatar: student.avatar,
      grade: student.grade,
      createdAt: student.created_at,
      updatedAt: student.updated_at,
    })),
  };
}

type ResponsePayload = Record<string, unknown>;

async function createStudent(admin: any, householdId: string, body: unknown): Promise<{ payload: ResponsePayload; status: number }> {
  const student = parseStudentInput(body);
  const { data: existing, error: existingError } = await admin
    .from('kani_students')
    .select('id,name,avatar,grade,created_at,updated_at')
    .eq('household_id', householdId)
    .eq('id', student.id)
    .maybeSingle();
  if (existingError) {
    console.error('Existing student lookup failed', existingError);
    throw new KaniApiInputError('Student could not be checked', 'BACKEND_ERROR', 500);
  }
  if (existing) {
    if (existing.name !== student.name || existing.avatar !== student.avatar || existing.grade !== student.grade) {
      throw new KaniApiInputError('This stable studentId already exists with different profile data', 'STUDENT_ID_CONFLICT', 409);
    }
    return {
      status: 200,
      payload: {
        created: false,
        student: { id: existing.id, name: existing.name, avatar: existing.avatar, grade: existing.grade, createdAt: existing.created_at, updatedAt: existing.updated_at },
      },
    };
  }

  const { data, error } = await admin
    .from('kani_students')
    .insert({ household_id: householdId, ...student })
    .select('id,name,avatar,grade,created_at,updated_at')
    .single();
  if (error) {
    if (error.code === '23505') {
      const { data: raced } = await admin
        .from('kani_students')
        .select('id,name,avatar,grade,created_at,updated_at')
        .eq('household_id', householdId)
        .eq('id', student.id)
        .maybeSingle();
      if (raced && raced.name === student.name && raced.avatar === student.avatar && raced.grade === student.grade) {
        return {
          status: 200,
          payload: { created: false, student: { id: raced.id, name: raced.name, avatar: raced.avatar, grade: raced.grade, createdAt: raced.created_at, updatedAt: raced.updated_at } },
        };
      }
      throw new KaniApiInputError('This stable studentId already exists with different profile data', 'STUDENT_ID_CONFLICT', 409);
    }
    console.error('Student insert failed', error);
    throw new KaniApiInputError('Student could not be created', 'BACKEND_ERROR', 500);
  }

  return {
    status: 201,
    payload: { created: true, student: { id: data.id, name: data.name, avatar: data.avatar, grade: data.grade, createdAt: data.created_at, updatedAt: data.updated_at } },
  };
}

async function saveAttempts(admin: any, householdId: string, body: unknown): Promise<ResponsePayload> {
  const attempts = parseAttemptBatch(body);
  const studentIds = [...new Set(attempts.map((attempt) => attempt.studentId))];
  const { data: students, error: studentsError } = await admin
    .from('kani_students')
    .select('id')
    .eq('household_id', householdId)
    .in('id', studentIds);
  if (studentsError) {
    console.error('Attempt student lookup failed', studentsError);
    throw new KaniApiInputError('Attempt students could not be verified', 'BACKEND_ERROR', 500);
  }
  const foundStudentIds = new Set((students || []).map((student: any) => student.id));
  const missingStudentId = studentIds.find((studentId) => !foundStudentIds.has(studentId));
  if (missingStudentId) throw new KaniApiInputError(`Student ${missingStudentId} is not linked to this household`, 'STUDENT_NOT_FOUND', 404);

  const attemptIds = attempts.map((attempt) => attempt.attemptId);
  const { data: existingRows, error: existingError } = await admin
    .from('kani_attempts')
    .select('attempt_id,payload')
    .eq('household_id', householdId)
    .in('attempt_id', attemptIds);
  if (existingError) {
    console.error('Existing attempt lookup failed', existingError);
    throw new KaniApiInputError('Attempts could not be checked', 'BACKEND_ERROR', 500);
  }

  const existing = new Map((existingRows || []).map((row: any) => [row.attempt_id, row.payload]));
  for (const attempt of attempts) {
    const prior = existing.get(attempt.attemptId);
    if (prior !== undefined && stableJson(prior) !== stableJson(attempt)) {
      throw new KaniApiInputError(`attemptId ${attempt.attemptId} already exists with a different payload`, 'ATTEMPT_ID_CONFLICT', 409);
    }
  }

  const newAttempts = attempts.filter((attempt) => !existing.has(attempt.attemptId));
  if (newAttempts.length > 0) {
    const { error: insertError } = await admin
      .from('kani_attempts')
      .insert(newAttempts.map((attempt) => attemptToDatabaseRow(householdId, attempt)));
    if (insertError) {
      if (insertError.code !== '23505') {
        console.error('Attempt insert failed', insertError);
        throw new KaniApiInputError('Attempts could not be saved', 'BACKEND_ERROR', 500);
      }

      // A concurrent identical upload may win the unique-key race. Re-read every
      // submitted ID; only treat the race as idempotent when all payloads match.
      const { data: racedRows, error: racedError } = await admin
        .from('kani_attempts')
        .select('attempt_id,payload')
        .eq('household_id', householdId)
        .in('attempt_id', attemptIds);
      if (racedError) throw new KaniApiInputError('Concurrent attempt state could not be verified', 'BACKEND_ERROR', 500);
      const raced = new Map((racedRows || []).map((row: any) => [row.attempt_id, row.payload]));
      const mismatch = attempts.find((attempt) => !raced.has(attempt.attemptId) || stableJson(raced.get(attempt.attemptId)) !== stableJson(attempt));
      if (mismatch) throw new KaniApiInputError(`attemptId ${mismatch.attemptId} conflicts with an existing event`, 'ATTEMPT_ID_CONFLICT', 409);
      return { accepted: attempts.length, created: 0, existing: attempts.length, idempotentReplay: true };
    }
  }

  return {
    accepted: attempts.length,
    created: newAttempts.length,
    existing: attempts.length - newAttempts.length,
    idempotentReplay: newAttempts.length === 0,
  };
}

function quotePostgrestValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

async function getHistory(admin: any, householdId: string, studentId: string, url: URL): Promise<ResponsePayload> {
  await requireStudent(admin, householdId, studentId);
  const limit = parseHistoryLimit(url.searchParams.get('limit'));
  const cursor = decodeHistoryCursor(url.searchParams.get('cursor'));

  let query = admin
    .from('kani_attempts')
    .select('payload,completed_at,attempt_id')
    .eq('household_id', householdId)
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false })
    .order('attempt_id', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    const completedAt = quotePostgrestValue(cursor.completedAt);
    const attemptId = quotePostgrestValue(cursor.attemptId);
    query = query.or(`completed_at.lt.${completedAt},and(completed_at.eq.${completedAt},attempt_id.lt.${attemptId})`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Attempt history query failed', error);
    throw new KaniApiInputError('Attempt history could not be loaded', 'BACKEND_ERROR', 500);
  }

  const rows = data || [];
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  const nextCursor = rows.length > limit && last
    ? encodeHistoryCursor({ completedAt: last.completed_at, attemptId: last.attempt_id })
    : null;

  return {
    attempts: page.map((row: any) => row.payload),
    nextCursor,
  };
}

function localDevelopmentOrigins(): string[] {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  if (!/localhost|127\.0\.0\.1/.test(supabaseUrl)) return [];
  return ['http://localhost:5173', 'http://127.0.0.1:5173'];
}

export default {
  fetch: async (req: Request): Promise<Response> => {
    let corsHeaders: Record<string, string> = {};
    try {
      const configuredOrigins = parseAllowedOrigins(Deno.env.get('KANI_ALLOWED_ORIGINS'));
      const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : localDevelopmentOrigins();
      const origin = req.headers.get('origin');
      assertAllowedBrowserOrigin(origin, allowedOrigins);
      corsHeaders = corsHeadersForOrigin(origin, allowedOrigins);

      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

      const { data: ctx, error: authError } = await createSupabaseContext(req, { auth: 'user' });
      if (authError) {
        return jsonResponse({ error: { code: authError.code, message: authError.message } }, authError.status, corsHeaders);
      }

      const route = matchKaniApiRoute(req.method, new URL(req.url).pathname);
      const userId = requireUserId(ctx);
      const householdId = await resolveHouseholdId(ctx.supabaseAdmin, userId, req.headers.get('x-kani-household-id'));

      if (route.kind === 'students.list') {
        return jsonResponse(await listStudents(ctx.supabaseAdmin, householdId), 200, corsHeaders);
      }

      if (route.kind === 'students.create') {
        const quota = await consumeWriteQuota(ctx.supabaseAdmin, userId, 10);
        if (!quota.allowed) {
          return jsonResponse(
            { error: { code: 'RATE_LIMITED', message: 'Write quota exceeded; retry after the current minute window.' }, quota },
            429,
            { ...corsHeaders, 'Retry-After': String(quota.retry_after_seconds) },
          );
        }
        const result = await createStudent(ctx.supabaseAdmin, householdId, await readJsonBody(req));
        return jsonResponse(result.payload, result.status, corsHeaders);
      }

      if (route.kind === 'attempts.create') {
        const body = await readJsonBody(req);
        const attempts = parseAttemptBatch(body);
        const quota = await consumeWriteQuota(ctx.supabaseAdmin, userId, attempts.length);
        if (!quota.allowed) {
          return jsonResponse(
            { error: { code: 'RATE_LIMITED', message: 'Write quota exceeded; retry after the current minute window.' }, quota },
            429,
            { ...corsHeaders, 'Retry-After': String(quota.retry_after_seconds) },
          );
        }
        // saveAttempts intentionally reparses the body at the domain boundary so a
        // future caller cannot bypass validation by passing an already-cast value.
        return jsonResponse(await saveAttempts(ctx.supabaseAdmin, householdId, body), 200, corsHeaders);
      }

      if (route.kind === 'student.history') {
        return jsonResponse(await getHistory(ctx.supabaseAdmin, householdId, route.studentId, new URL(req.url)), 200, corsHeaders);
      }

      // These routes are reserved now so clients can depend on one API version,
      // but Stage 5 will wire the completed deterministic Kani evidence derivations.
      return jsonResponse({
        error: {
          code: 'NOT_ENABLED_YET',
          message: `${route.kind === 'student.revision' ? 'Revision' : 'Recommendation'} remote derivation is not enabled yet; Kani continues to derive it locally.`,
        },
      }, 501, corsHeaders);
    } catch (error) {
      return errorResponse(error, corsHeaders);
    }
  },
};
