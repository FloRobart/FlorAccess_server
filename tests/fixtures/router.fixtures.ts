import type { Router } from "express";



/**
 * Route registered on a router of Express, as the tests read it.
 */
export type RegisteredRoute = {
    method: string;
    path: string;
    handlers: unknown[];
};


/**
 * Lists the routes registered on a router, with the middlewares and the controller of each one, in their order.
 * @param router Router of Express to read
 * @returns Routes of the router
 */
export function getRegisteredRoutes(router: Router): RegisteredRoute[] {
    return router.stack
        .filter((layer) => layer.route !== undefined)
        .map((layer) => ({
            method: Object.keys((layer.route as unknown as { methods: Record<string, boolean> }).methods)[0],
            path: layer.route!.path as string,
            handlers: layer.route!.stack.map((routeLayer) => routeLayer.handle),
        }));
}


/**
 * Finds the route registered for a method and a path.
 * @param router Router of Express to read
 * @param method HTTP method of the route, in lowercase
 * @param path Path of the route
 * @returns The route, or undefined if no route matches
 */
export function findRoute(router: Router, method: string, path: string): RegisteredRoute | undefined {
    return getRegisteredRoutes(router).find((route) => route.method === method && route.path === path);
}
