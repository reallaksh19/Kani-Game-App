import { describe, expect, it } from 'vitest';
import { SupabaseGuardianAuth } from './SupabaseGuardianAuth';

class MemoryStorage {
  readonly data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('SupabaseGuardianAuth', () => {
  it('signs in with the public Auth API and never persists the password', async () => {
    const storage = new MemoryStorage();
    let requestBody = '';
    let requestUrl = '';
    let requestHeaders: Headers | null = null;
    const auth = new SupabaseGuardianAuth({
      supabaseUrl: 'https://project.supabase.co/',
      publishableKey: 'sb_publishable_test',
      storage,
      now: () => 1_000,
      fetchImpl: async (input, init) => {
        requestUrl = String(input);
        requestBody = String(init?.body || '');
        requestHeaders = new Headers(init?.headers);
        return jsonResponse({
          access_token: 'access-1',
          refresh_token: 'refresh-1',
          expires_in: 3600,
          user: { id: 'guardian-1', email: 'parent@example.com' },
        });
      },
    });

    const account = await auth.signIn(' Parent@Example.com ', 'very-secret');
    expect(account.userId).toBe('guardian-1');
    expect(account.email).toBe('parent@example.com');
    expect(requestUrl).toBe('https://project.supabase.co/auth/v1/token?grant_type=password');
    expect(requestHeaders?.get('apikey')).toBe('sb_publishable_test');
    expect(JSON.parse(requestBody)).toEqual({ email: 'parent@example.com', password: 'very-secret' });

    const persisted = [...storage.data.values()].join('\n');
    expect(persisted).toContain('access-1');
    expect(persisted).toContain('refresh-1');
    expect(persisted).not.toContain('very-secret');
  });

  it('refreshes an expiring session and keeps the stable guardian identity', async () => {
    const storage = new MemoryStorage();
    const calls: string[] = [];
    let now = 1_000;
    const auth = new SupabaseGuardianAuth({
      supabaseUrl: 'https://project.supabase.co',
      publishableKey: 'public-key',
      storage,
      now: () => now,
      fetchImpl: async (input, init) => {
        calls.push(String(input));
        const body = JSON.parse(String(init?.body || '{}'));
        if (calls.length === 1) {
          return jsonResponse({
            access_token: 'access-1',
            refresh_token: 'refresh-1',
            expires_in: 120,
            user: { id: 'guardian-1', email: 'parent@example.com' },
          });
        }
        expect(body).toEqual({ refresh_token: 'refresh-1' });
        return jsonResponse({ access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 3600 });
      },
    });

    await auth.signIn('parent@example.com', 'pw');
    now = 62_000;
    const session = await auth.getSession();
    expect(session).toMatchObject({ userId: 'guardian-1', accessToken: 'access-2' });
    expect(calls[1]).toContain('grant_type=refresh_token');
  });

  it('clears the local session when refresh is rejected', async () => {
    const storage = new MemoryStorage();
    let now = 0;
    let calls = 0;
    const auth = new SupabaseGuardianAuth({
      supabaseUrl: 'https://project.supabase.co',
      publishableKey: 'public-key',
      storage,
      now: () => now,
      fetchImpl: async () => {
        calls += 1;
        return calls === 1
          ? jsonResponse({
              access_token: 'access',
              refresh_token: 'refresh',
              expires_in: 90,
              user: { id: 'guardian-1', email: 'parent@example.com' },
            })
          : jsonResponse({ error: 'invalid_grant', error_description: 'Refresh token expired' }, 400);
      },
    });

    await auth.signIn('parent@example.com', 'pw');
    now = 40_000;
    await expect(auth.getSession()).resolves.toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it('signs out locally even when the logout request is offline', async () => {
    const storage = new MemoryStorage();
    let calls = 0;
    const auth = new SupabaseGuardianAuth({
      supabaseUrl: 'https://project.supabase.co',
      publishableKey: 'public-key',
      storage,
      fetchImpl: async () => {
        calls += 1;
        if (calls === 1) {
          return jsonResponse({
            access_token: 'access',
            refresh_token: 'refresh',
            expires_in: 3600,
            user: { id: 'guardian-1', email: 'parent@example.com' },
          });
        }
        throw new Error('offline');
      },
    });

    await auth.signIn('parent@example.com', 'pw');
    await expect(auth.signOut()).resolves.toBeUndefined();
    expect(storage.data.size).toBe(0);
    await expect(auth.getSession()).resolves.toBeNull();
  });
});
