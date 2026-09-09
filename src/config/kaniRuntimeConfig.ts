export type KaniEnvironment = 'development' | 'test' | 'staging' | 'production';
export type KaniStorageDriver = 'local' | 'memory';
export type KaniIdentityDriver = 'supabase';
export type KaniRuntimeEnv = Record<string, string | boolean | undefined>;

export interface KaniRuntimeConfig {
  environment: KaniEnvironment;
  storage: { driver: KaniStorageDriver };
  sync: {
    requested: boolean;
    apiBaseUrl: string;
    householdId: string;
  };
  identity: {
    driver: KaniIdentityDriver;
    supabaseUrl: string;
    publishableKey: string;
  };
  apiReady: boolean;
  identityReady: boolean;
  ready: boolean;
  errors: string[];
}

function asString(value: string | boolean | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asBoolean(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  return typeof value === 'string' && ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function normalizeUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function parseEnvironment(env: KaniRuntimeEnv, errors: string[]): KaniEnvironment {
  const raw = (asString(env.VITE_KANI_ENV) || asString(env.MODE) || 'development').toLowerCase();
  if (raw === 'development' || raw === 'test' || raw === 'staging' || raw === 'production') return raw;
  errors.push(`Unsupported Kani environment: ${raw}.`);
  return 'development';
}

function validateUrl(value: string, label: string, environment: KaniEnvironment, errors: string[]): boolean {
  if (!value) return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    errors.push(`${label} must be an absolute HTTP(S) URL.`);
    return false;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    errors.push(`${label} must use HTTP(S).`);
    return false;
  }
  if (parsed.username || parsed.password) {
    errors.push(`${label} must not embed credentials.`);
    return false;
  }
  if ((environment === 'staging' || environment === 'production') && parsed.protocol !== 'https:') {
    errors.push(`${label} must use HTTPS in ${environment}.`);
    return false;
  }
  return true;
}

function rejectPublicSecrets(env: KaniRuntimeEnv, errors: string[]): void {
  const dangerousName = /(?:SERVICE_ROLE|DATABASE_PASSWORD|PRIVATE_KEY|ADMIN_SECRET|SECRET_KEY)/i;
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('VITE_') || !asString(value)) continue;
    if (dangerousName.test(key)) errors.push(`Unsafe browser configuration: ${key} must never be public.`);
  }
}

export function resolveKaniRuntimeConfig(env: KaniRuntimeEnv): KaniRuntimeConfig {
  const errors: string[] = [];
  rejectPublicSecrets(env, errors);
  const environment = parseEnvironment(env, errors);

  const storageRaw = (asString(env.VITE_KANI_STORAGE_DRIVER) || 'local').toLowerCase();
  const storageDriver: KaniStorageDriver = storageRaw === 'memory' ? 'memory' : 'local';
  if (storageRaw !== 'local' && storageRaw !== 'memory') errors.push(`Unsupported Kani storage driver: ${storageRaw}.`);
  if ((environment === 'staging' || environment === 'production') && storageDriver === 'memory') {
    errors.push(`Memory storage is test/development-only and cannot be selected in ${environment}.`);
  }

  const identityRaw = (asString(env.VITE_KANI_AUTH_DRIVER) || 'supabase').toLowerCase();
  const identityDriver: KaniIdentityDriver = 'supabase';
  if (identityRaw !== 'supabase') errors.push(`Unsupported Kani identity driver: ${identityRaw}.`);

  const requested = asBoolean(env.VITE_KANI_SYNC_ENABLED);
  const apiBaseUrl = normalizeUrl(asString(env.VITE_KANI_API_BASE_URL));
  const householdId = asString(env.VITE_KANI_HOUSEHOLD_ID);
  const supabaseUrl = normalizeUrl(asString(env.VITE_SUPABASE_URL));
  const publishableKey = asString(env.VITE_SUPABASE_PUBLISHABLE_KEY);

  const apiUrlValid = apiBaseUrl ? validateUrl(apiBaseUrl, 'Learner API base URL', environment, errors) : false;
  const identityUrlValid = supabaseUrl ? validateUrl(supabaseUrl, 'Guardian identity URL', environment, errors) : false;
  if (publishableKey.startsWith('sb_secret_')) {
    errors.push('A Supabase secret key cannot be used as a browser publishable key.');
  }

  if (requested && !apiBaseUrl) errors.push('Learner API base URL is required when sync is enabled.');
  if (requested && !supabaseUrl) errors.push('Guardian identity URL is required when sync is enabled.');
  if (requested && !publishableKey) errors.push('Guardian publishable key is required when sync is enabled.');

  const apiReady = Boolean(apiBaseUrl && apiUrlValid);
  const identityReady = Boolean(supabaseUrl && identityUrlValid && publishableKey && !publishableKey.startsWith('sb_secret_'));
  const ready = requested && apiReady && identityReady && errors.length === 0;

  return {
    environment,
    storage: { driver: storageDriver },
    sync: { requested, apiBaseUrl, householdId },
    identity: {
      driver: identityDriver,
      supabaseUrl,
      publishableKey,
    },
    apiReady,
    identityReady,
    ready,
    errors,
  };
}

export function getKaniRuntimeConfig(): KaniRuntimeConfig {
  return resolveKaniRuntimeConfig(import.meta.env as KaniRuntimeEnv);
}
