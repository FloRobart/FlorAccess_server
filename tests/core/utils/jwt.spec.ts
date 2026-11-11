import type { UserSafe } from "../../../src/modules/users/users.types";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import JWT from "jsonwebtoken";
import { generateJwt, isJwtFromClosedSession, renewJwt, verifyJwt } from "../../../src/core/utils/jwt";



/* A JWT lasts 30 days and a session 90 days : a session can only reach its maximum duration if its JWT is regenerated */
vi.mock("../../../src/config/AppConfig", () => ({
    default: {
        jwt_signing_key: "test-signing-key",
        jwt_expiration: 30 * 24 * 60 * 60,
        session_max_duration: 90 * 24 * 60 * 60 * 1000,
    },
}));



/**
 * JWT tests
 */
describe('JWT', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(LoginDate);
    });

    afterEach(() => {
        vi.useRealTimers();
    });


    /*============*/
    /* Generation */
    /*============*/
    describe('JWT generation', () => {
        it('Generates a JWT which carries the user and the date of the login', async () => {
            const jwt = await generateJwt(UserPayload);

            expect(verifyJwt(jwt)).toMatchObject({ ...UserPayload, session_started_at: LoginDate.getTime() });
        });

        it('Fails with an application error when the JWT can not be signed', async () => {
            /* A payload which already carries an expiration date can not receive the one of the configuration */
            const payloadWithExpiration = { ...UserPayload, exp: 1 };

            await expect(generateJwt(payloadWithExpiration)).rejects.toMatchObject({ message: "Failed to generate JWT", httpStatus: 500 });
        });

        it('Rejects a JWT signed with another key', () => {
            const forgedJwt = JWT.sign(UserPayload, "another-signing-key");

            expect(() => verifyJwt(forgedJwt)).toThrow(expect.objectContaining({ httpStatus: 401 }));
        });

        it('Signs the JWT with HS256', async () => {
            const jwt = await generateJwt(UserPayload);

            expect(JWT.decode(jwt, { complete: true })?.header.alg).toBe("HS256");
        });

        it('Rejects a JWT signed with another algorithm, even with the right key', () => {
            const jwtWithAnotherAlgorithm = JWT.sign(UserPayload, "test-signing-key", { algorithm: "HS512" });

            expect(() => verifyJwt(jwtWithAnotherAlgorithm)).toThrow(expect.objectContaining({ httpStatus: 401 }));
        });
    });


    /*=========*/
    /* Renewal */
    /*=========*/
    describe('JWT renewal', () => {
        it('Keeps the date of the original login through the renewals', async () => {
            const loginJwt = await generateJwt(UserPayload);

            vi.advanceTimersByTime(29 * OneDay);
            const firstRenewedJwt = await renewJwt(loginJwt, UserPayload);

            vi.advanceTimersByTime(29 * OneDay);
            const secondRenewedJwt = await renewJwt(firstRenewedJwt, UserPayload);

            expect(verifyJwt(secondRenewedJwt)).toMatchObject({ session_started_at: LoginDate.getTime() });
        });

        it('Rejects the renewal of a session older than the maximum session duration', async () => {
            let jwt = await generateJwt(UserPayload);

            /* Renewed every 29 days, the JWT never expires : only the age of the session can stop the renewals */
            for (let renewalNumber = 1; renewalNumber <= 3; renewalNumber++) {
                vi.advanceTimersByTime(29 * OneDay);
                jwt = await renewJwt(jwt, UserPayload);
            }

            vi.advanceTimersByTime(29 * OneDay);
            await expect(renewJwt(jwt, UserPayload)).rejects.toMatchObject({ httpStatus: 401 });
        });

        it('Gives a renewed JWT which expires with its session, never after it', async () => {
            const jwt = await renewJwtEvery29DaysUntilDay87();

            const sessionEndInSeconds: number = (LoginDate.getTime() + 90 * OneDay) / 1000;
            expect(JWT.decode(jwt)).toMatchObject({ exp: sessionEndInSeconds });
        });

        it('Refuses the renewal when less than one second of the session is left, while the JWT itself is still valid', async () => {
            const jwt = await renewJwtEvery29DaysUntilDay87();

            vi.advanceTimersByTime(3 * OneDay - 500);
            expect(() => verifyJwt(jwt)).not.toThrow();
            await expect(renewJwt(jwt, UserPayload)).rejects.toMatchObject({ message: "Session expired, please log in again", httpStatus: 401 });
        });

        it('Starts the session of a JWT without login date when this JWT was issued', async () => {
            const jwtWithoutLoginDate = JWT.sign(UserPayload, "test-signing-key", { expiresIn: 30 * 24 * 60 * 60 });

            vi.advanceTimersByTime(OneDay);
            const renewedJwt = await renewJwt(jwtWithoutLoginDate, UserPayload);

            expect(verifyJwt(renewedJwt)).toMatchObject({ session_started_at: LoginDate.getTime() });
        });

        it('Rejects the renewal of a JWT which carries neither a login date nor an issue date', async () => {
            const jwtWithoutAnyDate = JWT.sign(UserPayload, "test-signing-key", { noTimestamp: true });

            await expect(renewJwt(jwtWithoutAnyDate, UserPayload)).rejects.toMatchObject({ httpStatus: 401 });
        });

        it('Rejects the renewal of an invalid JWT', async () => {
            await expect(renewJwt("not-a-jwt", UserPayload)).rejects.toMatchObject({ httpStatus: 401 });
        });
    });


    /*=================*/
    /* Closed sessions */
    /*=================*/
    describe('JWT of a closed session', () => {
        it('Accepts a JWT issued after the last logout of its user', async () => {
            const lastLogoutAt = new Date("2025-12-24T08:30:15.123Z");
            const jwtUser = await decodeJwtOfUserLoggedOutAt(lastLogoutAt);

            expect(isJwtFromClosedSession(jwtUser, lastLogoutAt)).toBe(false);
        });

        it('Rejects a JWT issued before the last logout of its user', async () => {
            const jwtUser = await decodeJwtOfUserLoggedOutAt(new Date("2025-12-24T08:30:15.123Z"));
            const laterLogoutAt = new Date("2025-12-31T23:59:59.000Z");

            expect(isJwtFromClosedSession(jwtUser, laterLogoutAt)).toBe(true);
        });

        it('Rejects a JWT which does not carry the date of the last logout', async () => {
            const jwtUser = verifyJwt(await generateJwt(UserPayload));

            expect(isJwtFromClosedSession(jwtUser, new Date())).toBe(true);
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
const OneDay: number = 24 * 60 * 60 * 1000;
const LoginDate: Date = new Date("2026-01-01T10:00:00.000Z");

const UserPayload = {
    id: 1,
    email: "test1@test.fr",
    pseudo: "Pseudo",
};

/**
 * Logs in, then renews the JWT every 29 days, until 87 days after the login: 3 days before the end of the session.
 * @returns The JWT of the last renewal
 */
async function renewJwtEvery29DaysUntilDay87(): Promise<string> {
    let jwt: string = await generateJwt(UserPayload);

    for (let renewalNumber = 1; renewalNumber <= 3; renewalNumber++) {
        vi.advanceTimersByTime(29 * OneDay);
        jwt = await renewJwt(jwt, UserPayload);
    }

    return jwt;
}

/**
 * Generates then decodes the JWT of a user, as the API receives it : the dates of the user are written as text in a JWT.
 * @param lastLogoutAt Date of the last logout of the user when the JWT is issued
 * @returns User decoded from the JWT
 */
async function decodeJwtOfUserLoggedOutAt(lastLogoutAt: Date): Promise<UserSafe> {
    const jwt = await generateJwt({ ...UserPayload, last_logout_at: lastLogoutAt });
    return verifyJwt(jwt);
}
