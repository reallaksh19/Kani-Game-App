import type { KaniIdentityDriver } from '../../config/kaniRuntimeConfig';
import type { GuardianIdentityProvider } from '../../ports/identity';
import { SupabaseGuardianIdentityProvider } from './supabase/SupabaseGuardianIdentityProvider';

export interface GuardianIdentityFactoryConfig {
  driver: KaniIdentityDriver;
  supabaseUrl: string;
  publishableKey: string;
}

/** Composition root: provider selection is confined to infrastructure. */
export function createGuardianIdentityProvider(config: GuardianIdentityFactoryConfig): GuardianIdentityProvider {
  switch (config.driver) {
    case 'supabase':
      return new SupabaseGuardianIdentityProvider({
        supabaseUrl: config.supabaseUrl,
        publishableKey: config.publishableKey,
      });
    default: {
      const unreachable: never = config.driver;
      throw new Error(`Unsupported guardian identity driver: ${String(unreachable)}`);
    }
  }
}
