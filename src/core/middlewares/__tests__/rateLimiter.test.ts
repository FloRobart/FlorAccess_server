import { limiter } from '../rateLimiter';

describe('rateLimiter', ()=>{
  test('limiter is a function/object', ()=>{
    expect(limiter).toBeDefined();
  });
});
