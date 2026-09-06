import { GuardianSession, GuardianSessionProvider } from './GuardianSessionProvider';

export interface GuardianAccount {
  userId: string;
  email: string;
  expiresAt: string;
}

interface StoredGuardianAuth extends GuardianAccount {
  accessToken: string;
  refreshToken: string;
}

export interface GuardianAuthStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SupabaseGuardianAuthOptions {
  supabaseUrl: string;
  publishableKey: string;
  storage?: GuardianAuthStorage;
  fetchImpl?: typeof fetch;
  now?: () => number;
  storageKey?: string;
}

interface SupabaseTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user?: { id?: string; email?: string };
  error?: string;
  error_description?: string;
  msg?: string;
}

export class GuardianAuthError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, options: { status: number; code: string }) {
    super(message);
    this.name = 'GuardianAuthError';
    this.status = options.status;
    this.code = options.code;
  }
}

const DEFAULT_STORAGE_KEY = 'kani-guardian-auth-v1';
const REFRESH_SKEW_MS = 60_000;

function normalizeBaseUrl(value: string): string {
  const normalized = value.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(normalized)) throw new Error('A valid Supabase URL is required.');
  return normalized;
}

function parseStored(raw: string | null): StoredGuardianAuth | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredGuardianAuth>;
    if (
      typeof value.userId !== 'string'
      || !value.userId.trim()
      || typeof value.email !== 'string'
      || typeof value.accessToken !== 'string'
      || !value.accessToken
      || typeof value.refreshToken !== 'string'
      || !value.refreshToken
      || typeof value.expiresAt !== 'string'
      || !Number.isFinite(Date.parse(value.expiresAt))
    ) return null;
    return value as StoredGuardianAuth;
  } catch {
    return null;
  }
}

function messageFromBody(body: SupabaseTokenResponse, fallback: string): string {
  return body.error_description || body.msg || body.error || fallback;
}

/**
 * Minimal browser adapter for Supabase Auth's public REST API. Product code still
 * depends only on GuardianSessionProvider; Supabase-specific login/refresh/logout
 * behavior is isolated here. Passwords are sent directly to Supabase Auth and are
 * never persisted by Kani.
 */
export class SupabaseGuardianAuth implements GuardianSessionProvider {
  private readonly supabaseUrl: string;
  private readonly publishableKey: string;
  private readonly storage: GuardianAuthStorage;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly storageKey: string;

  constructor(options: SupabaseGuardianAuthOptions) {
    this.supabaseUrl = normalizeBaseUrl(options.supabaseUrl);
    this.publishableKey = options.publishableKey.trim();
    if (!this.publishableKey) throw new Error('Supabase publishable key is required.');
    this.storage = options.storage || localStorage;
    this.fetchImpl = options.fetchImpl || fetch.bind(globalThis);
    this.now = options.now || Date.now;
    this.storageKey = options.storageKey || DEFAULT_STORAGE_KEY;
  }

  private read(): StoredGuardianAuth | null {
    return parseStored(this.storage.getItem(this.storageKey));
  }

  private write(value: StoredGuardianAuth): void {
    this.storage.setItem(this.storageKey, JSON.stringify(value));
  }

  private clear(): void {
    this.storage.removeItem(this.storageKey);
  }

  private async tokenRequest(grantType: 'password' | 'refresh_token', body: Record<string, string>): Promise<StoredGuardianAuth> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.supabaseUrl}/auth/v1/token?grant_type=${grantType}`, {
        method: 'POST',
        headers: {
          apikey: this.publishableKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new GuardianAuthError(error instanceof Error ? error.message : 'Guardian authentication request failed.', {
        status: 0,
        code: 'NETWORK_ERROR',
      });
    }

    let payload: SupabaseTokenResponse = {};
    try {
      payload = await response.json() as SupabaseTokenResponse;
    } catch {
      // Supabase normally returns JSON; preserve a bounded generic error otherwise.
    }
    if (!response.ok) {
      throw new GuardianAuthError(messageFromBody(payload, 'Guardian sign-in failed.'), {
        status: response.status,
        code: response.status === 400 ? 'INVALID_CREDENTIALS' : `HTTP_${response.status}`,
      });
    }

    const current = this.read();
    const accessToken = payload.access_token;
    const refreshToken = payload.refresh_token || current?.refreshToken;
    const userId = payload.user?.id || current?.userId;
    const email = payload.user?.email || current?.email;
    const expiresAtMs = typeof payload.expires_at === 'number'
      ? payload.expires_at * 1000
      : this.now() + Math.max(1, payload.expires_in || 3600) * 1000;

    if (!accessToken || !refreshToken || !userId || !email) {
      throw new GuardianAuthError('Supabase Auth returned an incomplete guardian session.', {
        status: 502,
        code: 'INVALID_AUTH_RESPONSE',
      });
    }

    const stored: StoredGuardianAuth = {
      userId,
      email,
      accessToken,
      refreshToken,
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
    this.write(stored);
    return stored;
  }

  async signIn(email: string, password: string): Promise<GuardianAccount> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new GuardianAuthError('Email and password are required.', { status: 400, code: 'INVALID_INPUT' });
    }
    const session = await this.tokenRequest('password', { email: normalizedEmail, password });
    return { userId: session.userId, email: session.email, expiresAt: session.expiresAt };
  }

  async signOut(): Promise<void> {
    const current = this.read();
    this.clear();
    if (!current?.accessToken) return;
    try {
      await this.fetchImpl(`${this.supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: this.publishableKey,
          Authorization: `Bearer ${current.accessToken}`,
        },
      });
    } catch {
      // Local sign-out remains authoritative if the network is unavailable.
    }
  }

  async getAccount(): Promise<GuardianAccount | null> {
    const session = await this.getSession();
    if (!session) return null;
    const stored = this.read();
    return stored ? { userId: stored.userId, email: stored.email, expiresAt: stored.expiresAt } : null;
  }

  async getSession(): Promise<GuardianSession | null> {
    const current = this.read();
    if (!current) return null;
    const expiresAtMs = Date.parse(current.expiresAt);
    if (expiresAtMs - this.now() <= REFRESH_SKEW_MS) {
      try {
        const refreshed = await this.tokenRequest('refresh_token', { refresh_token: current.refreshToken });
        return { userId: refreshed.userId, accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt };
      } catch {
        this.clear();
        return null;
      }
    }
    return { userId: current.userId, accessToken: current.accessToken, expiresAt: current.expiresAt };
  }
}
