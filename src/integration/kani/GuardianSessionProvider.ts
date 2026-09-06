export interface GuardianSession {
  userId: string;
  accessToken: string;
  expiresAt?: string;
}

/**
 * Runtime-neutral guardian auth seam. The Kani learner API depends on this
 * interface rather than importing Supabase Auth throughout product code.
 */
export interface GuardianSessionProvider {
  getSession(): Promise<GuardianSession | null>;
}

export class StaticGuardianSessionProvider implements GuardianSessionProvider {
  constructor(private readonly session: GuardianSession | null) {}

  async getSession(): Promise<GuardianSession | null> {
    return this.session;
  }
}
