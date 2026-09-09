import {
  getKaniRuntimeConfig,
  KaniIdentityDriver,
  KaniRuntimeEnv,
  resolveKaniRuntimeConfig,
} from '../../config/kaniRuntimeConfig';

export interface LearnerSyncConfig {
  requested: boolean;
  apiBaseUrl: string;
  authDriver: KaniIdentityDriver;
  supabaseUrl: string;
  supabasePublishableKey: string;
  householdId: string;
  apiReady: boolean;
  authReady: boolean;
  ready: boolean;
  reason?: string;
}

export type LearnerSyncEnv = KaniRuntimeEnv;

export function resolveLearnerSyncConfig(env: LearnerSyncEnv): LearnerSyncConfig {
  const runtime = resolveKaniRuntimeConfig(env);
  let reason: string | undefined;
  if (!runtime.sync.requested) reason = 'Learner sync is disabled by feature flag.';
  else if (runtime.errors.length > 0) reason = runtime.errors[0];
  else if (!runtime.apiReady) reason = 'Learner API base URL is not configured.';
  else if (!runtime.identityReady) reason = 'Guardian public auth configuration is incomplete.';

  return {
    requested: runtime.sync.requested,
    apiBaseUrl: runtime.sync.apiBaseUrl,
    authDriver: runtime.identity.driver,
    supabaseUrl: runtime.identity.supabaseUrl,
    supabasePublishableKey: runtime.identity.publishableKey,
    householdId: runtime.sync.householdId,
    apiReady: runtime.apiReady,
    authReady: runtime.identityReady,
    ready: runtime.ready,
    reason,
  };
}

export function getLearnerSyncConfig(): LearnerSyncConfig {
  const runtime = getKaniRuntimeConfig();
  return resolveLearnerSyncConfig({
    VITE_KANI_ENV: runtime.environment,
    VITE_KANI_STORAGE_DRIVER: runtime.storage.driver,
    VITE_KANI_SYNC_ENABLED: runtime.sync.requested,
    VITE_KANI_API_BASE_URL: runtime.sync.apiBaseUrl,
    VITE_KANI_HOUSEHOLD_ID: runtime.sync.householdId,
    VITE_KANI_AUTH_DRIVER: runtime.identity.driver,
    VITE_SUPABASE_URL: runtime.identity.supabaseUrl,
    VITE_SUPABASE_PUBLISHABLE_KEY: runtime.identity.publishableKey,
  });
}
