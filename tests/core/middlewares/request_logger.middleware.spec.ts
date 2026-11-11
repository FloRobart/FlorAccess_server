import type { Request, Response } from "express";

import { describe, it, expect, vi, beforeEach } from "vitest";
import morgan from "morgan";
import { getLoggedReferrer, getLoggedUrl, getLoggedUser, redactUrlSecrets, requestLogger } from "../../../src/core/middlewares/request_logger.middleware";
import { verifyJwt } from "../../../src/core/utils/jwt";
import { AppError } from "../../../src/core/models/AppError.model";
import { buildRequest } from "../../fixtures/express.fixtures";



vi.mock("../../../src/config/AppConfig", () => ({
    default: { log_format: "combined" },
}));

/* Only the JWT of the tests is valid, it belongs to a user whose email address must never reach the logs */
vi.mock("../../../src/core/utils/jwt", () => ({
    verifyJwt: vi.fn(),
}));



/**
 * Request logger tests
 */
describe('Request logger', () => {
    beforeEach(() => {
        vi.mocked(verifyJwt).mockImplementation((token: string) => {
            if (token !== ValidJwt) { throw new AppError("Invalid JWT", 401); }
            return { id: 42, email: PrivateEmail } as ReturnType<typeof verifyJwt>;
        });
    });


    /*======*/
    /* User */
    /*======*/
    describe('User of the request', () => {
        it('Names the user of a valid JWT by his ID, never by his email address', () => {
            const request = buildRequest({ headers: { authorization: `Bearer ${ValidJwt}` } });

            expect(getLoggedUser(request)).toBe("user-42");
        });

        it('Names "Unknown User" a request without JWT', () => {
            expect(getLoggedUser(buildRequest())).toBe("Unknown User");
            expect(getLoggedUser(buildRequest({ headers: { authorization: "Bearer" } }))).toBe("Unknown User");
        });

        it('Names "Unknown User" a request with an invalid JWT', () => {
            const request = buildRequest({ headers: { authorization: "Bearer invalid-jwt" } });

            expect(getLoggedUser(request)).toBe("Unknown User");
        });
    });


    /*=========*/
    /* Secrets */
    /*=========*/
    describe('Tokens of the links sent by email', () => {
        it('Hides the token of a link, and keeps the other parameters', () => {
            expect(redactUrlSecrets("/users/email/verify/1?token=abcdef0123&application=Econoris&domain=null"))
                .toBe("/users/email/verify/1?token=[REDACTED]&application=Econoris&domain=null");
        });

        it('Hides the token wherever it is in the query, whatever its case', () => {
            expect(redactUrlSecrets("/users/login/block/1?lang=fr&TOKEN=abcdef0123#form")).toBe("/users/login/block/1?lang=fr&TOKEN=[REDACTED]#form");
        });

        it('Keeps the URL which carries no token', () => {
            expect(redactUrlSecrets("/users/login/request")).toBe("/users/login/request");
            expect(redactUrlSecrets("/users?tokenless=1")).toBe("/users?tokenless=1");
        });

        it('Keeps an undefined URL', () => {
            expect(redactUrlSecrets(undefined)).toBeUndefined();
        });

        it('Reads the URL requested before the routing, otherwise the current one', () => {
            expect(getLoggedUrl(buildRequest({ originalUrl: "/users/login/block/1?token=abc", url: "/1?token=abc" }))).toBe("/users/login/block/1?token=[REDACTED]");
            expect(getLoggedUrl(buildRequest({ originalUrl: "", url: "/1?token=abc" }))).toBe("/1?token=[REDACTED]");
        });

        it('Hides the token of the page which sent the request, given as referrer', () => {
            const request = buildRequestWithHeaders({ referer: "https://api.floraccess.florobart.fr/users/login/block/1?token=abc" });

            expect(getLoggedReferrer(request)).toBe("https://api.floraccess.florobart.fr/users/login/block/1?token=[REDACTED]");
            expect(getLoggedReferrer(buildRequestWithHeaders({}))).toBeUndefined();
        });
    });


    /*========*/
    /* morgan */
    /*========*/
    describe('Access log lines', () => {
        it('Replaces the tokens of morgan which would write the email address or the tokens', () => {
            const morganTokens = morgan as unknown as Record<string, (req: Request) => string | undefined>;
            const request = buildRequestWithHeaders({
                authorization: `Bearer ${ValidJwt}`,
                referer: "https://api.floraccess.florobart.fr/users/email/verify/1?token=abc",
            }, {
                originalUrl: "/users/email/verify/1?token=abc",
            });

            expect(morganTokens["remote-user"](request)).toBe("user-42");
            expect(morganTokens["url"](request)).toBe("/users/email/verify/1?token=[REDACTED]");
            expect(morganTokens["referrer"](request)).toBe("https://api.floraccess.florobart.fr/users/email/verify/1?token=[REDACTED]");
        });

        it('Writes a combined log line without the email address of the user nor the tokens of the links', () => {
            /* The predefined formats are properties of morgan at runtime, but its types do not declare them */
            const combinedFormat: string = (morgan as unknown as Record<string, string>).combined;
            const formatLine = morgan.compile(combinedFormat);
            const request = buildRequestWithHeaders({
                authorization: `Bearer ${ValidJwt}`,
                referer: "https://api.floraccess.florobart.fr/users/login/block/1?token=secret-block-token",
                "user-agent": "Test agent",
            }, {
                method: "POST",
                originalUrl: "/users/login/block/1?token=secret-block-token",
            });
            const response = { statusCode: 200, headersSent: true, getHeader: () => "1234" } as unknown as Response;

            const line = formatLine(morgan as unknown as morgan.TokenIndexer, request, response) as string;

            expect(line).toContain("user-42");
            expect(line).toContain("POST /users/login/block/1?token=[REDACTED]");
            expect(line).not.toContain(PrivateEmail);
            expect(line).not.toContain("secret-block-token");
        });

        it('Gives a middleware of Express', () => {
            expect(requestLogger).toBeTypeOf("function");
            expect(requestLogger).toHaveLength(3);
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
const ValidJwt: string = "valid-jwt";
const PrivateEmail: string = "private-address@test.fr";

/**
 * Builds a request whose headers can also be read with req.get(), like the requests of Express.
 * @param headers Headers of the request, in lower case
 * @param overrides Other fields of the request
 * @returns Request object
 */
function buildRequestWithHeaders(headers: Record<string, string>, overrides: Record<string, unknown> = {}): Request {
    return buildRequest({
        headers: headers,
        get: (headerName: string) => headers[headerName.toLowerCase()],
        httpVersionMajor: 1,
        httpVersionMinor: 1,
        ip: "127.0.0.1",
        ...overrides,
    });
}
