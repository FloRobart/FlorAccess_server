import { describe, it, expect, vi } from "vitest";
import usersRouter from "../../../src/modules/users/users.routes";
import * as UsersController from "../../../src/modules/users/users.controller";
import { findRoute, getRegisteredRoutes } from "../../fixtures/router.fixtures";



/* The controllers are replaced, only the routes and their middlewares are tested */
vi.mock("../../../src/modules/users/users.controller", () => ({
    insertUser: vi.fn(),
    selectUser: vi.fn(),
    regenerateJwt: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    userLoginRequest: vi.fn(),
    userLoginConfirm: vi.fn(),
    userLoginBlockPage: vi.fn(),
    userLoginBlock: vi.fn(),
    logoutUser: vi.fn(),
    UserEmailVerify: vi.fn(),
}));



/**
 * Users routes tests
 */
describe('Users routes', () => {
    const expectedRoutes: [string, string, unknown, number][] = [
        /* Method, path, controller, number of middlewares before the controller */
        ['post', '/', UsersController.insertUser, 2],
        ['get', '/', UsersController.selectUser, 1],
        ['get', '/jwt', UsersController.regenerateJwt, 1],
        ['put', '/', UsersController.updateUser, 2],
        ['delete', '/', UsersController.deleteUser, 1],
        ['post', '/login/request', UsersController.userLoginRequest, 1],
        ['post', '/login/confirm', UsersController.userLoginConfirm, 1],
        ['get', '/login/block/:userId', UsersController.userLoginBlockPage, 1],
        ['post', '/login/block/:userId', UsersController.userLoginBlock, 1],
        ['post', '/logout', UsersController.logoutUser, 1],
        ['get', '/email/verify/:userId', UsersController.UserEmailVerify, 1],
    ];


    it('Registers only the expected routes', () => {
        const registeredRoutes = getRegisteredRoutes(usersRouter).map((route) => [route.method, route.path]);

        expect(registeredRoutes).toStrictEqual(expectedRoutes.map(([method, path]) => [method, path]));
    });

    it.each(expectedRoutes)('%s %s validates the request then calls its controller', (method, path, controller, middlewareCount) => {
        const route = findRoute(usersRouter, method, path)!;

        expect(route.handlers).toHaveLength(middlewareCount + 1);
        expect(route.handlers[route.handlers.length - 1]).toBe(controller);
    });
});
