import type { UserSafe } from "../../../src/modules/users/users.types";

import JWT from "jsonwebtoken";
import { generateJwt, isJwtFromClosedSession, renewJwt, verifyJwt } from "../../../src/core/utils/jwt";



/* A JWT lasts 30 days and a session 90 days : a session can only reach its maximum duration if its JWT is regenerated */
jest.mock("../../../src/config/AppConfig", () => ({
    __esModule: true,
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
        jest.useFakeTimers();
        jest.setSystemTime(LoginDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });


    /*============*/
    /* Generation */
    /*============*/
    describe('JWT generation', () => {
        it('Generates a JWT which carries the user and the date of the login', async () => {
            const jwt = await generateJwt(UserPayload);

            expect(verifyJwt(jwt)).toMatchObject({ ...UserPayload, session_started_at: LoginDate.getTime() });
        });

        it('Rejects a JWT signed with another key', () => {
            const forgedJwt = JWT.sign(UserPayload, "another-signing-key");

            expect(() => verifyJwt(forgedJwt)).toThrow(expect.objectContaining({ httpStatus: 401 }));
        });
    });


    /*=========*/
    /* Renewal */
    /*=========*/
    describe('JWT renewal', () => {
        it('Keeps the date of the original login through the renewals', async () => {
            const loginJwt = await generateJwt(UserPayload);

            jest.advanceTimersByTime(29 * OneDay);
            const firstRenewedJwt = await renewJwt(loginJwt, UserPayload);

            jest.advanceTimersByTime(29 * OneDay);
            const secondRenewedJwt = await renewJwt(firstRenewedJwt, UserPayload);

            expect(verifyJwt(secondRenewedJwt)).toMatchObject({ session_started_at: LoginDate.getTime() });
        });

        it('Rejects the renewal of a session older than the maximum session duration', async () => {
            let jwt = await generateJwt(UserPayload);

            /* Renewed every 29 days, the JWT never expires : only the age of the session can stop the renewals */
            for (let renewalNumber = 1; renewalNumber <= 3; renewalNumber++) {
                jest.advanceTimersByTime(29 * OneDay);
                jwt = await renewJwt(jwt, UserPayload);
            }

            jest.advanceTimersByTime(29 * OneDay);
            await expect(renewJwt(jwt, UserPayload)).rejects.toMatchObject({ httpStatus: 401 });
        });

        it('Starts the session of a JWT without login date when this JWT was issued', async () => {
            const jwtWithoutLoginDate = JWT.sign(UserPayload, "test-signing-key", { expiresIn: 30 * 24 * 60 * 60 });

            jest.advanceTimersByTime(OneDay);
            const renewedJwt = await renewJwt(jwtWithoutLoginDate, UserPayload);

            expect(verifyJwt(renewedJwt)).toMatchObject({ session_started_at: LoginDate.getTime() });
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
 * Generates then decodes the JWT of a user, as the API receives it : the dates of the user are written as text in a JWT.
 * @param lastLogoutAt Date of the last logout of the user when the JWT is issued
 * @returns User decoded from the JWT
 */
async function decodeJwtOfUserLoggedOutAt(lastLogoutAt: Date): Promise<UserSafe> {
    const jwt = await generateJwt({ ...UserPayload, last_logout_at: lastLogoutAt });
    return verifyJwt(jwt);
}
