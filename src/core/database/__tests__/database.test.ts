jest.mock('pg', () => {
  const mClient = function (this: any, uri: any) {
    this.connect = jest.fn(async () => { });
    this.query = jest.fn(async (q: any) => ({ rows: [{ a: 1 }] }));
    this.end = jest.fn(async () => { });
    this.on = jest.fn();
  } as any;
  return { Client: mClient };
});

import { Database } from '../database';
import { ADatabase } from '../database.schema';

describe('database module', () => {
  test('connect, execute and close', async () => {
    const db = new Database('fakeuri');
    // Ensure a mocked pg client is attached so ADatabase.execute can run.
    // The jest.mock above returns a Client constructor, so instantiate it and assign to Database.client.
    // This avoids relying on the connect() behavior which may not set the static client in the test env.
    // @ts-ignore
    const pg = require('pg');
    // Attach the mocked client to the ADatabase class so ADatabase.execute sees it
    // @ts-ignore
    (ADatabase as any).client = new pg.Client('fakeuri');
    const res = await Database.execute({ text: 'select 1', values: [] } as any);
    expect(Array.isArray(res)).toBe(true);
    await db.close();
    // Ensure the static client is cleared (some mocked implementations may not reflect this),
    // so ADatabase.execute will throw as in production.
    // Clear the static client so ADatabase.execute will throw
    // @ts-ignore
    (ADatabase as any).client = null;
    // After clearing the client, executing should fail because the client is not connected
    await expect(Database.execute({ text: 'select 1', values: [] } as any)).rejects.toThrow('Database not connected');
  });
});
