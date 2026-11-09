import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';



/* The .env of the developer must not change the result of the tests: only the variables set here are read */
jest.mock('dotenv', () => ({
    __esModule: true,
    default: { config: jest.fn() },
}));



/**
 * AppConfig secrets tests
 */
describe('AppConfig secrets tests', () => {
    const originalEnvironment = process.env;
    let temporaryDirectory: string;


    /**
     * Loads a fresh copy of AppConfig, because it reads the environment when it is imported.
     * @returns The configuration built from the current environment
     */
    function loadAppConfig() {
        let appConfig;

        jest.isolateModules(() => {
            appConfig = require('../../src/config/AppConfig').default;
        });

        return appConfig as any;
    }


    /**
     * Writes a secret in the temporary directory.
     * @param fileName The name of the file
     * @param content The content of the file
     * @returns The path of the file
     */
    function writeSecretFile(fileName: string, content: string): string {
        const secretFile = path.join(temporaryDirectory, fileName);
        fs.writeFileSync(secretFile, content);

        return secretFile;
    }


    beforeEach(() => {
        process.env = { ...originalEnvironment };

        delete process.env.DB_PASSWORD;
        delete process.env.DB_PASSWORD_FILE;
        delete process.env.MAIL_PASSWORD;
        delete process.env.MAIL_PASSWORD_FILE;
        delete process.env.JWT_SIGNING_KEY;
        delete process.env.JWT_SIGNING_KEY_FILE;

        process.env.DB_SCHEME = 'postgresql';
        process.env.DB_USER = 'floraccess';
        process.env.DB_HOST = 'floraccess-database';
        process.env.DB_NAME = 'floraccess';

        temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'floraccess-secrets-'));
    });


    afterEach(() => {
        process.env = originalEnvironment;
        fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    });


    /*==================*/
    /* Without any file */
    /*==================*/
    describe('Without any secret file', () => {
        it('Reads the secrets from the variables', () => {
            process.env.DB_PASSWORD = 'database-from-variable';
            process.env.MAIL_PASSWORD = 'mail-from-variable';
            process.env.JWT_SIGNING_KEY = 'jwt-from-variable';

            const appConfig = loadAppConfig();

            expect(appConfig.db_uri).toBe('postgresql://floraccess:database-from-variable@floraccess-database:5432/floraccess');
            expect(appConfig.mail_password).toBe('mail-from-variable');
            expect(appConfig.jwt_signing_key).toBe('jwt-from-variable');
        });

        it('Keeps the same values as before when the database and mail passwords are not set', () => {
            process.env.JWT_SIGNING_KEY = 'jwt-from-variable';

            const appConfig = loadAppConfig();

            expect(appConfig.db_uri).toBe('postgresql://floraccess:undefined@floraccess-database:5432/floraccess');
            expect(appConfig.mail_password).toBe('');
        });

        it('Stops when no JWT signing key is set, instead of using a default one', () => {
            expect(() => loadAppConfig()).toThrow('JWT_SIGNING_KEY or JWT_SIGNING_KEY_FILE must be set');
        });

        it('Stops when the JWT signing key is empty', () => {
            process.env.JWT_SIGNING_KEY = '';

            expect(() => loadAppConfig()).toThrow('JWT_SIGNING_KEY or JWT_SIGNING_KEY_FILE must be set');
        });
    });


    /*===================*/
    /* With secret files */
    /*===================*/
    describe('With secret files', () => {
        it('Prefers the files to the variables, without their line break', () => {
            process.env.DB_PASSWORD = 'database-from-variable';
            process.env.MAIL_PASSWORD = 'mail-from-variable';
            process.env.JWT_SIGNING_KEY = 'jwt-from-variable';
            process.env.DB_PASSWORD_FILE = writeSecretFile('db_password', 'database-from-file\n');
            process.env.MAIL_PASSWORD_FILE = writeSecretFile('mail_password', 'mail-from-file\n');
            process.env.JWT_SIGNING_KEY_FILE = writeSecretFile('jwt_signing_key', 'jwt-from-file\n');

            const appConfig = loadAppConfig();

            expect(appConfig.db_uri).toBe('postgresql://floraccess:database-from-file@floraccess-database:5432/floraccess');
            expect(appConfig.mail_password).toBe('mail-from-file');
            expect(appConfig.jwt_signing_key).toBe('jwt-from-file');
        });

        it('Stops when a file cannot be read', () => {
            process.env.JWT_SIGNING_KEY_FILE = path.join(temporaryDirectory, 'missing');

            expect(() => loadAppConfig()).toThrow();
        });

        it('Stops when the JWT signing key file is empty', () => {
            process.env.JWT_SIGNING_KEY = 'jwt-from-variable';
            process.env.JWT_SIGNING_KEY_FILE = writeSecretFile('jwt_signing_key', '\n');

            expect(() => loadAppConfig()).toThrow('JWT_SIGNING_KEY or JWT_SIGNING_KEY_FILE must be set');
        });
    });
});
