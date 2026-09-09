import { describe, expect, it } from 'vitest';
import { resolveKaniRuntimeConfig } from './kaniRuntimeConfig';

const secureProduction = {
  MODE: 'production',
  VITE_KANI_SYNC_ENABLED: 'true',
  VITE_KANI_API_BASE_URL: 'https://api.example.test/api/v1',
  VITE_SUPABASE_URL: 'https://identity.example.test',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
};

describe('Kani runtime configuration', () => {
  it('accepts an explicit HTTPS production sync configuration', () => {
    const config = resolveKaniRuntimeConfig(secureProduction);
    expect(config.errors).toEqual([]);
    expect(config.ready).toBe(true);
    expect(config.storage.driver).toBe('local');
    expect(config.identity.driver).toBe('supabase');
  });

  it('fails closed when a browser variable exposes an admin/server secret', () => {
    const config = resolveKaniRuntimeConfig({
      ...secureProduction,
      VITE_SUPABASE_SERVICE_ROLE_KEY: 'must-never-be-public',
    });
    expect(config.ready).toBe(false);
    expect(config.errors.join(' ')).toContain('must never be public');
  });

  it('rejects a Supabase secret key in the publishable-key slot', () => {
    const config = resolveKaniRuntimeConfig({
      ...secureProduction,
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_not_public',
    });
    expect(config.ready).toBe(false);
    expect(config.identityReady).toBe(false);
    expect(config.errors).toContain('A Supabase secret key cannot be used as a browser publishable key.');
  });

  it('requires HTTPS for production/staging network endpoints', () => {
    const config = resolveKaniRuntimeConfig({
      ...secureProduction,
      VITE_KANI_API_BASE_URL: 'http://api.example.test/api/v1',
    });
    expect(config.ready).toBe(false);
    expect(config.apiReady).toBe(false);
    expect(config.errors.join(' ')).toContain('must use HTTPS in production');
  });

  it('allows local HTTP during development while keeping sync explicit', () => {
    const config = resolveKaniRuntimeConfig({
      MODE: 'development',
      VITE_KANI_SYNC_ENABLED: true,
      VITE_KANI_API_BASE_URL: 'http://localhost:54321/functions/v1/kani-api/api/v1',
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'local-public-key',
    });
    expect(config.errors).toEqual([]);
    expect(config.ready).toBe(true);
  });

  it('rejects test-only memory storage in production', () => {
    const config = resolveKaniRuntimeConfig({
      ...secureProduction,
      VITE_KANI_STORAGE_DRIVER: 'memory',
    });
    expect(config.ready).toBe(false);
    expect(config.errors.join(' ')).toContain('Memory storage is test/development-only');
  });
});
