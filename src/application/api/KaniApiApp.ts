import {
  deriveStudentRecommendationsPayload,
  deriveStudentRevisionPayload,
} from '../../domain/evidenceDerivations.ts';
import type { KaniAttemptV1 } from '../../integration/kani/contracts';
import type { KaniApiStore } from '../../ports/backend';
import { StorageRecordNotFoundError } from '../../ports/backend';
import type { RequestIdentityProvider } from '../../ports/identity';
import { RequestIdentityError } from '../../ports/identity';
import { ImmutableRecordConflictError } from '../../ports/storage';
import {
  KANI_API_VERSION,
  KANI_SCHEMA_VERSION,
  KaniApiInputError,
  MAX_REQUEST_BYTES,
  assertAllowedBrowserOrigin,
  corsHeadersForOrigin,
  decodeHistoryCursor,
  encodeHistoryCursor,
  matchKaniApiRoute,
  parseAllowedOrigins,
  parseAttemptBatch,
  parseHistoryLimit,
  parseStudentInput,
} from './kaniApiProtocol.ts';

const DEFAULT_WRITE_UNITS_PER_MINUTE = 120;
const MAX_EVIDENCE_ATTEMPTS = 1000;

export interface KaniApiAppOptions {
  store: KaniApiStore;
  identityProvider: RequestIdentityProvider;
  allowedOrigins: readonly string[];
  writeUnitsPerMinute?: number;
  now?: () => number;
  releaseSha?: string;
  contractSourceSha?: string;
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

function errorResponse(error: unknown, headers: Record<string, string>): Response {
  if (error instanceof KaniApiInputError || error instanceof RequestIdentityError) {
    return jsonResponse({ error: { code: error.code, message: error.message } }, error.status, headers);
  }
  if (error instanceof ImmutableRecordConflictError) {
    const code = error.entity === 'student' ? 'STUDENT_ID_CONFLICT' : error.entity === 'attempt' ? 'ATTEMPT_ID_CONFLICT' : 'IMMUTABLE_ID_CONFLICT';
    return jsonResponse({ error: { code, message: error.message } }, 409, headers);
  }
  if (error instanceof StorageRecordNotFoundError) {
    const code = error.entity === 'student' ? 'STUDENT_NOT_FOUND' : 'NOT_FOUND';
    return jsonResponse({ error: { code, message: error.message } }, 404, headers);
  }
  console.error('Unhandled Kani API error', error);
  return jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'The learner API could not complete this request.' } }, 500, headers);
}

async function readJsonBody(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    throw new KaniApiInputError(`Request body cannot exceed ${MAX_REQUEST_BYTES} bytes`, 'PAYLOAD_TOO_LARGE', 413);
  }
  const raw = await request.text();
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveHouseholdId(store: KaniApiStore, userId: string, requested: string | null): Promise<string> {
  if (requested) {
    if (!isUuid(requested)) throw new KaniApiInputError('x-kani-household-id must be a UUID');
    if (!(await store.isHouseholdMember(requested, userId))) {
      throw new KaniApiInputError('The authenticated account is not a member of that household', 'HOUSEHOLD_FORBIDDEN', 403);
    }
    return requested;
  }
  const households = await store.listHouseholdIdsForUser(userId);
  if (households.length === 0) throw new KaniApiInputError('This guardian account is not linked to a Kani household yet', 'HOUSEHOLD_NOT_LINKED', 403);
  if (households.length > 1) throw new KaniApiInputError('Select a household with x-kani-household-id', 'HOUSEHOLD_SELECTION_REQUIRED', 409);
  return households[0];
}

async function requireStudent(store: KaniApiStore, householdId: string, studentId: string): Promise<void> {
  if (!(await store.hasStudent(householdId, studentId))) {
    throw new KaniApiInputError('Student was not found in the authenticated household', 'STUDENT_NOT_FOUND', 404);
  }
}

async function requireWriteQuota(store: KaniApiStore, userId: string, cost: number, limit: number, nowMs: number): Promise<void> {
  const quota = await store.consumeWriteQuota(userId, cost, { limit, nowMs });
  if (!quota.allowed) {
    const error = new KaniApiInputError('Write quota exceeded; retry after the current quota window.', 'RATE_LIMITED', 429);
    Object.defineProperty(error, 'retryAfterSeconds', { value: quota.retryAfterSeconds, enumerable: false });
    throw error;
  }
}

function retryAfter(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const value = (error as { retryAfterSeconds?: unknown }).retryAfterSeconds;
  return typeof value === 'number' && Number.isFinite(value) ? String(Math.max(1, Math.ceil(value))) : null;
}

export class KaniApiApp {
  private readonly store: KaniApiStore;
  private readonly identityProvider: RequestIdentityProvider;
  private readonly allowedOrigins: readonly string[];
  private readonly writeUnitsPerMinute: number;
  private readonly now: () => number;
  private readonly releaseSha: string;
  private readonly contractSourceSha: string;

