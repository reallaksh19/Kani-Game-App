export interface LearnerSyncConfig {
  requested: boolean;
  apiBaseUrl: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
  householdId: string;
  apiReady: boolean;
  authReady: boolean;
  ready: boolean;
  reason?: string;
}

export type LearnerSyncEnv = Record<string, string | boolean | undefined>;

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

export function resolveLearnerSyncConfig(env: LearnerSyncEnv): LearnerSyncConfig {
  const requested = asBoolean(env.VITE_KANI_SYNC_ENABLED);
  const apiBaseUrl = normalizeUrl(asString(env.VITE_KANI_API_BASE_URL));
  const supabaseUrl = normalizeUrl(asString(env.VITE_SUPABASE_URL));
  const supabasePublishableKey = asString(env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const householdId = asString(env.VITE_KANI_HOUSEHOLD_ID);
  const apiReady = apiBaseUrl.length > 0;
  const authReady = supabaseUrl.length > 0 && supabasePublishableKey.length > 0;
  const ready = requested && apiReady && authReady;

  let reason: string | undefined;
  if (!requested) reason = 'Learner sync is disabled by feature flag.';
  else if (!apiReady) reason = 'Learner API base URL is not configured.';
  else if (!authReady) reason = 'Supabase public auth configuration is incomplete.';

  return {
    requested,
    apiBaseUrl,
    supabaseUrl,
    supabasePublishableKey,
    householdId,
    apiReady,
    authReady,
    ready,
    reason,
  };
}

export function getLearnerSyncConfig(): LearnerSyncConfig {
  return resolveLearnerSyncConfig(import.meta.env as LearnerSyncEnv);
}
