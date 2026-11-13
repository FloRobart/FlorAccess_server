import type { NextFunction, Request, Response } from "express";
import type { Mock } from "vitest";

import { vi } from "vitest";



/**
 * Response of Express whose methods are mocks, to check what a middleware or a controller sends.
 */
export type MockedResponse = Response & {
    status: Mock;
    json: Mock;
    send: Mock;
    type: Mock;
};


/**
 * Builds a request of Express for the tests.
 * @param overrides Fields which replace the default ones (body, params, query, headers, ip...)
 * @returns Request object
 */
export function buildRequest(overrides: Record<string, unknown> = {}): Request {
    return {
        body: {},
        params: {},
        query: {},
        headers: {},

        ...overrides,
    } as unknown as Request;
}


/**
 * Builds a response of Express whose methods can be chained, like res.status(200).json(...).
 * @returns Response object with mocked methods
 */
export function buildResponse(): MockedResponse {
    const response = {
        status: vi.fn(),
        json: vi.fn(),
        send: vi.fn(),
        type: vi.fn(),
    };

    response.status.mockReturnValue(response);
    response.json.mockReturnValue(response);
    response.send.mockReturnValue(response);
    response.type.mockReturnValue(response);

    return response as unknown as MockedResponse;
}


/**
 * Builds the next function of Express.
 * @returns Mocked next function
 */
export function buildNext(): NextFunction & Mock {
    return vi.fn() as NextFunction & Mock;
}
