process.env.JWT_SIGNING_KEY = process.env.JWT_SIGNING_KEY || 'testkey';
// re-import after setting env to ensure config uses the test key
jest.resetModules();
jest.mock('../../../modules/users/users.repository', () => ({
  getUserByEmail: jest.fn(async (email: string) => ({
    users_id: 1,
    users_email: email,
    users_name: 'test',
    users_authmethod: 'local'
  }))
}));
import * as securities from '../securities';
import config from '../../../config/config';
import argon2 from 'argon2';
import JWT from 'jsonwebtoken';

describe('securities', () => {
  test('hashString and verifyHash', async () => {
    const plain = 'password123';
    const hash = await securities.hashString(plain);
    expect(typeof hash).toBe('string');
    const ok = await securities.verifyHash(plain, hash);
    expect(ok).toBe(true);
    const notOk = await securities.verifyHash('wrong', hash);
    expect(notOk).toBe(false);
  });

  test('getJwt and verifyJwt', async () => {
    const user = { users_id: 1, users_email: 'a@b.c', users_name: 'test', users_authmethod: 'local' } as any;
    process.env.JWT_SIGNING_KEY = 'testkey';
    // regenerate config.jwt_signing_key from process.env isn't automatic; but getJwt uses config which reads env at import time.
    // To ensure deterministic behavior, directly sign and verify using config.jwt_signing_key
    const token = await securities.getJwt(user);
    expect(typeof token).toBe('string');
    const verified = await securities.verifyJwt(token);
    expect(verified).not.toBeNull();
    if (verified) {
      expect(verified.users_email).toBe('a@b.c');
    }
  });

  test('getJwt throws on invalid user', async () => {
    await expect(securities.getJwt({} as any)).rejects.toThrow();
  });

  test('verifyJwt returns null for mismatched user', async () => {
    // create a token with a different email so getUserByEmail returns user that doesn't match
    const payload = { userid: 2, email: 'nope@x.y', name: 'no', authmethod: 'local' };
    const token = JWT.sign(payload, process.env.JWT_SIGNING_KEY || 'testkey');
    const res = await securities.verifyJwt(token);
    expect(res).toBeNull();
  });

  test('generateApiToken returns hex string of expected length', async () => {
    const t = await securities.generateApiToken(8);
    expect(typeof t).toBe('string');
    expect(t.length).toBe(16); // 8 bytes -> 16 hex chars
  });

  test('generateCode generates correct length and chars', async () => {
    const code = await securities.generateCode(6);
    expect(code).toHaveLength(6);
    for (const c of code) {
      expect(config.code_data_set).toContain(c);
    }
  });

  test('hashString rethrows on argon2.hash error', async () => {
    const spy = jest.spyOn(argon2, 'hash').mockImplementationOnce(() => { throw new Error('hashfail'); });
    await expect(securities.hashString('x')).rejects.toThrow('hashfail');
    spy.mockRestore();
  });

  test('verifyHash rethrows on argon2.verify error', async () => {
    const spy = jest.spyOn(argon2, 'verify').mockImplementationOnce(() => { throw new Error('verifyfail'); });
    await expect(securities.verifyHash('x', 'h')).rejects.toThrow('verifyfail');
    spy.mockRestore();
  });

  test('verifyJwt rethrows on JWT.verify throwing', async () => {
    const jwtSpy = jest.spyOn(JWT, 'verify').mockImplementationOnce(() => { throw new Error('jwtfail'); });
    await expect(securities.verifyJwt('bad')).rejects.toThrow('jwtfail');
    jwtSpy.mockRestore();
  });

  test('generateApiToken rethrows on randomBytes error', async () => {
    const crypto = require('node:crypto');
    const spy = jest.spyOn(crypto, 'randomBytes').mockImplementationOnce(() => { throw new Error('rbfail'); });
    await expect(securities.generateApiToken(4)).rejects.toThrow('rbfail');
    spy.mockRestore();
  });

  // Skipping direct mocking of node:crypto.getRandomValues because it's a read-only native binding
});
