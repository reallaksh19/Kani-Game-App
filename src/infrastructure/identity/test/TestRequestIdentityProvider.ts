import type { AuthenticatedRequestIdentity, RequestIdentityProvider } from '../../../ports/identity';
import { RequestIdentityError } from '../../../ports/identity';

export interface TestRequestIdentityProviderOptions {
  environment: 'development' | 'test' | 'staging' | 'production';
  tokenPrefix?: string;
}

/**
 * CI-only identity adapter. Tokens are deliberately synthetic and are never
 * accepted outside the explicit test environment. E4 supplies production-grade
 * identity verification; this adapter must never become a staging/prod escape hatch.
 */
export class TestRequestIdentityProvider implements RequestIdentityProvider {
  private readonly tokenPrefix: string;

  constructor(options: TestRequestIdentityProviderOptions) {
    if (options.environment !== 'test') {
      throw new Error('TestRequestIdentityProvider is restricted to the test environment.');
    }
    this.tokenPrefix = options.tokenPrefix ?? 'test:';
  }

  async verifyRequest(request: Request): Promise<AuthenticatedRequestIdentity> {
    const authorization = request.headers.get('authorization') ?? '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new RequestIdentityError('Bearer authentication is required.');
    const token = match[1].trim();
    if (!token.startsWith(this.tokenPrefix)) {
      throw new RequestIdentityError('Test identity token is invalid.', { code: 'INVALID_TOKEN' });
    }
    const userId = token.slice(this.tokenPrefix.length).trim();
    if (!userId) throw new RequestIdentityError('Test identity userId is missing.', { code: 'INVALID_TOKEN' });
    return { userId, claims: { sub: userId, testIdentity: true } };
  }
}
