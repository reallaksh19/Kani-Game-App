import { describe, expect, it } from 'vitest';
import { buildPrimaryMissionHash, parsePrimaryMissionOpaqueId } from './primaryMissionLocation';

describe('primaryMissionLocation', () => {
  it('prefers a GitHub-Pages-safe hash route', () => {
    expect(parsePrimaryMissionOpaqueId({ hash: '#/primary/m/p4fe7k2q' })).toBe('P4FE7K2Q');
  });

  it('also accepts direct path and query compatibility routes', () => {
    expect(parsePrimaryMissionOpaqueId({ pathname: '/Kani-Game-App/primary/m/P4FE7K2Q' })).toBe('P4FE7K2Q');
    expect(parsePrimaryMissionOpaqueId({ search: '?mission=p4fe7k2q' })).toBe('P4FE7K2Q');
  });

  it('rejects malformed or learner-bearing mission tokens', () => {
    expect(parsePrimaryMissionOpaqueId({ hash: '#/primary/m/student_123' })).toBeNull();
    expect(parsePrimaryMissionOpaqueId({ search: '?mission=P4FE7K2Q-extra' })).toBeNull();
  });

  it('builds an opaque hash route without learner identity or answer state', () => {
    const hash = buildPrimaryMissionHash('p4fe7k2q');
    expect(hash).toBe('#/primary/m/P4FE7K2Q');
    expect(hash).not.toMatch(/student|answer|mastery/i);
  });
});
