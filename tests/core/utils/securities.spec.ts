import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import argon2 from "argon2";
import { createHash, getRandomValues, randomBytes } from "node:crypto";
import { generateApiToken, generateSecureRandomDelay, hashString, hashToken, verifyHash, verifyToken } from "../../../src/core/utils/securities";



/* The configuration is shared with the tests, so that a test can load the module again with another JWT signing key */
const { mockedAppConfig } = vi.hoisted(() => ({
    mockedAppConfig: {
        token_length: 4,
        hash_rounds: 3,
        jwt_signing_key: "test-signing-key",
    },
}));

vi.mock("../../../src/config/AppConfig", () => ({
    default: mockedAppConfig,
}));

/* Argon2 is slow on purpose : it is replaced, only the options given to it are tested */
vi.mock("argon2", () => ({
    default: {
        argon2id: 2,
        hash: vi.fn(),
        verify: vi.fn(),
    },
}));

/* The real random functions are kept, the tests can replace them to choose their result or make them fail */
vi.mock("node:crypto", async (importOriginal) => {
    const actualCrypto = await importOriginal<typeof import("node:crypto")>();

    return {
        ...actualCrypto,
        getRandomValues: vi.fn(actualCrypto.getRandomValues),
        randomBytes: vi.fn(actualCrypto.randomBytes),
    };
});



/**
 * Securities tests
 */
describe('Securities', () => {
    /*==============*/
    /* Random delay */
    /*==============*/
    describe('Secure random delay', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });


        it('Waits the random number of milliseconds drawn below the maximum delay', async () => {
            useRandomValue(25);
            let isDelayOver = false;

            generateSecureRandomDelay(10).then(() => { isDelayOver = true; });

            /* 25 modulo 11 possible delays (0 to 10 ms) gives 3 ms */
            await vi.advanceTimersByTimeAsync(2);
            expect(isDelayOver).toBe(false);

            await vi.advanceTimersByTimeAsync(1);
            expect(isDelayOver).toBe(true);
        });

        it('Waits at most one second by default', async () => {
            useRandomValue(1000);
            let isDelayOver = false;

            generateSecureRandomDelay().then(() => { isDelayOver = true; });

            await vi.advanceTimersByTimeAsync(999);
            expect(isDelayOver).toBe(false);

            await vi.advanceTimersByTimeAsync(1);
            expect(isDelayOver).toBe(true);
        });

        it('Does not wait when no random value can be drawn', async () => {
            vi.mocked(getRandomValues).mockImplementationOnce(() => { throw new Error("No entropy"); });

            await expect(generateSecureRandomDelay()).resolves.toBeUndefined();
        });
    });


    /*===========*/
    /* API token */
    /*===========*/
    describe('API token', () => {
        beforeEach(() => {
            /* A random value of 0 removes the random delay */
            vi.mocked(getRandomValues).mockImplementation((array) => array);
        });


        it('Generates a hexadecimal token of the length of the configuration', async () => {
            const token = await generateApiToken();

            expect(token).toMatch(/^[0-9a-f]{8}$/);
        });

        it('Generates a token of the given length', async () => {
            const token = await generateApiToken(16);

            expect(token).toMatch(/^[0-9a-f]{32}$/);
        });

        it('Generates a different token each time', async () => {
            const [firstToken, secondToken] = await Promise.all([generateApiToken(16), generateApiToken(16)]);

            expect(firstToken).not.toBe(secondToken);
        });

        it('Fails when no random bytes can be drawn', async () => {
            vi.mocked(randomBytes).mockImplementationOnce(() => { throw new Error("No entropy"); });

            await expect(generateApiToken()).rejects.toMatchObject({ message: "Failed to generate API token", httpStatus: 500 });
        });
    });


    /*=========*/
    /* Hashing */
    /*=========*/
    describe('Hashing', () => {
        it('Hashes with Argon2id and the number of rounds of the configuration', async () => {
            vi.mocked(argon2.hash).mockResolvedValue("hashed-value");

            await expect(hashString("secret")).resolves.toBe("hashed-value");
            expect(argon2.hash).toHaveBeenCalledWith("secret", { type: argon2.argon2id, timeCost: 3, parallelism: 1 });
        });

        it('Gives the failure of the hashing to the caller', async () => {
            vi.mocked(argon2.hash).mockRejectedValue(new Error("Hashing failed"));

            await expect(hashString("secret")).rejects.toThrow("Hashing failed");
        });

        it('Verifies a value against its hash', async () => {
            vi.mocked(argon2.verify).mockResolvedValue(true);

            await expect(verifyHash("secret", "hashed-value")).resolves.toBe(true);
            expect(argon2.verify).toHaveBeenCalledWith("hashed-value", "secret");
        });

        it('Gives the failure of the verification to the caller', async () => {
            vi.mocked(argon2.verify).mockRejectedValue(new Error("pchstr must contain a $ as first char"));

            await expect(verifyHash("secret", "not-a-hash")).rejects.toThrow("pchstr must contain a $ as first char");
        });
    });


    /*===============*/
    /* Token hashing */
    /*===============*/
    describe('Token hashing', () => {
        it('Hashes a token into 64 hexadecimal characters, always the same for the same token', () => {
            const tokenHash = hashToken("random-token");

            expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
            expect(hashToken("random-token")).toBe(tokenHash);
            expect(hashToken("other-token")).not.toBe(tokenHash);
        });

        it('Uses a key: the hash is not the plain SHA-256 of the token', () => {
            const plainHash = createHash("sha256").update("random-token").digest("hex");

            expect(hashToken("random-token")).not.toBe(plainHash);
        });

        it('Derives its key from the JWT signing key: another signing key gives other hashes', async () => {
            const tokenHash = hashToken("random-token");

            mockedAppConfig.jwt_signing_key = "other-signing-key";
            vi.resetModules();
            const reloadedSecurities = await import("../../../src/core/utils/securities");
            mockedAppConfig.jwt_signing_key = "test-signing-key";

            expect(reloadedSecurities.hashToken("random-token")).not.toBe(tokenHash);
        });

        it('Does not use Argon2, which costs a lot of processor time', () => {
            hashToken("random-token");

            expect(argon2.hash).not.toHaveBeenCalled();
        });

        it('Accepts the token whose hash is stored', async () => {
            await expect(verifyToken("random-token", hashToken("random-token"))).resolves.toBe(true);
            expect(argon2.verify).not.toHaveBeenCalled();
        });

        it('Rejects another token', async () => {
            await expect(verifyToken("other-token", hashToken("random-token"))).resolves.toBe(false);
        });

        it('Rejects a stored hash which does not have the length of a hash', async () => {
            await expect(verifyToken("random-token", "abc123")).resolves.toBe(false);
        });

        it('Checks the Argon2 hashes stored before the use of HMAC with Argon2, so that the links already sent keep working', async () => {
            const argon2Hash = "$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA";
            vi.mocked(argon2.verify).mockResolvedValue(true);

            await expect(verifyToken("random-token", argon2Hash)).resolves.toBe(true);
            expect(argon2.verify).toHaveBeenCalledWith(argon2Hash, "random-token");
        });

        it('Rejects a wrong token against an Argon2 hash', async () => {
            vi.mocked(argon2.verify).mockResolvedValue(false);

            await expect(verifyToken("other-token", "$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA")).resolves.toBe(false);
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
/**
 * Makes the next random draw give a chosen value.
 * @param randomValue Value written in the array given to getRandomValues
 */
function useRandomValue(randomValue: number): void {
    vi.mocked(getRandomValues).mockImplementationOnce((array) => {
        (array as Uint32Array)[0] = randomValue;
        return array;
    });
}
