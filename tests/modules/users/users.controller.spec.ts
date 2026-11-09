import type { NextFunction, Request, Response } from "express";
import type { UserSafe } from "../../../src/modules/users/users.types";

import { describe, it, expect, vi } from "vitest";
import * as UsersController from "../../../src/modules/users/users.controller";
import * as UsersService from "../../../src/modules/users/users.service";
import { AppError } from "../../../src/core/models/AppError.model";
import { buildNext, buildRequest, buildResponse } from "../../fixtures/express.fixtures";



vi.mock("../../../src/config/AppConfig", () => ({
    default: { app_name: "Floraccess" },
}));

/* The service is replaced, only the reading of the request and the response sent are tested */
vi.mock("../../../src/modules/users/users.service", () => ({
    insertUser: vi.fn(),
    selectUser: vi.fn(),
    regenerateJwt: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    userLoginRequest: vi.fn(),
    userLoginConfirm: vi.fn(),
    getUserLoginBlockPage: vi.fn(),
    blockUserLogin: vi.fn(),
    logoutUser: vi.fn(),
    UserEmailVerify: vi.fn(),
}));



/**
 * Users controller tests
 */
describe('Users controller', () => {
    /*==============*/
    /* Registration */
    /*==============*/
    describe('Registration', () => {
        it('Registers the user from the application and the IP address of the request', async () => {
            vi.mocked(UsersService.insertUser).mockResolvedValue(SignedJwt);
            const request = buildRequest({ ip: "127.0.0.1", body: { validatedData: { ...UserToInsert, application: "Econoris", domain: "econoris.fr" } } });
            const response = buildResponse();

            await UsersController.insertUser(request, response, buildNext());

            expect(UsersService.insertUser).toHaveBeenCalledWith(UserToInsert, "127.0.0.1", "Econoris", "econoris.fr");
            expect(response.status).toHaveBeenCalledWith(201);
            expect(response.json).toHaveBeenCalledWith({ jwt: SignedJwt });
        });

        it('Registers the user from the API itself when no application and no valid IP address are given', async () => {
            vi.mocked(UsersService.insertUser).mockResolvedValue(SignedJwt);
            const request = buildRequest({ ip: undefined, body: { validatedData: UserToInsert } });

            await UsersController.insertUser(request, buildResponse(), buildNext());

            expect(UsersService.insertUser).toHaveBeenCalledWith(UserToInsert, null, "Floraccess", null);
        });
    });


    /*==================*/
    /* IP of the client */
    /*==================*/
    describe('IP address of the client', () => {
        it('Gives the IP address of the request to the login request, or null when it is not valid', async () => {
            vi.mocked(UsersService.userLoginRequest).mockResolvedValue(LoginToken);
            const loginRequest = { email: "test1@test.fr" };

            await UsersController.userLoginRequest(buildRequest({ ip: "::1", body: { validatedData: loginRequest } }), buildResponse(), buildNext());
            await UsersController.userLoginRequest(buildRequest({ ip: "unknown", body: { validatedData: loginRequest } }), buildResponse(), buildNext());

            expect(UsersService.userLoginRequest).toHaveBeenNthCalledWith(1, loginRequest, "::1");
            expect(UsersService.userLoginRequest).toHaveBeenNthCalledWith(2, loginRequest, null);
        });

        it('Gives the IP address of the request to the login confirmation, or null when it is not valid', async () => {
            vi.mocked(UsersService.userLoginConfirm).mockResolvedValue(SignedJwt);

            await UsersController.userLoginConfirm(buildRequest({ ip: "127.0.0.1", body: { validatedData: LoginConfirm } }), buildResponse(), buildNext());
            await UsersController.userLoginConfirm(buildRequest({ ip: undefined, body: { validatedData: LoginConfirm } }), buildResponse(), buildNext());

            expect(UsersService.userLoginConfirm).toHaveBeenNthCalledWith(1, { ...LoginConfirm, ip: "127.0.0.1" });
            expect(UsersService.userLoginConfirm).toHaveBeenNthCalledWith(2, { ...LoginConfirm, ip: null });
        });
    });


    /*=================*/
    /* JSON responses */
    /*=================*/
    describe('Responses in JSON', () => {
        const jsonHandlers: JsonHandlerCase[] = [
            {
                name: 'selectUser',
                handler: UsersController.selectUser,
                mockService: () => vi.mocked(UsersService.selectUser).mockResolvedValue(SelectedUser),
                request: buildRequest({ headers: { authorization: `Bearer ${Jwt}` } }),
                expectedServiceArguments: [Jwt],
                expectedBody: SelectedUser,
            },{
                name: 'regenerateJwt',
                handler: UsersController.regenerateJwt,
                mockService: () => vi.mocked(UsersService.regenerateJwt).mockResolvedValue(SignedJwt),
                request: buildRequest({ headers: { authorization: `Bearer ${Jwt}` } }),
                expectedServiceArguments: [Jwt],
                expectedBody: { jwt: SignedJwt },
            },{
                name: 'updateUser',
                handler: UsersController.updateUser,
                mockService: () => vi.mocked(UsersService.updateUser).mockResolvedValue(SignedJwt),
                request: buildRequest({ headers: { authorization: `Bearer ${Jwt}` }, body: { validatedData: UserToInsert } }),
                expectedServiceArguments: [UserToInsert, Jwt],
                expectedBody: { jwt: SignedJwt },
            },{
                name: 'deleteUser',
                handler: UsersController.deleteUser,
                mockService: () => vi.mocked(UsersService.deleteUser).mockResolvedValue(),
                request: buildRequest({ headers: { authorization: `Bearer ${Jwt}` } }),
                expectedServiceArguments: [Jwt],
                expectedBody: { message: 'User deleted successfully.' },
            },{
                name: 'userLoginRequest',
                handler: UsersController.userLoginRequest,
                mockService: () => vi.mocked(UsersService.userLoginRequest).mockResolvedValue(LoginToken),
                request: buildRequest({ ip: "127.0.0.1", body: { validatedData: { email: "test1@test.fr" } } }),
                expectedServiceArguments: [{ email: "test1@test.fr" }, "127.0.0.1"],
                expectedBody: { token: LoginToken },
            },{
                name: 'userLoginConfirm',
                handler: UsersController.userLoginConfirm,
                mockService: () => vi.mocked(UsersService.userLoginConfirm).mockResolvedValue(SignedJwt),
                request: buildRequest({ ip: "127.0.0.1", body: { validatedData: LoginConfirm } }),
                expectedServiceArguments: [{ ...LoginConfirm, ip: "127.0.0.1" }],
                expectedBody: { jwt: SignedJwt },
            },{
                name: 'logoutUser',
                handler: UsersController.logoutUser,
                mockService: () => vi.mocked(UsersService.logoutUser).mockResolvedValue(),
                request: buildRequest({ headers: { authorization: `Bearer ${Jwt}` } }),
                expectedServiceArguments: [Jwt],
                expectedBody: { message: 'User logged out successfully.' },
            },
        ];

        it.each(jsonHandlers)('$name sends the result of the service with a 200 status', async ({ handler, mockService, request, expectedServiceArguments, expectedBody }) => {
            const serviceFunction = mockService();
            const response = buildResponse();

            await handler(request, response, buildNext());

            expect(serviceFunction).toHaveBeenCalledWith(...expectedServiceArguments);
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith(expectedBody);
        });
    });


    /*================*/
    /* HTML responses */
    /*================*/
    describe('Responses in HTML', () => {
        const htmlHandlers: HtmlHandlerCase[] = [
            {
                name: 'userLoginBlockPage',
                handler: UsersController.userLoginBlockPage,
                mockService: () => vi.mocked(UsersService.getUserLoginBlockPage).mockResolvedValue(PageHtml),
                validatedData: EmailLink,
            },{
                name: 'userLoginBlock',
                handler: UsersController.userLoginBlock,
                mockService: () => vi.mocked(UsersService.blockUserLogin).mockResolvedValue(PageHtml),
                validatedData: EmailLink,
            },{
                name: 'UserEmailVerify',
                handler: UsersController.UserEmailVerify,
                mockService: () => vi.mocked(UsersService.UserEmailVerify).mockResolvedValue(PageHtml),
                validatedData: { ...EmailLink, application: "Econoris", domain: "econoris.fr" },
            },
        ];

        it.each(htmlHandlers)('$name sends the page built by the service', async ({ handler, mockService, validatedData }) => {
            const serviceFunction = mockService();
            const response = buildResponse();

            await handler(buildRequest({ body: { validatedData: validatedData } }), response, buildNext());

            expect(serviceFunction).toHaveBeenCalledWith(validatedData);
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.type).toHaveBeenCalledWith('html');
            expect(response.send).toHaveBeenCalledWith(PageHtml);
        });
    });


    /*========*/
    /* Errors */
    /*========*/
    describe('Errors of the service', () => {
        const serviceError = new AppError("Service failure", 500);
        const authorizedRequest = () => buildRequest({ headers: { authorization: `Bearer ${Jwt}` }, body: { validatedData: UserToInsert } });

        const failingHandlers: FailingHandlerCase[] = [
            { name: 'insertUser', handler: UsersController.insertUser, serviceFunction: UsersService.insertUser, request: authorizedRequest },
            { name: 'selectUser', handler: UsersController.selectUser, serviceFunction: UsersService.selectUser, request: authorizedRequest },
            { name: 'regenerateJwt', handler: UsersController.regenerateJwt, serviceFunction: UsersService.regenerateJwt, request: authorizedRequest },
            { name: 'updateUser', handler: UsersController.updateUser, serviceFunction: UsersService.updateUser, request: authorizedRequest },
            { name: 'deleteUser', handler: UsersController.deleteUser, serviceFunction: UsersService.deleteUser, request: authorizedRequest },
            { name: 'logoutUser', handler: UsersController.logoutUser, serviceFunction: UsersService.logoutUser, request: authorizedRequest },
            { name: 'userLoginRequest', handler: UsersController.userLoginRequest, serviceFunction: UsersService.userLoginRequest, request: () => buildRequest({ body: { validatedData: { email: "test1@test.fr" } } }) },
            { name: 'userLoginConfirm', handler: UsersController.userLoginConfirm, serviceFunction: UsersService.userLoginConfirm, request: () => buildRequest({ body: { validatedData: LoginConfirm } }) },
            { name: 'userLoginBlockPage', handler: UsersController.userLoginBlockPage, serviceFunction: UsersService.getUserLoginBlockPage, request: () => buildRequest({ body: { validatedData: EmailLink } }) },
            { name: 'userLoginBlock', handler: UsersController.userLoginBlock, serviceFunction: UsersService.blockUserLogin, request: () => buildRequest({ body: { validatedData: EmailLink } }) },
            { name: 'UserEmailVerify', handler: UsersController.UserEmailVerify, serviceFunction: UsersService.UserEmailVerify, request: () => buildRequest({ body: { validatedData: EmailLink } }) },
        ];

        it.each(failingHandlers)('$name gives the error of the service to the error handler', async ({ handler, serviceFunction, request }) => {
            vi.mocked(serviceFunction).mockRejectedValue(serviceError);
            const response = buildResponse();
            const next = buildNext();

            await handler(request(), response, next);

            expect(next).toHaveBeenCalledWith(serviceError);
            expect(response.status).not.toHaveBeenCalled();
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

type JsonHandlerCase = {
    name: string;
    handler: Handler;
    mockService: () => unknown;
    request: Request;
    expectedServiceArguments: unknown[];
    expectedBody: unknown;
};

type HtmlHandlerCase = {
    name: string;
    handler: Handler;
    mockService: () => unknown;
    validatedData: unknown;
};

type FailingHandlerCase = {
    name: string;
    handler: Handler;
    serviceFunction: (...args: any[]) => Promise<unknown>;
    request: () => Request;
};

const Jwt: string = "header.payload.signature";
const SignedJwt: string = "signed-jwt";
const LoginToken: string = "login-token";
const PageHtml: string = "<html>page</html>";

const UserToInsert = {
    email: "test1@test.fr",
    pseudo: "Pseudo",
};

const LoginConfirm = {
    email: "test1@test.fr",
    token: LoginToken,
    secret: "123456",
};

const EmailLink = {
    userId: "1",
    token: "abcdef",
};

const SelectedUser: UserSafe = {
    id: 1,
    email: "test1@test.fr",
    pseudo: "Pseudo",

    auth_methods_id: 1,
    is_connected: true,
    is_verified_email: true,
    last_logout_at: new Date(),

    created_at: new Date(),
};
