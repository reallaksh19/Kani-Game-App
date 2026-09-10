import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { KaniApiApp } from '../../../application/api/KaniApiApp';
import { TestRequestIdentityProvider } from '../../identity/test/TestRequestIdentityProvider';
import { SQLiteStore } from '../../storage/sqlite/SQLiteStore';
import { createKaniNodeServer } from './createKaniNodeServer';

const HOUSEHOLD = '11111111-1111-4111-8111-111111111111';

describe('Node HTTP adapter over connector-free SQLite Kani API', () => {
  const cleanup: Array<() => void> = [];
  afterEach(() => cleanup.splice(0).reverse().forEach((fn) => fn()));

  it('serves health and authenticated API traffic over a real socket', async () => {
    const store = new SQLiteStore();
    cleanup.push(() => store.close());
    await store.households.put({ householdId: HOUSEHOLD });
    await store.memberships.put({ householdId: HOUSEHOLD, userId: 'guardian_http', role: 'guardian' });
    await store.students.put({ householdId: HOUSEHOLD, studentId: 'student_http', name: 'Alex', avatar: '🧑‍🚀', grade: '4' });

    const app = new KaniApiApp({
      store,
      identityProvider: new TestRequestIdentityProvider({ environment: 'test' }),
      allowedOrigins: ['https://reallaksh19.github.io'],
    });
    const server = createKaniNodeServer(app);
    cleanup.push(() => server.close());
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const { port } = server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}`;

    const live = await fetch(`${base}/health/live`);
    expect(live.status).toBe(200);
    expect(await live.json()).toEqual({ status: 'ok' });

    const students = await fetch(`${base}/api/v1/students`, {
      headers: { Authorization: 'Bearer test:guardian_http' },
    });
    expect(students.status).toBe(200);
    const body = await students.json() as { students: Array<{ id: string }> };
    expect(body.students.map((student) => student.id)).toEqual(['student_http']);
  });
});
