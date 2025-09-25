jest.mock('pg', () => {
  const mClient = function(this: any, uri: any) {
    this.connect = jest.fn(async () => {});
    this.query = jest.fn(async (q: any) => ({ rows: [{ a: 1 }] }));
    this.end = jest.fn(async () => {});
    this.on = jest.fn();
  } as any;
  return { Client: mClient };
});

import { connectToDatabase, executeQuery, closeDatabaseConnection } from '../database';

describe('database module', ()=>{
  test('connect and executeQuery and close', async ()=>{
    await connectToDatabase('fakeuri');
    const res = await executeQuery({ text: 'select 1', values: [] } as any);
    expect(Array.isArray(res)).toBe(true);
    const closed = await closeDatabaseConnection();
    expect(closed).toBe(true);
  });
});
