import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import argon2 from "argon2";
import { getRandomValues, randomBytes } from "node:crypto";
import { generateApiToken, generateSecureRandomDelay, hashString, verifyHash } from "../../../src/core/utils/securities";



vi.mock("../../../src/config/AppConfig", () => ({
    default: {
        token_length: 4,
        hash_rounds: 3,
    },
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
