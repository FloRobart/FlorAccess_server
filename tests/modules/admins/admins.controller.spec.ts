import type { NextFunction, Request, Response } from "express";
import type { UserAdmin } from "../../../src/modules/admins/admins.types";

import { describe, it, expect, vi } from "vitest";
import * as AdminsController from "../../../src/modules/admins/admins.controller";
import * as AdminsService from "../../../src/modules/admins/admins.service";
import { AppError } from "../../../src/core/models/AppError.model";
import { buildNext, buildRequest, buildResponse } from "../../fixtures/express.fixtures";
import { buildUser } from "../users/users.fixtures";



vi.mock("../../../src/config/AppConfig", () => ({
    default: { app_name: "Floraccess" },
}));

/* The service is replaced, only the reading of the request and the response sent are tested */
vi.mock("../../../src/modules/admins/admins.service", () => ({
    insertUser: vi.fn(),
    selectUsers: vi.fn(),
    countUsers: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    sendVerifyEmail: vi.fn(),
    sendEmailAdmin: vi.fn(),
}));



/**
 * Administrators controller tests
 */
describe('Administrators controller', () => {
    /*==========*/
    /* Success */
    /*==========*/
    describe('Success of the service', () => {
        it('Registers a user from the API itself and sends him with a 201 status', async () => {
            vi.mocked(AdminsService.insertUser).mockResolvedValue(UserAdmin);
            const response = buildResponse();

            await AdminsController.insertUser(buildRequest({ body: { validatedData: UserToInsert } }), response, buildNext());

            expect(AdminsService.insertUser).toHaveBeenCalledWith(UserToInsert, "Floraccess");
            expect(response.status).toHaveBeenCalledWith(201);
            expect(response.send).toHaveBeenCalledWith(UserAdmin);
        });

        it('Sends one page of the users', async () => {
            vi.mocked(AdminsService.selectUsers).mockResolvedValue([UserAdmin]);
            const response = buildResponse();

            await AdminsController.selectUsers(buildRequest({ body: { validatedData: { limit: "10", offset: "5" } } }), response, buildNext());

            expect(AdminsService.selectUsers).toHaveBeenCalledWith({ limit: 10, offset: 5 });
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith([UserAdmin]);
        });

        it('Sends the number of users', async () => {
            vi.mocked(AdminsService.countUsers).mockResolvedValue(42);
            const response = buildResponse();

            await AdminsController.countUsers(buildRequest(), response, buildNext());

            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith({ count: 42 });
        });

        it('Updates the user of the URL and sends him', async () => {
            vi.mocked(AdminsService.updateUser).mockResolvedValue(UserAdmin);
            const response = buildResponse();

            await AdminsController.updateUser(buildRequest({ body: { validatedData: { userId: "1", pseudo: "New pseudo" } } }), response, buildNext());

            expect(AdminsService.updateUser).toHaveBeenCalledWith(1, { pseudo: "New pseudo" });
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.json).toHaveBeenCalledWith(UserAdmin);
        });

        it('Deletes the user of the URL and answers with an empty 200 response', async () => {
            vi.mocked(AdminsService.deleteUser).mockResolvedValue();
            const response = buildResponse();

            await AdminsController.deleteUser(buildRequest({ body: { validatedData: { userId: "1" } } }), response, buildNext());

            expect(AdminsService.deleteUser).toHaveBeenCalledWith(1);
            expect(response.status).toHaveBeenCalledWith(200);
            expect(response.send).toHaveBeenCalledWith();
        });

        it('Sends the verification email and answers with the users who received it', async () => {
            vi.mocked(AdminsService.sendVerifyEmail).mockResolvedValue([1, 2]);
            const response = buildResponse();

            await AdminsController.sendVerifyEmail(buildRequest({ body: { validatedData: { userIdList: [1, 2] } } }), response, buildNext());

            expect(AdminsService.sendVerifyEmail).toHaveBeenCalledWith([1, 2]);
            expect(response.json).toHaveBeenCalledWith([1, 2]);
        });

        it('Sends an email from the administrators and answers with the users who received it', async () => {
            vi.mocked(AdminsService.sendEmailAdmin).mockResolvedValue([1]);
            const response = buildResponse();

            await AdminsController.sendEmailAdmin(buildRequest({ body: { validatedData: EmailAdmin } }), response, buildNext());

            expect(AdminsService.sendEmailAdmin).toHaveBeenCalledWith(EmailAdmin);
            expect(response.json).toHaveBeenCalledWith([1]);
        });
    });


    /*========*/
    /* Errors */
    /*========*/
    describe('Errors of the service', () => {
        const failingHandlers: FailingHandlerCase[] = [
            { name: 'insertUser', handler: AdminsController.insertUser, serviceFunction: AdminsService.insertUser, validatedData: UserToInsert },
            { name: 'selectUsers', handler: AdminsController.selectUsers, serviceFunction: AdminsService.selectUsers, validatedData: {} },
            { name: 'countUsers', handler: AdminsController.countUsers, serviceFunction: AdminsService.countUsers, validatedData: {} },
            { name: 'updateUser', handler: AdminsController.updateUser, serviceFunction: AdminsService.updateUser, validatedData: { userId: "1" } },
            { name: 'deleteUser', handler: AdminsController.deleteUser, serviceFunction: AdminsService.deleteUser, validatedData: { userId: "1" } },
            { name: 'sendVerifyEmail', handler: AdminsController.sendVerifyEmail, serviceFunction: AdminsService.sendVerifyEmail, validatedData: { userIdList: [1] } },
            { name: 'sendEmailAdmin', handler: AdminsController.sendEmailAdmin, serviceFunction: AdminsService.sendEmailAdmin, validatedData: EmailAdmin },
        ];

        it.each(failingHandlers)('$name gives the error of the service to the error handler', async ({ handler, serviceFunction, validatedData }) => {
            const serviceError = new AppError("Service failure", 500);
            vi.mocked(serviceFunction).mockRejectedValue(serviceError);
            const response = buildResponse();
            const next = buildNext();

            await handler(buildRequest({ body: { validatedData: validatedData } }), response, next);

            expect(next).toHaveBeenCalledWith(serviceError);
            expect(response.status).not.toHaveBeenCalled();
        });

        it('Gives an invalid query to the error handler', async () => {
            const next = buildNext();

            await AdminsController.selectUsers(buildRequest({ body: { validatedData: { limit: "0" } } }), buildResponse(), next);

            expect(AdminsService.selectUsers).not.toHaveBeenCalled();
            expect(next).toHaveBeenCalledTimes(1);
        });
    });
});


/*===========*/
/* Test data */
/*===========*/
type FailingHandlerCase = {
    name: string;
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    serviceFunction: (...args: any[]) => Promise<unknown>;
    validatedData: unknown;
};

const UserToInsert = {
    email: "test1@test.fr",
    pseudo: "Pseudo",
};

const EmailAdmin = {
    userIdList: [1],
    object: "Maintenance",
    message: "The API will be stopped tonight.",
};

const UserAdmin = { ...buildUser(), updated_at: new Date() } as UserAdmin;
