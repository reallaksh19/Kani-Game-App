import { describe, expect, it } from 'vitest';
import { TestRequestIdentityProvider } from './TestRequestIdentityProvider';

describe('TestRequestIdentityProvider', () => {
  it('refuses non-test environments', () => {
    expect(() => new TestRequestIdentityProvider({ environment: 'staging' })).toThrow(/restricted to the test environment/i);
    expect(() => new TestRequestIdentityProvider({ environment: 'production' })).toThrow(/restricted to the test environment/i);
  });

  it('derives a synthetic identity only from the explicit test token prefix', async () => {
    const provider = new TestRequestIdentityProvider({ environment: 'test' });
    const request = new Request('http://kani.test/api/v1/students', { headers: { Authorization: 'Bearer test:guardian_a' } });
    await expect(provider.verifyRequest(request)).resolves.toMatchObject({ userId: 'guardian_a' });
    await expect(provider.verifyRequest(new Request('http://kani.test'))).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});
