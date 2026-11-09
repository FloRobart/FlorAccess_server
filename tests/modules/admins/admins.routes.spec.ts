import { describe, it, expect, vi } from "vitest";
import adminsRouter from "../../../src/modules/admins/admins.routes";
import * as AdminsController from "../../../src/modules/admins/admins.controller";
import { findRoute, getRegisteredRoutes } from "../../fixtures/router.fixtures";



/* The controllers are replaced, only the routes and their middlewares are tested */
vi.mock("../../../src/modules/admins/admins.controller", () => ({
    insertUser: vi.fn(),
    selectUsers: vi.fn(),
    countUsers: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    sendVerifyEmail: vi.fn(),
    sendEmailAdmin: vi.fn(),
}));



/**
 * Administrators routes tests
 */
describe('Administrators routes', () => {
    const expectedRoutes: [string, string, unknown, number][] = [
        /* Method, path, controller, number of middlewares before the controller */
        ['post', '/user', AdminsController.insertUser, 1],
        ['get', '/users', AdminsController.selectUsers, 1],
        ['get', '/users/count', AdminsController.countUsers, 0],
        ['put', '/user/:userId', AdminsController.updateUser, 2],
        ['delete', '/user/:userId', AdminsController.deleteUser, 1],
        ['post', '/users/send/verify-email', AdminsController.sendVerifyEmail, 1],
        ['post', '/users/send/email', AdminsController.sendEmailAdmin, 1],
    ];


    it('Registers only the expected routes', () => {
        const registeredRoutes = getRegisteredRoutes(adminsRouter).map((route) => [route.method, route.path]);

        expect(registeredRoutes).toStrictEqual(expectedRoutes.map(([method, path]) => [method, path]));
    });

    it.each(expectedRoutes)('%s %s validates the request then calls its controller', (method, path, controller, middlewareCount) => {
        const route = findRoute(adminsRouter, method, path)!;

        expect(route.handlers).toHaveLength(middlewareCount + 1);
        expect(route.handlers[route.handlers.length - 1]).toBe(controller);
    });
});
