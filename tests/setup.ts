// Jest setup - kept minimal for now

/* The API refuses to start without a JWT signing key: the suites which load the real configuration get a test one */
process.env.JWT_SIGNING_KEY = 'test-signing-key';

export {};
