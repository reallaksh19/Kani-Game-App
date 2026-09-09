import {
  getKaniRuntimeConfig,
  KaniIdentityDriver,
  KaniRuntimeConfig,
  KaniRuntimeEnv,
  resolveKaniRuntimeConfig,
} from '../../config/kaniRuntimeConfig';

export interface LearnerSyncConfig {
  requested: boolean;
  apiBaseUrl: string;
  identity: {
    driver: KaniIdentityDriver;
    endpoint: string;
    publicKey: string;
  };
  /** @deprecated compatibility fields; product UI should use `identity`. */
  authDriver: KaniIdentityDriver;
  /** @deprecated compatibility field. */
  supabaseUrl: string;
  /** @deprecated compatibility field. */
  supabasePublishableKey: string;
  householdId: string;
  apiReady: boolean;
  authReady: boolean;
  ready: boolean;
  reason?: string;
}

export type LearnerSyncEnv = KaniRuntimeEnv;

function fromRuntime(runtime: KaniRuntimeConfig): LearnerSyncConfig {
  let reason: string | undefined;
  if (!runtime.sync.requested) reason = 'Learner sync is disabled by feature flag.';
  else if (runtime.errors.length > 0) reason = runtime.errors[0];
  else if (!runtime.apiReady) reason = 'Learner API base URL is not configured.';
  else if (!runtime.identityReady) reason = 'Guardian public auth configuration is incomplete.';

  return {
    requested: runtime.sync.requested,
    apiBaseUrl: runtime.sync.apiBaseUrl,
    identity: {
      driver: runtime.identity.driver,
      endpoint: runtime.identity.supabaseUrl,
      publicKey: runtime.identity.publishableKey,
    },
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

export function resolveLearnerSyncConfig(env: LearnerSyncEnv): LearnerSyncConfig {
  return fromRuntime(resolveKaniRuntimeConfig(env));
}

export function getLearnerSyncConfig(): LearnerSyncConfig {
  return fromRuntime(getKaniRuntimeConfig());
}
