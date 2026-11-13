import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';



export default defineConfig({
    /* Maps the TypeScript alias to the real path (@ --> src/) */
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },

    test: {
        environment: 'node',

        /* Location and naming of the test files */
        include: ['tests/**/*.spec.ts'],

        /* File executed before each test file (global setup) */
        setupFiles: ['tests/setup.ts'],

        /* Clears the calls of the mocks between each test, their implementation is kept */
        clearMocks: true,

        /* Code coverage: every file of src counts, even the ones no test imports */
        coverage: {
            provider: 'v8',
            reportsDirectory: 'coverage',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/app.ts', /* Entry point of the Express application */
                'src/server.ts', /* Entry point of the server */
                'src/swagger/**', /* Swagger documentation */
                'src/config/**', /* Configuration */
                'src/**/*.types.ts', /* Types only, no code to run */
            ],

            /* Any line, branch or function without test makes the tests fail */
            thresholds: {
                100: true,
            },
        },
    },
});
