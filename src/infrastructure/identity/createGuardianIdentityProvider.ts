import type { KaniIdentityDriver } from '../../config/kaniRuntimeConfig';
import type { GuardianIdentityProvider } from '../../ports/identity';
import { SupabaseGuardianIdentityProvider } from './supabase/SupabaseGuardianIdentityProvider';

export interface GuardianIdentityFactoryConfig {
  driver: KaniIdentityDriver;
  endpoint: string;
  publicKey: string;
}

/** Composition root: provider selection and provider-specific option mapping stay here. */
export function createGuardianIdentityProvider(config: GuardianIdentityFactoryConfig): GuardianIdentityProvider {
  switch (config.driver) {
    case 'supabase':
      return new SupabaseGuardianIdentityProvider({
        supabaseUrl: config.endpoint,
        publishableKey: config.publicKey,
      });
    default: {
      const unreachable: never = config.driver;
      throw new Error(`Unsupported guardian identity driver: ${String(unreachable)}`);
    }
  }
}
