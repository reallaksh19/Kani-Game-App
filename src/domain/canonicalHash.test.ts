import { describe, expect, it } from 'vitest';
import { canonicalSha256, sha256Hex } from './canonicalHash';

const encoder = new TextEncoder();

describe('canonical SHA-256', () => {
  it('matches the standard SHA-256 abc vector', () => {
    expect(sha256Hex(encoder.encode('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('hashes object keys independently of insertion order', () => {
    expect(canonicalSha256({ b: 2, a: 1 })).toBe('43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777');
    expect(canonicalSha256({ a: 1, b: 2 })).toBe(canonicalSha256({ b: 2, a: 1 }));
  });

  it('preserves array order because arrays are semantic', () => {
    expect(canonicalSha256([1, 2])).not.toBe(canonicalSha256([2, 1]));
  });
});
