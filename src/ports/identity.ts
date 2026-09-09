export interface GuardianSession {
  userId: string;
  accessToken: string;
  expiresAt?: string;
}

export interface GuardianAccount {
  userId: string;
  email: string;
  expiresAt: string;
}

export interface GuardianSessionProvider {
  getSession(): Promise<GuardianSession | null>;
}

export interface GuardianIdentityProvider extends GuardianSessionProvider {
  signIn(email: string, password: string): Promise<GuardianAccount>;
  signOut(): Promise<void>;
  getAccount(): Promise<GuardianAccount | null>;
}

export class GuardianIdentityError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, options: { status: number; code: string }) {
    super(message);
    this.name = 'GuardianIdentityError';
    this.status = options.status;
    this.code = options.code;
  }
}

export class StaticGuardianSessionProvider implements GuardianSessionProvider {
  constructor(private readonly session: GuardianSession | null) {}

  async getSession(): Promise<GuardianSession | null> {
    return this.session;
  }
}