  constructor(options: KaniApiAppOptions) {
    this.store = options.store;
    this.identityProvider = options.identityProvider;
    this.allowedOrigins = parseAllowedOrigins(options.allowedOrigins.join(','));
    this.writeUnitsPerMinute = Math.max(1, Math.floor(options.writeUnitsPerMinute ?? DEFAULT_WRITE_UNITS_PER_MINUTE));
    this.now = options.now ?? Date.now;
    this.releaseSha = options.releaseSha ?? 'development';
    this.contractSourceSha = options.contractSourceSha ?? 'unknown';
  }

  async handle(request: Request): Promise<Response> {
    const origin = request.headers.get('origin');
    const corsHeaders = corsHeadersForOrigin(origin, this.allowedOrigins);
    try {
      assertAllowedBrowserOrigin(origin, this.allowedOrigins);
      const url = new URL(request.url);

      if (request.method.toUpperCase() === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }

      if (url.pathname === '/health/live') {
        return jsonResponse({ status: 'ok' }, 200, corsHeaders);
      }
      if (url.pathname === '/health/ready') {
        const health = await this.store.health();
        return jsonResponse({ status: health.ready ? 'ready' : 'not_ready', ...health }, health.ready ? 200 : 503, corsHeaders);
      }
      if (url.pathname === '/health/version') {
        const health = await this.store.health();
        return jsonResponse({
          apiVersion: KANI_API_VERSION,
          schemaVersion: KANI_SCHEMA_VERSION,
          releaseSha: this.releaseSha,
          contractSourceSha: this.contractSourceSha,
          storage: health.storage,
          migrationVersion: health.migrationVersion,
        }, 200, corsHeaders);
      }

      const route = matchKaniApiRoute(request.method, url.pathname);
      const identity = await this.identityProvider.verifyRequest(request);
      const householdId = await resolveHouseholdId(this.store, identity.userId, request.headers.get('x-kani-household-id'));

      if (route.kind === 'students.list') {
        const students = await this.store.listStudents(householdId);
        return jsonResponse({ students: students.map((student) => ({
          id: student.studentId,
          name: student.name,
          avatar: student.avatar,
          grade: student.grade,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
        })) }, 200, corsHeaders);
      }

      if (route.kind === 'students.create') {
        const body = await readJsonBody(request);
        const student = parseStudentInput(body);
        await requireWriteQuota(this.store, identity.userId, 1, this.writeUnitsPerMinute, this.now());
        const result = await this.store.createStudent(householdId, {
          studentId: student.id,
          name: student.name,
          avatar: student.avatar,
          grade: student.grade,
        });
        return jsonResponse({ created: result.created, student: {
          id: result.student.studentId,
          name: result.student.name,
          avatar: result.student.avatar,
          grade: result.student.grade,
          createdAt: result.student.createdAt,
          updatedAt: result.student.updatedAt,
        } }, result.created ? 201 : 200, corsHeaders);
      }

      if (route.kind === 'attempts.create') {
        const body = await readJsonBody(request);
        const attempts = parseAttemptBatch(body) as KaniAttemptV1[];
        await requireWriteQuota(this.store, identity.userId, attempts.length, this.writeUnitsPerMinute, this.now());
        const result = await this.store.saveAttempts(householdId, attempts);
        return jsonResponse(result, 200, corsHeaders);
      }

      if (route.kind === 'student.history') {
        await requireStudent(this.store, householdId, route.studentId);
        const limit = parseHistoryLimit(url.searchParams.get('limit'));
        const cursor = decodeHistoryCursor(url.searchParams.get('cursor'));
        const page = await this.store.listAttemptPage(householdId, route.studentId, { limit, cursor });
        return jsonResponse({
          attempts: page.attempts,
          nextCursor: page.nextCursor ? encodeHistoryCursor(page.nextCursor) : null,
        }, 200, corsHeaders);
      }

      if (route.kind === 'student.revision' || route.kind === 'student.recommendations') {
        await requireStudent(this.store, householdId, route.studentId);
        const evidence = await this.store.listEvidenceWindow(householdId, route.studentId, MAX_EVIDENCE_ATTEMPTS);
        const payload = route.kind === 'student.revision'
          ? deriveStudentRevisionPayload(route.studentId, evidence.attempts)
          : deriveStudentRecommendationsPayload(route.studentId, evidence.attempts);
        return jsonResponse({ ...payload, evidenceWindow: { maxAttempts: MAX_EVIDENCE_ATTEMPTS, truncated: evidence.truncated } }, 200, corsHeaders);
      }

      throw new KaniApiInputError('API route not found', 'NOT_FOUND', 404);
    } catch (error) {
      const extra: Record<string, string> = { ...corsHeaders };
      const retry = retryAfter(error);
      if (retry) extra['Retry-After'] = retry;
      return errorResponse(error, extra);
    }
  }
}
