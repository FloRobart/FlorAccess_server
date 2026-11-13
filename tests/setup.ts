/* Vitest setup, executed before each test file */

/* The API refuses to start without a JWT signing key: the suites which load the real configuration get a test one */
process.env.JWT_SIGNING_KEY = 'test-signing-key';

/* The API also refuses tokens shorter than 32 characters: a local .env with an older value must not stop the tests */
process.env.TOKEN_LENGTH = '64';

export {};
