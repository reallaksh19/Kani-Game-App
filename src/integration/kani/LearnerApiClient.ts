import { KaniAttemptV1 } from './contracts';
import { StudentRecommendationsPayload, StudentRevisionPayload } from './evidenceDerivations';
import { GuardianSessionProvider } from './GuardianSessionProvider';

export interface RemoteStudentProfile {
  id: string;
  name: string;
  avatar: string;
  grade: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttemptUploadResult {
  accepted: number;
  created: number;
  existing: number;
  idempotentReplay: boolean;
}

export interface AttemptHistoryPage {
  attempts: KaniAttemptV1[];
  nextCursor: string | null;
}

export interface EvidenceWindowInfo {
  maxAttempts: number;
  truncated: boolean;
}

export type RemoteStudentRevision = StudentRevisionPayload & { evidenceWindow: EvidenceWindowInfo };
export type RemoteStudentRecommendations = StudentRecommendationsPayload & { evidenceWindow: EvidenceWindowInfo };

export class LearnerApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds: number | null;

  constructor(message: string, options: { status: number; code: string; retryAfterSeconds?: number | null }) {
    super(message);
    this.name = 'LearnerApiError';
    this.status = options.status;
    this.code = options.code;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

export interface LearnerApiClientOptions {
  baseUrl: string;
  sessionProvider: GuardianSessionProvider;
  publishableKey?: string;
  householdIdProvider?: () => Promise<string | null> | string | null;
  fetchImpl?: typeof fetch;
}

function normalizedBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) throw new Error('Learner API base URL is required');
  return trimmed;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new LearnerApiError('Learner API returned invalid JSON', {
      status: response.status,
      code: 'INVALID_API_RESPONSE',
    });
  }
}

function responseError(response: Response, body: unknown): LearnerApiError {
  const value = typeof body === 'object' && body !== null ? body as Record<string, unknown> : {};
  const error = typeof value.error === 'object' && value.error !== null ? value.error as Record<string, unknown> : {};
  const code = typeof error.code === 'string' ? error.code : `HTTP_${response.status}`;
  const message = typeof error.message === 'string' ? error.message : `Learner API request failed with HTTP ${response.status}`;
  const retryAfter = Number(response.headers.get('retry-after'));
  return new LearnerApiError(message, {
    status: response.status,
    code,
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
  });
}

export class LearnerApiClient {
  private readonly baseUrl: string;
  private readonly sessionProvider: GuardianSessionProvider;
  private readonly publishableKey?: string;
  private readonly householdIdProvider?: LearnerApiClientOptions['householdIdProvider'];
  private readonly fetchImpl: typeof fetch;

  constructor(options: LearnerApiClientOptions) {
    this.baseUrl = normalizedBaseUrl(options.baseUrl);
    this.sessionProvider = options.sessionProvider;
    this.publishableKey = options.publishableKey?.trim() || undefined;
    this.householdIdProvider = options.householdIdProvider;
    this.fetchImpl = options.fetchImpl || fetch.bind(globalThis);
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const session = await this.sessionProvider.getSession();
    if (!session?.accessToken) {
      throw new LearnerApiError('Guardian sign-in is required before remote learner sync.', {
        status: 401,
        code: 'UNAUTHENTICATED',
      });
    }

    const householdId = await this.householdIdProvider?.();
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${session.accessToken}`);
    headers.set('Accept', 'application/json');
    if (this.publishableKey) headers.set('apikey', this.publishableKey);
    if (householdId) headers.set('x-kani-household-id', householdId);
    if (init.body != null && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, { ...init, headers });
    } catch (error) {
      throw new LearnerApiError(error instanceof Error ? error.message : 'Learner API network request failed', {
        status: 0,
        code: 'NETWORK_ERROR',
      });
    }

    const body = await parseResponseBody(response);
    if (!response.ok) throw responseError(response, body);
    return body as T;
  }

  async listStudents(): Promise<RemoteStudentProfile[]> {
    const body = await this.request<{ students?: RemoteStudentProfile[] }>('/students');
    return Array.isArray(body.students) ? body.students : [];
  }

  async importStudent(student: Pick<RemoteStudentProfile, 'id' | 'name' | 'avatar' | 'grade'>): Promise<RemoteStudentProfile> {
    const body = await this.request<{ student: RemoteStudentProfile }>('/students', {
      method: 'POST',
      body: JSON.stringify(student),
    });
    if (!body.student?.id) {
      throw new LearnerApiError('Learner API did not return the imported student.', {
        status: 502,
        code: 'INVALID_API_RESPONSE',
      });
    }
    return body.student;
  }

  async uploadAttempts(attempts: readonly KaniAttemptV1[]): Promise<AttemptUploadResult> {
    if (attempts.length === 0) return { accepted: 0, created: 0, existing: 0, idempotentReplay: true };
    return this.request<AttemptUploadResult>('/attempts', {
      method: 'POST',
      body: JSON.stringify({ attempts }),
    });
  }

  async getHistory(studentId: string, options: { cursor?: string | null; limit?: number } = {}): Promise<AttemptHistoryPage> {
    const params = new URLSearchParams();
    if (options.cursor) params.set('cursor', options.cursor);
    if (options.limit != null) params.set('limit', String(options.limit));
    const query = params.toString();
    return this.request<AttemptHistoryPage>(`/students/${encodeURIComponent(studentId)}/history${query ? `?${query}` : ''}`);
  }

  async getRevision(studentId: string): Promise<RemoteStudentRevision> {
    return this.request<RemoteStudentRevision>(`/students/${encodeURIComponent(studentId)}/revision`);
  }

  async getRecommendations(studentId: string): Promise<RemoteStudentRecommendations> {
    return this.request<RemoteStudentRecommendations>(`/students/${encodeURIComponent(studentId)}/recommendations`);
  }
}
