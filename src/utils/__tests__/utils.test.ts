import { normalizePort, generateUserToken, isValidEmail, isValidRequestBody } from '../utils';
import config from '../../config/config';

describe('utils', () => {
  test('normalizePort returns null for non-number', () => {
    expect(normalizePort('abc')).toBeNull();
  });

  test('normalizePort clamps values', () => {
    expect(normalizePort('70000')).toBe(65535);
    expect(normalizePort('-1')).toBe(0);
    expect(typeof normalizePort('3000')).toBe('number');
  });

  test('generateUserToken contains userid and expiration', () => {
    const token = generateUserToken(42, 4);
    expect(token).toMatch(/^[0-9a-f]+\.[0-9]+\.[0-9]+$/);
    const parts = token.split('.');
    expect(Number(parts[2])).toBe(42);
  });

  test('isValidEmail recognizes valid and invalid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });

  test('isValidRequestBody validates fields and arrays', () => {
    expect(isValidRequestBody({ a: '1', b: ["x", "y"] }, ['a', 'b'])).toBe(true);
    expect(isValidRequestBody({ a: '', b: 'x' }, ['a'])).toBe(false);
    expect(isValidRequestBody(null, ['a'])).toBe(false);
    expect(isValidRequestBody({ a: [] }, ['a'])).toBe(false);
  });

  test('isValidRequestBody accepts numbers and booleans and array last empty', () => {
    expect(isValidRequestBody({ n: 0, b: false }, ['n', 'b'])).toBe(true);
    expect(isValidRequestBody({ a: ['ok', ''] }, ['a'])).toBe(false);
  });
});
