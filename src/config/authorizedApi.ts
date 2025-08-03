/**
 * Save in database the authorized API by default.
 * This function can be used to initialize the authorized API configuration.
 */
export async function initAuthorizedApi(): Promise<void> {
    const authorizedApis: string[] = process.env.AUTHORIZED_API?.split(',').map(api => api.trim()) || [];

    for (const api of authorizedApis) {
        // TODO : Save each authorized API to the database
    }
}